import io
import os
import re
import hashlib
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import PyPDF2
from docx import Document
import spacy

from app.models.schemas import (
    ContactInfo, EducationItem, ExperienceItem, ProjectItem,
    ParsedResume, SkillProvenance
)
from app.services.skill_inference import skill_engine

logger = logging.getLogger("resume_parser")

# Load spaCy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    try:
        import spacy.cli
        spacy.cli.download("en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")
    except Exception as e:
        logger.warning(f"Could not load en_core_web_sm, falling back to spacy.blank('en'): {e}")
        nlp = spacy.blank("en")

STRONG_ACTION_VERBS = {
    "architected", "engineered", "developed", "designed", "implemented", "optimized",
    "accelerated", "spearheaded", "orchestrated", "automated", "scaled", "deployed",
    "refactored", "integrated", "streamlined", "built", "managed", "delivered"
}

SECTION_HEADERS = {
    "summary": ["summary", "professional summary", "about me", "objective", "profile", "overview"],
    "experience": ["experience", "work experience", "professional experience", "employment history", "work history", "career history"],
    "education": ["education", "academic background", "qualifications", "academic qualifications"],
    "projects": ["projects", "personal projects", "academic projects", "key projects", "selected projects"],
    "skills": ["skills", "technical skills", "technologies", "core competencies", "skills & tools", "stack"],
    "certifications": ["certifications", "licenses", "certificates", "credentials"]
}

def compute_file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        extracted = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                extracted.append(page_text)
        return "\n".join(extracted)
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text.strip())
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        return ""

def extract_text(file_bytes: bytes, filename: str) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx") or lower_name.endswith(".doc"):
        return extract_text_from_docx(file_bytes)
    else:
        # Default to UTF-8 decoded text
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""

def extract_contact_info(text: str) -> ContactInfo:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # 1. Email extraction
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    email = email_match.group(0) if email_match else None

    # 2. Phone extraction (international or US/Indian/EU standard)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0).strip() if phone_match else None

    # 3. URLs
    github_match = re.search(r'(https?://)?(www\.)?github\.com/[A-Za-z0-9_-]+', text, re.IGNORECASE)
    github_url = github_match.group(0) if github_match else None

    linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9_-]+', text, re.IGNORECASE)
    linkedin_url = linkedin_match.group(0) if linkedin_match else None

    portfolio_match = re.search(r'(https?://)?(www\.)?[A-Za-z0-9_-]+\.(dev|io|me|app|com|org)', text, re.IGNORECASE)
    portfolio_url = portfolio_match.group(0) if portfolio_match and "github" not in portfolio_match.group(0) and "linkedin" not in portfolio_match.group(0) else None

    # 4. Candidate Name: check first few lines using spaCy NER
    candidate_name = None
    header_text = "\n".join(lines[:6])
    doc = nlp(header_text)
    for ent in doc.ents:
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2 and len(ent.text) < 35:
            # Avoid picking section headers
            if not any(h in ent.text.lower() for headers in SECTION_HEADERS.values() for h in headers):
                candidate_name = ent.text.strip()
                break

    if not candidate_name and lines:
        for line in lines[:3]:
            # If line is 2-4 words and doesn't contain email/urls/numbers
            if 1 <= len(line.split()) <= 4 and not re.search(r'[@\d/:]', line) and len(line) < 35:
                candidate_name = line
                break

    if not candidate_name:
        candidate_name = "Candidate"

    # 5. Location
    location = None
    loc_matches = re.findall(r'([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)*,\s*[A-Z]{2,}(?:\s*\d{5})?)', text)
    if loc_matches:
        location = loc_matches[0]

    return ContactInfo(
        name=candidate_name,
        email=email,
        phone=phone,
        location=location,
        linkedin_url=linkedin_url,
        github_url=github_url,
        portfolio_url=portfolio_url
    )

def segment_sections(text: str) -> Dict[str, List[str]]:
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {k: [] for k in SECTION_HEADERS.keys()}
    sections["general"] = []
    
    current_section = "general"
    
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        cleaned_lower = cleaned.lower()
        
        # Check if line looks like a header
        is_header = False
        if len(cleaned.split()) <= 4 and (cleaned.isupper() or cleaned.istitle() or cleaned.startswith("#")):
            header_candidate = re.sub(r'[^a-zA-Z\s]', '', cleaned_lower).strip()
            for sec_name, keywords in SECTION_HEADERS.items():
                if header_candidate in keywords:
                    current_section = sec_name
                    is_header = True
                    break
        
        if not is_header:
            sections[current_section].append(cleaned)
            
    return sections

def calculate_experience_years(text: str, experience_lines: List[str]) -> Tuple[float, List[ExperienceItem]]:
    """Calculates total experience duration in years and parses items."""
    exp_items: List[ExperienceItem] = []
    total_months = 0

    # Common year range regex: e.g. 2019 - 2022 or Jan 2021 - Present
    date_range_regex = re.compile(
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(\d{4})\s*(?:-|–|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(\d{4}|Present|Current)',
        re.IGNORECASE
    )

    full_text = "\n".join(experience_lines) if experience_lines else text
    matches = date_range_regex.findall(full_text)
    
    current_year = datetime.now().year
    
    for m in matches:
        start_year = int(m[1])
        end_str = m[3]
        if end_str.lower() in ["present", "current"]:
            end_year = current_year
        else:
            try:
                end_year = int(end_str)
            except ValueError:
                end_year = start_year + 1
        
        if 1980 <= start_year <= current_year and end_year >= start_year:
            duration = (end_year - start_year) * 12
            total_months += max(duration, 6)

    # Heuristic for explicit mention: "3+ years of experience"
    exp_mention = re.findall(r'(\d+)\+?\s*(?:years|yrs)\s*(?:of)?\s*experience', text.lower())
    if exp_mention:
        mentioned_years = float(exp_mention[0])
        total_months = max(total_months, int(mentioned_years * 12))

    years = round(total_months / 12.0, 1) if total_months > 0 else 1.0

    # Parse structural experience items
    current_title = "Software Engineer"
    current_bullets = []
    for line in experience_lines:
        if line.startswith(("-", "•", "*")):
            current_bullets.append(line.lstrip("-•* ").strip())
        elif any(role in line.lower() for role in ["engineer", "developer", "lead", "architect", "intern", "manager", "analyst", "consultant"]):
            if current_bullets:
                exp_items.append(ExperienceItem(
                    job_title=current_title,
                    responsibilities=current_bullets,
                    has_metrics=any(re.search(r'\d+%', b) or re.search(r'\$\d+', b) for b in current_bullets)
                ))
                current_bullets = []
            current_title = line.strip()

    if current_bullets:
        exp_items.append(ExperienceItem(
            job_title=current_title,
            responsibilities=current_bullets,
            has_metrics=any(re.search(r'\d+%', b) or re.search(r'\$\d+', b) for b in current_bullets)
        ))

    return years, exp_items

def parse_projects(project_lines: List[str]) -> List[ProjectItem]:
    projects: List[ProjectItem] = []
    current_title = ""
    current_bullets = []
    
    for line in project_lines:
        if line.startswith(("-", "•", "*")):
            current_bullets.append(line.lstrip("-•* ").strip())
        elif len(line.split()) <= 6 and not line.startswith(("#", "//")):
            if current_title and current_bullets:
                projects.append(ProjectItem(
                    title=current_title,
                    description=" ".join(current_bullets),
                    outcomes=current_bullets,
                    has_metrics=any(re.search(r'\d+%', b) or re.search(r'\$\d+', b) for b in current_bullets)
                ))
                current_bullets = []
            current_title = line.strip()
        else:
            current_bullets.append(line.strip())

    if current_title and current_bullets:
        projects.append(ProjectItem(
            title=current_title,
            description=" ".join(current_bullets),
            outcomes=current_bullets,
            has_metrics=any(re.search(r'\d+%', b) or re.search(r'\$\d+', b) for b in current_bullets)
        ))
        
    return projects

def parse_education(edu_lines: List[str]) -> List[EducationItem]:
    items: List[EducationItem] = []
    edu_text = " ".join(edu_lines)
    
    degree_patterns = [
        (r'\b(Ph\.?D\.?|Doctor of Philosophy)\b', "Ph.D."),
        (r'\b(M\.?S\.?|Master of Science|M\.?Tech|Master of Technology|MBA)\b', "Master's Degree"),
        (r'\b(B\.?S\.?|Bachelor of Science|B\.?Tech|Bachelor of Technology|B\.?E\.?|Bachelor of Engineering|BCA)\b', "Bachelor's Degree")
    ]
    
    detected_degree = None
    for pattern, name in degree_patterns:
        if re.search(pattern, edu_text, re.IGNORECASE):
            detected_degree = name
            break
            
    # Major / Field
    field_match = re.search(r'(Computer Science|Data Science|Software Engineering|Information Technology|Electrical Engineering|Artificial Intelligence)', edu_text, re.IGNORECASE)
    field = field_match.group(0) if field_match else "Computer Science"
    
    # Year
    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', edu_text)
    grad_year = year_match.group(0) if year_match else None
    
    if detected_degree or edu_lines:
        items.append(EducationItem(
            degree=detected_degree or "Bachelor's Degree",
            field_of_study=field,
            institution="University / Institute" if not edu_lines else edu_lines[0][:60],
            graduation_year=grad_year
        ))
    return items

def parse_complete_resume(file_bytes: bytes, filename: str) -> ParsedResume:
    """End-to-end intelligent parser extracting full structured resume model."""
    raw_text = extract_text(file_bytes, filename)
    file_hash = compute_file_hash(file_bytes)
    
    contact = extract_contact_info(raw_text)
    sections = segment_sections(raw_text)
    
    exp_years, experience = calculate_experience_years(raw_text, sections.get("experience", []))
    projects = parse_projects(sections.get("projects", []))
    education = parse_education(sections.get("education", []))
    
    # Skills extraction
    explicit_skills = skill_engine.extract_explicit_skills(raw_text)
    
    # Inferred skills with evidence from projects and experience lines
    evidence_sentences = []
    for exp in experience:
        evidence_sentences.extend(exp.responsibilities)
    for p in projects:
        evidence_sentences.extend(p.outcomes)
    evidence_sentences.extend(sections.get("summary", []))
    if not evidence_sentences:
        evidence_sentences = [line for line in raw_text.split("\n") if len(line.strip()) > 20]
        
    inferred_skills = skill_engine.infer_hidden_capabilities(evidence_sentences)
    transferable_skills = skill_engine.find_transferable_skills(explicit_skills, [])
    
    # Action verbs & metric calculation
    text_lower = raw_text.lower()
    action_verb_count = sum(1 for verb in STRONG_ACTION_VERBS if verb in text_lower)
    metric_count = len(re.findall(r'(\d+%\b|\$\d+|\b\d+\s*(?:users|clients|nodes|queries|requests|ms|seconds|x)\b)', text_lower))
    
    # Formatting and content score heuristics
    has_contact = 20 if contact.email and contact.phone else 10
    has_sections = min(len([s for s, lines in sections.items() if lines]) * 10, 40)
    has_bullet_metrics = min(metric_count * 5, 20)
    has_action_verbs = min(action_verb_count * 4, 20)
    
    ats_score = min(has_contact + has_sections + 20, 100)
    quality_score = min(has_sections + has_bullet_metrics + has_action_verbs + 20, 100)
    
    return ParsedResume(
        raw_text=raw_text,
        file_hash=file_hash,
        contact=contact,
        education=education,
        experience=experience,
        projects=projects,
        explicit_skills=explicit_skills,
        inferred_skills=inferred_skills,
        transferable_skills=transferable_skills,
        unverified_skills=[],
        total_experience_years=exp_years,
        action_verb_count=action_verb_count,
        metric_count=metric_count,
        ats_formatting_score=ats_score,
        content_quality_score=quality_score
    )

