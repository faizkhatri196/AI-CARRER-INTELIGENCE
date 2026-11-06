# Production Deployment & Scaling Guide

## 1. Hosting Architecture
- **Frontend**: Hosted on [Vercel](https://vercel.com) (Static SPA Build).
- **Backend API**: Hosted on [Render](https://render.com) (Python 3.10+ Web Service).
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with local JSON storage automatic fallback.

---

## 2. Render Backend Configuration

### Blueprint Deployment (`render.yaml`)
The repository contains an automated [render.yaml](../render.yaml) specification:
- **Runtime**: Python 3.10.12
- **Build Command**: `pip install --prefer-binary --no-cache-dir -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}`
- **Health Check Path**: `/health`

### Environment Variables
Configure the following in the Render Dashboard (`Environment` tab):

| Variable | Required | Description |
| :--- | :--- | :--- |
| `PORT` | Auto | Assigned dynamically by Render (defaults to 10000) |
| `MONGO_URI` | Optional | MongoDB Atlas Connection String (`mongodb+srv://...`) |
| `DATABASE_NAME` | Optional | Database name (defaults to `ai_career_db`) |
| `SECRET_KEY` | Recommended | 256-bit cryptographic key for JWT signing |
| `GROQ_API_KEY` | Optional | Groq API Key for LLaMA-3.3 70B RAG chatbot |
| `USE_LOCAL_DB` | Optional | Set to `true` to force offline mock database |

---

## 3. Vercel Frontend Configuration

The frontend is built using Vite and React.
- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Frontend Environment Variables
| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://ai-carrer-inteligence-1.onrender.com` (or local `http://localhost:8000`) |

---

## 4. Troubleshooting & Deployment Checklist
- **Deploy fails with exit status 127**: Verify `gunicorn` and `uvicorn[standard]` are present in `requirements.txt`.
- **MongoDB +srv resolution failure**: Ensure `dnspython` is installed in the Python environment.
- **Worker Timeout**: Keep module-level synchronous network calls out of imports; use `AsyncIOMotorClient` with `serverSelectionTimeoutMS=2000`.

