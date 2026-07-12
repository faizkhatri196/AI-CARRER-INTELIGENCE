import os

# 1. Load env variables manually from .env if present before importing ML libraries
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime
import logging

from ml.resume_parser import parse_resume
from ml.rag_engine import career_ai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(title="AI Career Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import json
import uuid
import pymongo.errors
from bson import ObjectId

class FallbackInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class FallbackCollection:
    def __init__(self, db_wrapper, name):
        self.db_wrapper = db_wrapper
        self.name = name

    async def find_one(self, filter_query, sort=None):
        if not self.db_wrapper.use_local:
            try:
                mongo_coll = self.db_wrapper.mongo_db[self.name]
                if sort:
                    res = await mongo_coll.find_one(filter_query, sort=sort)
                else:
                    res = await mongo_coll.find_one(filter_query)
                return res
            except Exception as e:
                logger.error(f"MongoDB error on find_one for '{self.name}': {e}. Falling back to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_find_one(self.name, filter_query, sort)

    async def insert_one(self, document):
        if not self.db_wrapper.use_local:
            try:
                mongo_coll = self.db_wrapper.mongo_db[self.name]
                res = await mongo_coll.insert_one(document)
                return res
            except Exception as e:
                logger.error(f"MongoDB error on insert_one for '{self.name}': {e}. Falling back to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_insert_one(self.name, document)

class FallbackDatabase:
    def __init__(self, mongo_uri, db_name="ai_career_db"):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.use_local = False
        self.local_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "local_db.json"))
        
        os.makedirs(os.path.dirname(self.local_db_path), exist_ok=True)
        self._load_local_db()
        
        # Test connection/auth synchronously first to set use_local state immediately
        try:
            from pymongo import MongoClient
            test_client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=1000, connectTimeoutMS=1000)
            test_client.admin.command('ping')
            test_client.close()
            logger.info("Successfully connected and authenticated to MongoDB.")
        except Exception as e:
            logger.warning(f"MongoDB connection/auth check failed: {e}. Defaulting to local storage.")
            self.use_local = True

        try:
            self.client = AsyncIOMotorClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            self.mongo_db = self.client[self.db_name]
        except Exception as e:
            logger.error(f"Failed to initialize AsyncIOMotorClient: {e}. Defaulting to local storage.")
            self.use_local = True

        self.users = FallbackCollection(self, "users")
        self.profiles = FallbackCollection(self, "profiles")
        self.chats = FallbackCollection(self, "chats")

    def _load_local_db(self):
        if os.path.exists(self.local_db_path):
            try:
                with open(self.local_db_path, "r", encoding="utf-8") as f:
                    self.local_data = json.load(f)
            except Exception as e:
                logger.error(f"Error loading local_db.json: {e}. Reinitializing database.")
                self.local_data = {"users": [], "profiles": [], "chats": []}
        else:
            self.local_data = {"users": [], "profiles": [], "chats": []}
            self._save_local_db()

    def _save_local_db(self):
        try:
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump(self.local_data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to write local_db.json: {e}")

    def local_find_one(self, collection_name, filter_query, sort=None):
        self._load_local_db()
        items = self.local_data.get(collection_name, [])
        
        matched_items = []
        for item in items:
            match = True
            for k, v in filter_query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                matched_items.append(item)
                
        if not matched_items:
            return None
            
        if sort:
            for field, order in reversed(sort):
                reverse = True if order == -1 else False
                matched_items.sort(key=lambda x: x.get(field) or "", reverse=reverse)
                
        return dict(matched_items[0])

    def local_insert_one(self, collection_name, document):
        self._load_local_db()
        if collection_name not in self.local_data:
            self.local_data[collection_name] = []
            
        if "_id" not in document:
            document["_id"] = str(uuid.uuid4())
            
        doc_copy = {}
        for k, v in document.items():
            if isinstance(v, datetime):
                doc_copy[k] = v.isoformat()
            else:
                doc_copy[k] = v
                
        self.local_data[collection_name].append(doc_copy)
        self._save_local_db()
        return FallbackInsertResult(document["_id"])

# MongoDB Connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://iamrobotttt78_db_user:RtnJP2lmIssfWgv8@cluster0.i4juwbg.mongodb.net/")
db = FallbackDatabase(MONGO_URI)

# Security Auth
SECRET_KEY = "SUPER_SECRET_KEY_FOR_JWT"
# Make sure GROQ_API_KEY is available in environment
if not os.environ.get("GROQ_API_KEY"):
    logger.warning("GROQ_API_KEY is not set in environment! Please ensure it is present in backend/.env")

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

class ImproveRequest(BaseModel):
    user_id: str
    target_role: str = None

class RewriteRequest(BaseModel):
    user_id: str
    target_role: str


@app.get("/")
def read_root():
    return {"status": "AI Career Intelligence System is running"}

@app.post("/api/auth/register")
async def register_user(user: UserRegister):
    import re
    # Strict email validation regex
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", user.email):
        raise HTTPException(status_code=400, detail="Invalid email format. Please provide a valid email address.")
        
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
    
    token = jwt.encode({"sub": str(result.inserted_id), "name": user.name}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "user_id": str(result.inserted_id), "name": user.name}

@app.post("/api/auth/login")
async def login_user(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    is_valid = bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"].encode('utf-8'))
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    token = jwt.encode({"sub": str(db_user["_id"]), "name": db_user["name"]}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "user_id": str(db_user["_id"]), "name": db_user["name"]}

@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    content = await file.read()
    
    # 1. Extract Text
    parsed_data = parse_resume(content)
    
    # 2. Deep LLM RAG Analysis
    try:
        analysis = career_ai.analyze_resume(parsed_data['text'])
        from ml.rag_retriever import job_rag_retriever
        matching_jobs = job_rag_retriever.retrieve_matching_jobs(parsed_data['text'], top_k=5)
    except Exception as e:
        logger.error(f"Error calling Groq API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM API failure: {str(e)}")
    
    # 3. Construct Profile
    profile = {
        "user_id": user_id,
        "filename": file.filename,
        "email": parsed_data['email'],
        "skills": analysis['skills'],
        "experience_years": parsed_data['experience_years'],
        "predicted_level": analysis['predicted_level'],
        "predicted_salary": analysis['predicted_salary_lpa'],
        "recommended_role": analysis.get('recommended_role', 'Software Engineer'),
        "resume_score": analysis.get('resume_score', 75),
        "salary_range_lpa": analysis.get('salary_range_lpa', '6.0 - 12.0'),
        "missing_skills": analysis['missing_skills'],
        "match_percentage": analysis['match_percentage'],
        "suggested_companies": analysis['suggested_companies'],
        "matching_jobs": matching_jobs,
        "resume_text": parsed_data['text'],
        "timestamp": datetime.utcnow()
    }
    
    # 4. Save to MongoDB
    await db.profiles.insert_one(profile)
    
    # Remove ObjectId for JSON serialization
    profile.pop('_id', None)
    
    return {
        "message": "Resume processed successfully with RAG",
        "profile": profile
    }

@app.post("/api/chat")
async def chat_with_bot(request: ChatRequest):
    # Retrieve user's profile from DB to feed into the Groq AI
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    context = ""
    if profile:
        context = (
            f"Role: {profile.get('recommended_role', 'Software Engineer')} | "
            f"Level: {profile['predicted_level']} | "
            f"Salary: {profile['predicted_salary']} LPA ({profile.get('salary_range_lpa', 'N/A')}) | "
            f"Skills: {', '.join(profile['skills'])}\n"
            f"Resume Content:\n{profile.get('resume_text', '')}"
        )
        
    try:
        response = career_ai.chat(request.query, context)
    except Exception as e:
        logger.error(f"Error calling Groq API: {str(e)}")
        response = "Sorry, my AI brain experienced a momentary error. Please check if your Groq key is valid."
    
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
        
    try:
        gap_analysis = career_ai.get_dynamic_roadmap(profile['skills'], request.target_level)
    except Exception as e:
        logger.error(f"Error in roadmap update: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "target_level": request.target_level,
        "missing_skills": gap_analysis['missing_skills'],
        "match_percentage": gap_analysis['match_percentage'],
        "suggested_companies": gap_analysis['suggested_companies']
    }

@app.post("/api/resume/improve")
async def get_resume_improvements(request: ImproveRequest):
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="No resume uploaded yet. Please upload a resume first.")
        
    target_role = request.target_role or profile.get('recommended_role')
    
    try:
        improvements = career_ai.suggest_improvements(profile['resume_text'], target_role)
        return {"improvements": improvements, "target_role": target_role}
    except Exception as e:
        logger.error(f"Error generating resume improvements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/rewrite")
async def get_rewritten_resume(request: RewriteRequest):
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="No resume uploaded yet. Please upload a resume first.")
        
    try:
        rewritten_markdown = career_ai.rewrite_resume(profile['resume_text'], request.target_role)
        return {"rewritten_markdown": rewritten_markdown, "target_role": request.target_role}
    except Exception as e:
        logger.error(f"Error generating resume rewrite: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class DownloadRequest(BaseModel):
    markdown: str
    filename: str = "resume"

@app.post("/api/resume/download/pdf")
async def download_resume_pdf(request: DownloadRequest):
    import io
    import re
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'MDTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            spaceAfter=6
        )
        
        h1_style = ParagraphStyle(
            'MDH1',
            parent=styles['Heading2'],
            fontSize=12,
            leading=15,
            spaceBefore=8,
            spaceAfter=4,
            borderWidth=0.5,
            borderColor='gray',
            borderRadius=1
        )
        
        h2_style = ParagraphStyle(
            'MDH2',
            parent=styles['Heading3'],
            fontSize=10,
            leading=13,
            spaceBefore=6,
            spaceAfter=3
        )
        
        body_style = ParagraphStyle(
            'MDBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            spaceAfter=3
        )
        
        bullet_style = ParagraphStyle(
            'MDBullet',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=2
        )
        
        story = []
        lines = request.markdown.split('\n')
        is_first_header = True
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            # Parse headers
            if line_str.startswith('# '):
                header_text = line_str[2:]
                if is_first_header:
                    story.append(Paragraph(f"<b>{header_text}</b>", title_style))
                    is_first_header = False
                else:
                    story.append(Paragraph(f"<b>{header_text}</b>", h1_style))
            elif line_str.startswith('## '):
                header_text = line_str[3:]
                story.append(Paragraph(f"<b>{header_text}</b>", h1_style))
            elif line_str.startswith('### '):
                header_text = line_str[4:]
                story.append(Paragraph(f"<b>{header_text}</b>", h2_style))
            # Parse bullet points
            elif line_str.startswith('- ') or line_str.startswith('* '):
                bullet_text = line_str[2:]
                bullet_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', bullet_text)
                story.append(Paragraph(f"&bull; {bullet_text}", bullet_style))
            else:
                text = line_str
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                story.append(Paragraph(text, body_style))
                
        doc.build(story)
        buffer.seek(0)
        
        headers = {
            'Content-Disposition': f'attachment; filename="{request.filename}.pdf"'
        }
        return StreamingResponse(buffer, media_type='application/pdf', headers=headers)
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/download/docx")
async def download_resume_docx(request: DownloadRequest):
    import io
    import re
    from fastapi.responses import StreamingResponse
    from docx import Document
    from docx.shared import Pt
    
    try:
        doc = Document()
        for section in doc.sections:
            section.top_margin = Pt(40)
            section.bottom_margin = Pt(40)
            section.left_margin = Pt(40)
            section.right_margin = Pt(40)
            
        lines = request.markdown.split('\n')
        is_first_header = True
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            # Parse headers
            if line_str.startswith('# '):
                header_text = line_str[2:]
                if is_first_header:
                    p = doc.add_paragraph()
                    run = p.add_run(header_text)
                    run.bold = True
                    run.font.size = Pt(16)
                    p.paragraph_format.space_after = Pt(8)
                    is_first_header = False
                else:
                    p = doc.add_paragraph()
                    run = p.add_run(header_text)
                    run.bold = True
                    run.font.size = Pt(12)
                    p.paragraph_format.space_before = Pt(8)
                    p.paragraph_format.space_after = Pt(4)
            elif line_str.startswith('## '):
                header_text = line_str[3:]
                p = doc.add_paragraph()
                run = p.add_run(header_text)
                run.bold = True
                run.font.size = Pt(12)
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(4)
            elif line_str.startswith('### '):
                header_text = line_str[4:]
                p = doc.add_paragraph()
                run = p.add_run(header_text)
                run.bold = True
                run.font.size = Pt(10)
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(3)
            # Parse bullet points
            elif line_str.startswith('- ') or line_str.startswith('* '):
                bullet_text = line_str[2:]
                p = doc.add_paragraph(style='List Bullet')
                p.paragraph_format.space_after = Pt(3)
                
                parts = re.split(r'(\*\*.*?\*\*)', bullet_text)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        run = p.add_run(part[2:-2])
                        run.bold = True
                    else:
                        p.add_run(part)
            else:
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(3)
                
                parts = re.split(r'(\*\*.*?\*\*)', line_str)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        run = p.add_run(part[2:-2])
                        run.bold = True
                    else:
                        p.add_run(part)
                        
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        headers = {
            'Content-Disposition': f'attachment; filename="{request.filename}.docx"'
        }
        return StreamingResponse(buffer, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', headers=headers)
    except Exception as e:
        logger.error(f"Error generating DOCX: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/{user_id}")
async def get_latest_profile(user_id: str):
    profile = await db.profiles.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user.")
    
    # Remove ObjectId for JSON serialization
    profile.pop('_id', None)
    return profile

