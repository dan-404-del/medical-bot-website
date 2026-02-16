import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-flash-latest")

def triage_ai(symptoms, vitals):
    prompt = f"""
You are a medical triage assistant.

Classify the case into ONLY ONE:
- EMERGENCY
- DOCTOR CONSULT
- NORMAL

Vitals:
Heart Rate: {vitals['hr']} bpm
SpO2: {vitals['spo2']} %
Temperature: {vitals['temp']} °C

Symptoms:
{symptoms}

Give result in this format:
CATEGORY:
REASON:
"""

    response = model.generate_content(prompt)
    return response.text

