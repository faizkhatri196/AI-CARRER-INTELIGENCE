import re
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from app.database.connection import db
from app.models.schemas import UserRegister, UserLogin, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
async def register_user(user: UserRegister):
    clean_email = (user.email or "").strip().lower()
    clean_name = (user.name or "").strip()
    clean_password = (user.password or "").strip()

    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", clean_email):
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid address (e.g. name@example.com).")

    if len(clean_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    existing = await db.users.find_one({"email": clean_email})
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered. Please sign in instead.")

    hashed = hash_password(clean_password)
    user_doc = {
        "name": clean_name or "User",
        "email": clean_email,
        "password": hashed,
        "role": user.role or "candidate",
        "organization": (user.organization or "").strip() or "Independent",
        "created_at": datetime.utcnow().isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "name": clean_name or "User", "role": user.role or "candidate"})
    return TokenResponse(
        token=token,
        user_id=user_id,
        name=clean_name or "User",
        email=clean_email,
        role=user.role or "candidate",
        organization=user.organization
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    clean_email = (user.email or "").strip().lower()
    clean_password = (user.password or "").strip()

    db_user = await db.users.find_one({"email": clean_email})
    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="No account found with this email. Please click 'Create Account' to register."
        )

    if not verify_password(clean_password, db_user.get("password", "")):
        raise HTTPException(
            status_code=400,
            detail="Incorrect password. Please verify and try again."
        )

    user_id = str(db_user.get("_id") or db_user.get("id"))
    user_name = db_user.get("name", "User")
    user_role = db_user.get("role", "candidate")

    token = create_access_token({
        "sub": user_id,
        "name": user_name,
        "role": user_role
    })

    return TokenResponse(
        token=token,
        user_id=user_id,
        name=user_name,
        email=clean_email,
        role=user_role,
        organization=db_user.get("organization")
    )

