import spacy
import PyPDF2
import re
import io

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading en_core_web_sm model...")
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def parse_resume(file_bytes: bytes):
    text = extract_text_from_pdf(file_bytes)
    
    # Extract emails
    emails = re.findall(r'\S+@\S+', text)
    email = emails[0] if emails else None
    
    # Heuristics for Experience Years (Very basic)
    exp_years = 0
    exp_matches = re.findall(r'(\d+)\+?\s*(years|yrs)\s*(of)?\s*experience', text.lower())
    if exp_matches:
        exp_years = int(exp_matches[0][0])
        
    return {
        "text": text,
        "email": email,
        "experience_years": exp_years
    }
