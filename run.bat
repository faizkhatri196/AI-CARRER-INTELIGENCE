@echo off
echo ===================================================
echo AI Career Intelligence System - Setup and Run Script
echo ===================================================
echo.

echo [1/3] Setting up Python Backend...
cd backend
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install -r requirements.txt
echo Downloading spaCy model (if not exists)...
python -m spacy download en_core_web_sm
echo Starting FastAPI Backend... (Logs saved to backend.log)
set PYTHONUNBUFFERED=1
start "FastAPI Backend" cmd /c "call venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1"
cd ..

echo.
echo [2/3] Setting up React Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing NPM dependencies...
    call npm install
)
start "Vite Frontend" cmd /c "npm run dev"
cd ..

echo.
echo [3/3] Checking and Starting Local Ollama LLM Engine...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo Ollama not found! Downloading and installing Ollama silently...
    powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile 'OllamaSetup.exe'"
    echo Installing Ollama... Please wait (this may prompt for admin permissions)...
    start /wait OllamaSetup.exe /S
    echo Ollama installation finished!
    del OllamaSetup.exe
) else (
    echo Ollama is already installed.
)

start "Ollama AI Brain" cmd /c "ollama run mistral"

echo.
echo ===================================================
echo SYSTEM LAUNCHED SUCCESSFULLY!
echo ===================================================
echo Frontend: http://localhost:3000 (Check Vite window for actual port if 3000 is taken)
echo Backend API: http://localhost:8000
echo Swagger UI: http://localhost:8000/docs
echo.
echo Note: If Ollama (Mistral) model is not downloaded yet, the Ollama window will download it.
pause
