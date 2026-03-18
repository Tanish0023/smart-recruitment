from celery import shared_task
from .models import Resume
from jobs.models import Skill

from PyPDF2 import PdfReader
import re
import spacy


nlp = spacy.load("en_core_web_sm")

def extract_email(text):
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else None

def extract_phone(text):
    match = re.search(r"\+?\d[\d\s\-]{8,15}", text)
    return match.group(0) if match else None

def extract_name(text):
    doc = nlp(text)

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text

    return None

def extract_skills(text):
    text_lower = text.lower()

    db_skills = Skill.objects.all()

    matched = []
    for skill in db_skills:
        # Check if skill name is in text
        if skill.name.lower() in text_lower:
            matched.append(skill.name)
        # Check if any aliases are in text
        elif skill.aliases:
            for alias in skill.aliases:
                if alias.lower() in text_lower:
                    matched.append(skill.name)
                    break

    return list(set(matched))

def extract_experience(text):
    match = re.search(r"(\d+)\+?\s+years?", text.lower())
    return int(match.group(1)) if match else 0

@shared_task(queue='resume_parsing')
def resume_parsing(resume_id):
    resume = Resume.objects.get(id=resume_id)

    resume.status = Resume.STATUS_CHOICES.PROCESSING
    resume.save()

    try:
        with open(resume.file.path, 'rb') as f:
            pdf_reader = PdfReader(f)

            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() or ""

        resume.parsed_text = text
        resume.status = Resume.STATUS_CHOICES.DONE
        resume.save()

    except Exception as e:
        resume.status = Resume.STATUS_CHOICES.FAILED
        resume.save()
        raise e
