from celery import shared_task
from .models import Resume
from jobs.models import Skill
from django.utils import timezone
from io import BytesIO
from urllib.request import urlopen

import re
import json
import spacy
from spacy.language import Language
from pdfminer.high_level import extract_text

try:
    from spacy.pipeline import SentenceSegmenter
except ImportError:
    SentenceSegmenter = None


nlp = spacy.load("en_core_web_sm")


def split_on_boundaries(doc):
    start = 0
    for i, token in enumerate(doc):
        if token.text in [".", "!", "?", ";", "•", "*"] and i + 1 < len(doc):
            yield doc[start:i + 1]
            start = i + 1
    if start < len(doc):
        yield doc[start:]


def add_sentence_segmenter():
    if SentenceSegmenter is not None:
        sbd = SentenceSegmenter(nlp.vocab, strategy=split_on_boundaries)
        if "parser" in nlp.pipe_names:
            nlp.add_pipe(sbd, before="parser")
        else:
            nlp.add_pipe(sbd)
    else:
        @Language.component("newline_sentence_boundary")
        def newline_sentence_boundary(doc):
            for i, token in enumerate(doc[:-1]):
                if token.text in [".", "!", "?", ";", "•", "*"]:
                    doc[i + 1].is_sent_start = True
            return doc

        if "parser" in nlp.pipe_names:
            nlp.add_pipe("newline_sentence_boundary", before="parser")
        else:
            nlp.add_pipe("newline_sentence_boundary")


add_sentence_segmenter()


SECTION_MAP = {
    "information": ["summary", "profile", "about", "introduction"],
    "education": ["education", "academic", "qualification"],
    "experience": ["experience", "work experience", "employment", "internship"],
    "projects": ["projects", "personal projects"],
}


COUNTRY_BY_DIAL_CODE = {
    "+1": "United States",
    "+7": "Russia",
    "+20": "Egypt",
    "+27": "South Africa",
    "+30": "Greece",
    "+31": "Netherlands",
    "+32": "Belgium",
    "+33": "France",
    "+34": "Spain",
    "+39": "Italy",
    "+40": "Romania",
    "+41": "Switzerland",
    "+43": "Austria",
    "+44": "United Kingdom",
    "+45": "Denmark",
    "+46": "Sweden",
    "+47": "Norway",
    "+48": "Poland",
    "+49": "Germany",
    "+52": "Mexico",
    "+54": "Argentina",
    "+55": "Brazil",
    "+56": "Chile",
    "+57": "Colombia",
    "+58": "Venezuela",
    "+60": "Malaysia",
    "+61": "Australia",
    "+62": "Indonesia",
    "+63": "Philippines",
    "+64": "New Zealand",
    "+65": "Singapore",
    "+66": "Thailand",
    "+81": "Japan",
    "+82": "South Korea",
    "+84": "Vietnam",
    "+86": "China",
    "+90": "Turkey",
    "+91": "India",
    "+92": "Pakistan",
    "+93": "Afghanistan",
    "+94": "Sri Lanka",
    "+95": "Myanmar",
    "+98": "Iran",
    "+211": "South Sudan",
    "+212": "Morocco",
    "+213": "Algeria",
    "+216": "Tunisia",
    "+218": "Libya",
    "+220": "Gambia",
    "+221": "Senegal",
    "+234": "Nigeria",
    "+251": "Ethiopia",
    "+254": "Kenya",
    "+255": "Tanzania",
    "+260": "Zambia",
    "+263": "Zimbabwe",
    "+351": "Portugal",
    "+352": "Luxembourg",
    "+353": "Ireland",
    "+354": "Iceland",
    "+355": "Albania",
    "+356": "Malta",
    "+357": "Cyprus",
    "+358": "Finland",
    "+359": "Bulgaria",
    "+370": "Lithuania",
    "+371": "Latvia",
    "+372": "Estonia",
    "+380": "Ukraine",
    "+381": "Serbia",
    "+385": "Croatia",
    "+386": "Slovenia",
    "+420": "Czech Republic",
    "+421": "Slovakia",
    "+852": "Hong Kong",
    "+853": "Macau",
    "+855": "Cambodia",
    "+880": "Bangladesh",
    "+886": "Taiwan",
    "+960": "Maldives",
    "+961": "Lebanon",
    "+962": "Jordan",
    "+963": "Syria",
    "+964": "Iraq",
    "+965": "Kuwait",
    "+966": "Saudi Arabia",
    "+967": "Yemen",
    "+968": "Oman",
    "+971": "United Arab Emirates",
    "+972": "Israel",
    "+973": "Bahrain",
    "+974": "Qatar",
    "+975": "Bhutan",
    "+976": "Mongolia",
    "+977": "Nepal",
    "+992": "Tajikistan",
    "+993": "Turkmenistan",
    "+994": "Azerbaijan",
    "+995": "Georgia",
    "+996": "Kyrgyzstan",
    "+998": "Uzbekistan",
}

COUNTRY_ALIASES = {
    "usa": "United States",
    "us": "United States",
    "uk": "United Kingdom",
    "uae": "United Arab Emirates",
}


def to_json_safe(value):
    if isinstance(value, dict):
        return {str(k): to_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [to_json_safe(v) for v in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def extract_text_from_pdf(file_field):
    # Support both local filesystem and remote storage backends (e.g., Cloudinary/S3).
    try:
        return extract_text(file_field.path)
    except (NotImplementedError, AttributeError, OSError):
        try:
            file_field.open("rb")
            try:
                return extract_text(BytesIO(file_field.read()))
            finally:
                file_field.close()
        except OSError:
            # Final fallback: fetch through resolved storage URL (works with Cloudinary raw assets).
            with urlopen(file_field.url, timeout=30) as response:
                return extract_text(BytesIO(response.read()))


def clean_text(text):
    text = re.sub(r"\(cid:\d+\)", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)

    text = re.sub(r"([a-zA-Z])(\d)", r"\1 \2", text)
    text = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", text)

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    text = re.sub(r"[|*#]+", " ", text)
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def is_section_header(line):
    clean = line.strip().lower()

    # headers are usually short
    if len(clean.split()) > 6:
        return None

    for section, keywords in SECTION_MAP.items():
        for keyword in keywords:
            if clean == keyword:
                return section

            if keyword in clean and len(clean) <= 30:
                return section

    return None


def split_inline_header(line):
    lower = line.lower()

    for section, keywords in SECTION_MAP.items():
        for keyword in keywords:
            if lower.startswith(keyword):
                return section, line[len(keyword):].strip()

    return None, line


def split_mixed_section_line(line):
    lower = line.lower()

    for section, keywords in SECTION_MAP.items():
        for keyword in keywords:
            pattern = r"\b" + re.escape(keyword) + r"\b"
            match = re.search(pattern, lower)

            if match:
                start = match.start()
                before = line[:start].strip()
                after = line[match.end():].strip()

                return before, section, after

    return line, None, None


def dedupe_lines(lines):
    seen = set()
    result = []

    for line in lines:
        clean = line.strip().lower()

        if clean not in seen:
            seen.add(clean)
            result.append(line)

    return result

def dedupe_sentences(sentences):
    seen = set()
    result = []

    for sent in sentences:
        clean = sent.strip().lower()

        if clean not in seen:
            seen.add(clean)
            result.append(sent)

    return result

def extract_sections(text):
    sections = {key: [] for key in SECTION_MAP}
    current_section = "information"

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    lines = dedupe_lines(lines)

    for line in lines:
        detected = is_section_header(line)
        if detected:
            current_section = detected
            continue

        inline_section, remaining = split_inline_header(line)
        if inline_section:
            current_section = inline_section
            if remaining:
                sections[current_section].append(remaining)
            continue

        before, new_section, after = split_mixed_section_line(line)

        if before:
            sections[current_section].append(before)

        if new_section:
            current_section = new_section
            if after:
                sections[current_section].append(after)
            continue

        sections[current_section].append(line)

    cleaned_sections = {}

    for key, content_lines in sections.items():
        combined = " ".join(content_lines).strip()

        if not combined:
            cleaned_sections[key] = ""
            continue

        doc = nlp(combined)
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]

        sentences = dedupe_sentences(sentences)

        cleaned_sections[key] = " ".join(sentences)

    return cleaned_sections

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


def extract_candidate_name(text):
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    head = lines[:12]

    for line in head:
        if "@" in line:
            continue
        if re.search(r"\d", line):
            continue
        if any(char in line for char in [":", "/", "|", "http", "www"]):
            continue

        tokens = [tok for tok in re.split(r"\s+", line) if tok]
        if len(tokens) < 2 or len(tokens) > 4:
            continue

        clean_tokens = []
        valid = True
        for token in tokens:
            token = token.strip("-.,")
            if not re.fullmatch(r"[A-Za-z][A-Za-z'-]*", token):
                valid = False
                break
            clean_tokens.append(token.capitalize())

        if valid:
            return clean_tokens[0], " ".join(clean_tokens[1:])

    return "", ""


def normalize_phone(raw_phone):
    compact = re.sub(r"[^\d+]", "", raw_phone)
    if compact.startswith("00"):
        compact = "+" + compact[2:]

    digits_only = re.sub(r"\D", "", compact)
    if len(digits_only) < 7:
        return "", "", ""

    if compact.startswith("+"):
        # Try longest possible dial code first.
        for size in (4, 3, 2, 1):
            if len(digits_only) > size:
                dial = "+" + digits_only[:size]
                if dial in COUNTRY_BY_DIAL_CODE:
                    local = digits_only[size:]
                    return dial, local, f"{dial} {local}".strip()
        # Fallback when code is not mapped.
        dial = "+" + digits_only[:1]
        local = digits_only[1:]
        return dial, local, f"{dial} {local}".strip()

    return "", digits_only, digits_only


def extract_phone(text):
    pattern = re.compile(r"(?:\+|00)?\d[\d\s\-()]{6,}\d")
    candidates = pattern.findall(text)

    # Prefer numbers that appear near explicit mobile/phone labels.
    labelled_hits = []
    lower_text = text.lower()
    for candidate in candidates:
        idx = lower_text.find(candidate.lower())
        context = lower_text[max(0, idx - 30): idx + 30] if idx >= 0 else ""
        if any(label in context for label in ["phone", "mobile", "mob", "contact", "tel"]):
            labelled_hits.append(candidate)

    ordered = labelled_hits + [c for c in candidates if c not in labelled_hits]
    for candidate in ordered:
        dial, local, full = normalize_phone(candidate)
        if full:
            return {
                "dial_code": dial,
                "number": local,
                "full": full,
            }

    return {
        "dial_code": "",
        "number": "",
        "full": "",
    }


def extract_country(text, dial_code=""):
    if dial_code and dial_code in COUNTRY_BY_DIAL_CODE:
        return COUNTRY_BY_DIAL_CODE[dial_code]

    normalized = re.sub(r"[^a-z\s]", " ", text.lower())
    normalized = re.sub(r"\s+", " ", normalized)

    for alias, country in COUNTRY_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", normalized):
            return country

    countries = sorted(set(COUNTRY_BY_DIAL_CODE.values()), key=len, reverse=True)
    for country in countries:
        country_norm = re.sub(r"[^a-z\s]", " ", country.lower()).strip()
        if country_norm and re.search(rf"\b{re.escape(country_norm)}\b", normalized):
            return country

    country_line_match = re.search(r"\bcountry\s*[:\-]\s*([A-Za-z\s]{2,40})", text, flags=re.IGNORECASE)
    if country_line_match:
        return country_line_match.group(1).strip().title()

    return ""


def extract_profile(text):
    first_name, last_name = extract_candidate_name(text)
    phone = extract_phone(text)
    country = extract_country(text, dial_code=phone.get("dial_code", ""))

    return {
        "first_name": first_name,
        "last_name": last_name,
        "phone_code": phone.get("dial_code", ""),
        "phone_number": phone.get("number", ""),
        "phone_full": phone.get("full", ""),
        "country": country,
    }



@shared_task(queue='resume_parsing')
def resume_parsing(resume_id, user_id=None, update_basic_details=True):
    resume = Resume.objects.get(id=resume_id)

    resume.status = Resume.STATUS_CHOICES.PROCESSING
    resume.save(update_fields=["status"])

    try:
        if not resume.file:
            raise ValueError("Resume file is missing.")

        raw_text = extract_text_from_pdf(resume.file)
        text = clean_text(raw_text)

        sections = extract_sections(text)
        skills = extract_skills(text)
        profile = extract_profile(text)

        obj = {
            "skills": skills,
            "sections": sections,
            "profile": profile,
        }

        obj = to_json_safe(obj)
        json.dumps(obj)

        resume.parsed_text = text
        resume.parsed_data = obj
        resume.status = Resume.STATUS_CHOICES.DONE

        resume.save(update_fields=["parsed_text", "parsed_data", "status"])

        if user_id:
            from users.models import User
            user = User.objects.get(id=user_id)

            extracted_skill_objs = list(Skill.objects.filter(name__in=skills))
            if extracted_skill_objs:
                user.skills.add(*extracted_skill_objs)

            if update_basic_details:
                changed_fields = []

                if profile.get("first_name") and not (user.first_name or "").strip():
                    user.first_name = profile["first_name"].strip()
                    changed_fields.append("first_name")

                if profile.get("last_name") and not (user.last_name or "").strip():
                    user.last_name = profile["last_name"].strip()
                    changed_fields.append("last_name")

                if profile.get("phone_full") and not (user.phone or "").strip():
                    user.phone = profile["phone_full"].strip()
                    changed_fields.append("phone")

                if profile.get("country") and not (user.location or "").strip():
                    user.location = profile["country"].strip()
                    changed_fields.append("location")

                if (
                    user.profile_sections_status().get("basicInfo")
                    and not user.onboarding_completed_at
                ):
                    user.onboarding_completed_at = timezone.now()
                    changed_fields.append("onboarding_completed_at")

                if changed_fields:
                    user.save(update_fields=changed_fields)

    except Exception as e:
        resume.status = Resume.STATUS_CHOICES.FAILED
        resume.save(update_fields=["status"])
        raise e