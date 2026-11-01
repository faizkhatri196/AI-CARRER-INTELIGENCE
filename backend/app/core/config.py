import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Career & Recruitment Intelligence"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "SUPER_SECRET_KEY_FOR_JWT_CAREER_AI_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    MONGO_URI: str = os.environ.get(
        "MONGO_URI",
        "mongodb+srv://iamrobotttt78_db_user:RtnJP2lmIssfWgv8@cluster0.i4juwbg.mongodb.net/"
    )
    DATABASE_NAME: str = os.environ.get("DATABASE_NAME", "ai_career_db")
    
    # LLM / Groq
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://ai-carrer-inteligence.vercel.app",
        "*"
    ]
    
    # Storage & Batch Limits
    MAX_UPLOAD_SIZE_MB: int = 15
    MAX_BATCH_FILES: int = 250
    CONCURRENT_WORKERS: int = 5

    class Config:
        env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        extra = "allow"

settings = Settings()
