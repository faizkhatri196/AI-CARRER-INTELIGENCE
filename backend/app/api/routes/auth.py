import re
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from app.database.connection import db
from app.models.schemas import UserRegister, UserLogin, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
async def register_user(user: UserRegister):
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", user.email):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    existing = await db.users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed = hash_password(user.password)
    user_doc = {
        "name": user.name,
        "email": user.email.lower(),
        "password": hashed,
        "role": user.role,
        "organization": user.organization or "Independent",
        "created_at": datetime.utcnow().isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "name": user.name, "role": user.role})
    return TokenResponse(
        token=token,
        user_id=user_id,
        name=user.name,
        email=user.email.lower(),
        role=user.role,
        organization=user.organization
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email.lower()})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials.")

    if not verify_password(user.password, db_user.get("password", "")):
        raise HTTPException(status_code=400, detail="Invalid credentials.")

    user_id = str(db_user.get("_id") or db_user.get("id"))
    token = create_access_token({
        "sub": user_id,
        "name": db_user.get("name", "User"),
        "role": db_user.get("role", "candidate")
    })

    return TokenResponse(
        token=token,
        user_id=user_id,
        name=db_user.get("name", "User"),
        email=db_user.get("email", ""),
        role=db_user.get("role", "candidate"),
        organization=db_user.get("organization")
    )
