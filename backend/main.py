from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime, timedelta
import os

from ml.resume_parser import parse_resume
from ml.rag_engine import career_ai
from ml.rag_engine import career_ai

app = FastAPI(title="AI Career Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = "mongodb+srv://iamrobotttt78_db_user:RtnJP2lmIssfWgv8@cluster0.i4juwbg.mongodb.net/"
client = AsyncIOMotorClient(MONGO_URI)
db = client.ai_career_db

# Security Auth
SECRET_KEY = "SUPER_SECRET_KEY_FOR_JWT"
ALGORITHM = "HS256"

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    query: str
    user_id: str

class RoadmapRequest(BaseModel):
    user_id: str
    target_level: str


@app.get("/")
def read_root():
    return {"status": "AI Career Intelligence System is running"}

@app.post("/api/auth/register")
async def register_user(user: UserRegister):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(new_user)
    
    token = jwt.encode({"sub": str(result.inserted_id), "name": user.name}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "user_id": str(result.inserted_id), "name": user.name}

@app.post("/api/auth/login")
async def login_user(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    is_valid = bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"].encode('utf-8'))
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    token = jwt.encode({"sub": str(db_user["_id"]), "name": db_user["name"]}, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "user_id": str(db_user["_id"]), "name": db_user["name"]}

@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    content = await file.read()
    
    # 1. Extract Text
    parsed_data = parse_resume(content)
    
    # 2. Deep LLM Analysis
    analysis = career_ai.analyze_resume(parsed_data['text'])
    
    # 3. Construct Profile
    profile = {
        "user_id": user_id,
        "filename": file.filename,
        "email": parsed_data['email'],
        "skills": analysis['skills'],
        "experience_years": parsed_data['experience_years'],
        "predicted_level": analysis['predicted_level'],
        "predicted_salary": analysis['predicted_salary_lpa'],
        "missing_skills": analysis['missing_skills'],
        "match_percentage": analysis['match_percentage'],
        "suggested_companies": analysis['suggested_companies'],
        "resume_text": parsed_data['text'],
        "timestamp": datetime.utcnow()
    }
    
    # 6. Save to MongoDB
    await db.profiles.insert_one(profile)
    
    # Remove ObjectId for JSON serialization
    profile.pop('_id', None)
    
    return {
        "message": "Resume processed successfully",
        "profile": profile
    }

@app.post("/api/chat")
async def chat_with_bot(request: ChatRequest):
    # Retrieve user's profile from DB to feed into the Groq AI
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    context = ""
    if profile:
        context = f"Level: {profile['predicted_level']} | Salary: {profile['predicted_salary']} LPA | Skills: {', '.join(profile['skills'])}\nResume Content:\n{profile.get('resume_text', '')}"
        
    response = career_ai.chat(request.query, context)
    
    # Save chat history to DB
    await db.chats.insert_one({
        "user_id": request.user_id,
        "query": request.query,
        "response": response,
        "timestamp": datetime.utcnow()
    })
    
    return {"response": response}

@app.post("/api/roadmap/update")
async def update_roadmap(request: RoadmapRequest):
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    gap_analysis = career_ai.get_dynamic_roadmap(profile['skills'], request.target_level)
    
    return {
        "target_level": request.target_level,
        "missing_skills": gap_analysis['missing_skills'],
        "match_percentage": gap_analysis['match_percentage'],
        "suggested_companies": gap_analysis['suggested_companies']
    }

