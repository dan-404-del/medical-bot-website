# Medical Triage Web Application

A **minimal, working prototype** for a Raspberry Pi–based medical robot. Used for competitions and demos.

- **Frontend:** HTML, CSS, Vanilla JavaScript  
- **Backend:** Python Flask  
- **Database:** SQLite (local only)  
- **AI:** Gemini API (HTTP). Optional; mock result used if no API key.

---

## Run Instructions

### 1. Install Python dependencies

```bash
cd medical_robot_app
pip install -r requirements.txt
```

### 2. Start the backend

From project root:

```bash
python backend/app.py
```

Or use `python3` if that’s how Python 3 is run on your system.

From the `backend` folder:

```bash
cd backend
python app.py
```

### 3. Open the UI

In a browser, go to:

**http://localhost:5000**

- **Patient flow:** Register → Dashboard (vitals) → Pain selection → 10 questions → AI result  
- **Doctor flow:** http://localhost:5000/doctor_login.html  
  - Demo login: **Doctor ID** `doctor1`, **Password** `demo123`

---

## AI (Gemini) Setup (optional)

For real AI triage (instead of mock):

1. Get a [Gemini API key](https://ai.google.dev/).  
2. Set it as an environment variable:

   **Windows (PowerShell):**
   ```powershell
   $env:GEMINI_API_KEY = "your-api-key"
   ```

   **Linux / Mac:**
   ```bash
   export GEMINI_API_KEY=your-api-key
   ```

3. Restart the Flask app.

If `GEMINI_API_KEY` is not set, the app returns a **mock** result (severity MEDIUM, “No AI key configured”).

---

## Project Structure

```
medical_robot_app/
  backend/
    app.py          # Flask app, SQLite, Gemini API
    database.db     # Created on first run
  frontend/
    index.html      # Patient registration
    dashboard.html  # Patient dashboard + vitals
    pain_map.html   # Pain location selection
    pain_questions.html  # 10 questions by body part
    analysis_result.html # AI triage result
    doctor_login.html
    doctor_dashboard.html
    style.css
    app.js
  requirements.txt
  README.md
```

---

## Notes

- **Fingerprint ID:** Simulated input. The app includes comments for future fingerprint sensor integration.  
- **Vitals:** Manual entry for now. Comments mark where Arduino/sensor input can be wired.  
- **AI:** Advisory only — **not** a medical diagnosis.  
- **Doctor credentials:** Hardcoded for prototype (`doctor1` / `demo123`).  
- **Database:** SQLite only; everything runs locally and offline except Gemini API calls.

---

## API Endpoints (reference)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register_patient` | Register patient |
| GET | `/api/get_patient/<fingerprint_id>` | Get patient |
| GET | `/api/get_all_patients` | List patients (doctor) |
| POST | `/api/save_vitals` | Save vitals |
| POST | `/api/save_pain_selection` | Save body part |
| POST | `/api/save_pain_answers` | Save Q&A |
| POST | `/api/analyze_condition` | AI triage |
| GET | `/api/get_analysis/<fingerprint_id>` | Get latest analysis |
| POST | `/api/doctor_login` | Doctor login |
| GET | `/api/get_medical_history/<fingerprint_id>` | Get history |
| POST | `/api/save_medical_history/<fingerprint_id>` | Save history |
