from celery import shared_task
from PyPDF2 import PdfReader

@shared_task(queue='resume_parsing')
def resume_parsing(resume_url):
    print("Starting")
    print(resume_url)
    with open(resume_url, 'rb') as f:
        pdf_reader = PdfReader(f)

        text = ""

        for page in pdf_reader.pages:
            text += page.extract_text() or ""

    print(text)
    return text