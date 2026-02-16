import os
import google.generativeai as genai

GEMINI_KEY = os.getenv("GEMINI_API_KEY")

USE_GEMINI = bool(GEMINI_KEY)

if USE_GEMINI:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel("models/gemini-flash-latest")


def triage_ai(symptoms, vitals):
    # ---- Rule-based safety override ----
    if vitals["spo2"] < 90 or vitals["hr"] > 130 or vitals["temp"] > 39:
        return {
            "category": "EMERGENCY",
            "reason": "Critical vitals detected (rule-based)"
        }

    # ---- Fallback if no API key ----
    if not USE_GEMINI:
        return {
            "category": "DOCTOR CONSULT",
            "reason": "AI disabled (mock result)"
        }

    prompt = f"""
You are a medical triage assistant.

Classify into ONLY ONE:
- EMERGENCY
- DOCTOR CONSULT
- NORMAL

Vitals:
HR: {vitals['hr']} bpm
SpO2: {vitals['spo2']} %
Temp: {vitals['temp']} °C

Symptoms:
{symptoms}

Return JSON only:
{{"category": "...", "reason": "..."}}
"""

    try:
        response = model.generate_content(prompt)
        return eval(response.text)
    except:
        return {
            "category": "DOCTOR CONSULT",
            "reason": "AI error fallback"
        }
