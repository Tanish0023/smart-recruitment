from celery import shared_task
from .models import Resume
from jobs.models import Skill

import re
import json
import spacy

from pdfminer.high_level import extract_text


nlp = spacy.load("en_core_web_sm")

def to_json_safe(value):
    if isinstance(value, dict):
        return {str(k): to_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [to_json_safe(v) for v in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def extract_text_from_pdf(path):
    return extract_text(path)


def clean_text(text):
    text = re.sub(r"[^\x00-\x7F]+", " ", text)

    text = re.sub(r"([a-zA-Z])(\d)", r"\1 \2", text)
    text = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def extract_phone(text):
    matches = re.findall(r"(?:\+91[\s-]?|0)?[6-9]\d{9}", text)
    return matches[0] if matches else None


def extract_name(text):
    doc = nlp(text[:1000])

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text

    first_line = text.strip().split("\n")[0]
    if len(first_line.split()) <= 4:
        return first_line

    return None


def normalize_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s\+\.#]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def extract_skills(text):
    text = normalize_text(text)
    db_skills = Skill.objects.all()

    found = set()

    for skill in db_skills:
        variants = [skill.name] + (skill.aliases or [])

        for variant in variants:
            v = normalize_text(variant)

            if len(v) <= 2:
                continue

            pattern = r"\b" + re.escape(v) + r"\b"

            if re.search(pattern, text):
                found.add(skill.name)
                break

    return sorted(found)


@shared_task(queue='resume_parsing')
def resume_parsing(resume_id):
    resume = Resume.objects.get(id=resume_id)

    resume.status = Resume.STATUS_CHOICES.PROCESSING
    resume.save(update_fields=["status"])

    try:
        raw_text = extract_text_from_pdf(resume.file.path)

        text = clean_text(raw_text)

        resume.parsed_text = text

        phone = extract_phone(text)
        name = extract_name(text)
        skills = extract_skills(text)

        obj = {
            "name": name,
            "phone": phone,
            "skills": skills,
        }

        obj = to_json_safe(obj)
        json.dumps(obj)

        resume.parsed_data = obj
        resume.status = Resume.STATUS_CHOICES.DONE

        resume.save(update_fields=["parsed_text", "parsed_data", "status"])

    except Exception as e:
        resume.status = Resume.STATUS_CHOICES.FAILED
        resume.save(update_fields=["status"])
        raise e