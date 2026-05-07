# AI Career Intelligence System

An advanced, full-stack AI application that predicts job levels, estimates salary, and analyzes skill gaps using Machine Learning (Random Forest) and NLP (spaCy + RAG LLM).

## Features
- **Resume Parsing:** Uses spaCy and PyPDF2 to extract skills and experience.
- **Salary Prediction:** ML model (Random Forest) trained to predict salary and job level.
- **Skill Gap Analysis:** Compares extracted skills against market demands.
- **RAG Career Chatbot:** Uses LangChain, FAISS, and local Mistral (via Ollama) to answer career questions based on your resume.
- **Modern UI:** Built with React, Tailwind CSS, and Recharts (Glassmorphism design).

## Requirements
- Python 3.9+
- Node.js 18+
- Ollama (installed locally)

## How to Run

Simply double-click the **`run.bat`** file in this folder on Windows. It will automatically:
1. Create a Python virtual environment.
2. Install all backend and frontend dependencies.
3. Download the NLP models (`en_core_web_sm`).
4. Start the FastAPI backend on port 8000.
5. Start the React frontend on port 3000.
6. Launch Ollama with the `mistral` model.

## Architecture

1. **Frontend:** React + Vite + Tailwind (Dashboard component handles UI and PDF upload).
2. **Backend:** FastAPI handles API requests (`/api/upload`, `/api/chat`).
3. **ML Engine:** Scikit-learn Random Forest regressor/classifier.
4. **NLP Engine:** spaCy for entity extraction; FAISS for vector DB.
5. **Database:** MongoDB Atlas stores profile history.
