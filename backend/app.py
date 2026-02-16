"""
Medical Triage Web Application - Flask Backend
==============================================
Prototype for Raspberry Pi medical robot (competitions/demos).
Uses: Flask, SQLite, Gemini API for AI analysis.
All data stored locally. AI calls go to Gemini API (requires internet).
"""

import os
import sqlite3
import json
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
APP_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = APP_ROOT.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DB_PATH = APP_ROOT / "database.db"

# Gemini API key from environment. Set with: set GEMINI_API_KEY=your_key (Windows)
# Or: export GEMINI_API_KEY=your_key (Linux/Mac)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Hardcoded doctor credentials for prototype only
DOCTOR_ID = "doctor1"
DOCTOR_PASSWORD = "demo123"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")

# -----------------------------------------------------------------------------
# DATABASE HELPERS
# -----------------------------------------------------------------------------


def get_db():
    """Create a SQLite connection. Uses local file only (no cloud)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def init_db():
    """Create all tables if they do not exist."""
    conn = get_db()
    cur = conn.cursor()

    # Patients: identity via Fingerprint ID (simulated; replace with sensor later)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            fingerprint_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            sex TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Vitals: manual input for now; ready for Arduino/sensor integration
    cur.execute("""
        CREATE TABLE IF NOT EXISTS vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint_id INTEGER NOT NULL,
            weight REAL,
            height REAL,
            heart_rate INTEGER,
            spo2 INTEGER,
            temperature REAL,
            blood_pressure TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fingerprint_id) REFERENCES patients(fingerprint_id)
        )
    """)

    # Medical history: allergies and medications (doctor-editable)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS medical_history (
            fingerprint_id INTEGER PRIMARY KEY,
            current_allergies TEXT,
            past_allergies TEXT,
            current_medications TEXT,
            past_medications TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fingerprint_id) REFERENCES patients(fingerprint_id)
        )
    """)

    # Pain analysis: body part, Q&A, AI result
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pain_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint_id INTEGER NOT NULL,
            body_part TEXT NOT NULL,
            questions TEXT,
            answers TEXT,
            severity TEXT,
            ai_summary TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fingerprint_id) REFERENCES patients(fingerprint_id)
        )
    """)

    # Doctors: simple auth for prototype
    cur.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    """)

    # Insert default doctor if not exists
    cur.execute(
        "SELECT 1 FROM doctors WHERE doctor_id = ?", (DOCTOR_ID,)
    )
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO doctors (doctor_id, password) VALUES (?, ?)",
            (DOCTOR_ID, DOCTOR_PASSWORD),
        )

    # Add specific_area column if missing (for existing DBs)
    try:
        cur.execute("ALTER TABLE pain_analysis ADD COLUMN specific_area TEXT")
    except sqlite3.OperationalError:
        pass

    # Add recommendation column if missing (for existing DBs)
    try:
        cur.execute("ALTER TABLE pain_analysis ADD COLUMN recommendation TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()


# -----------------------------------------------------------------------------
# ROUTES: SERVE FRONTEND
# -----------------------------------------------------------------------------


@app.route("/")
def index_page():
    """Serve the patient registration page (index.html)."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/index.html")
def index_html():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/dashboard.html")
def dashboard_page():
    return send_from_directory(FRONTEND_DIR, "dashboard.html")


@app.route("/pain_map.html")
def pain_map_page():
    return send_from_directory(FRONTEND_DIR, "pain_map.html")


@app.route("/pain_questions.html")
def pain_questions_page():
    return send_from_directory(FRONTEND_DIR, "pain_questions.html")


@app.route("/analysis_result.html")
def analysis_result_page():
    return send_from_directory(FRONTEND_DIR, "analysis_result.html")


@app.route("/doctor_login.html")
def doctor_login_page():
    return send_from_directory(FRONTEND_DIR, "doctor_login.html")


@app.route("/language_selection.html")
def language_selection_page():
    return send_from_directory(FRONTEND_DIR, "language_selection.html")


@app.route("/doctor_dashboard.html")
def doctor_dashboard_page():
    return send_from_directory(FRONTEND_DIR, "doctor_dashboard.html")


@app.route("/style.css")
def style_css():
    return send_from_directory(FRONTEND_DIR, "style.css")


@app.route("/app.js")
def app_js():
    return send_from_directory(FRONTEND_DIR, "app.js")


@app.route("/body_diagram.png")
def body_diagram_png():
    return send_from_directory(FRONTEND_DIR, "body_diagram.png")


# -----------------------------------------------------------------------------
# API: PATIENT
# -----------------------------------------------------------------------------


@app.route("/api/register_patient", methods=["POST"])
def register_patient():
    """
    Register a new patient. Fingerprint ID is the primary identifier.
    In production, this would come from fingerprint sensor hardware.
    """
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    age = data.get("age")
    sex = (data.get("sex") or "").strip()
    fingerprint_id = data.get("fingerprint_id")

    if not name or age is None or not sex or fingerprint_id is None:
        return jsonify({"ok": False, "error": "Missing name, age, sex, or fingerprint_id"}), 400

    try:
        fingerprint_id = int(fingerprint_id)
        age = int(age)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Invalid age or fingerprint_id"}), 400

    if sex not in ("Male", "Female", "Other"):
        return jsonify({"ok": False, "error": "Sex must be Male, Female, or Other"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO patients (fingerprint_id, name, age, sex)
            VALUES (?, ?, ?, ?)
            """,
            (fingerprint_id, name, age, sex),
        )
        conn.commit()
        return jsonify({"ok": True, "fingerprint_id": fingerprint_id})
    except sqlite3.IntegrityError:
        return jsonify({"ok": False, "error": "Fingerprint ID already registered"}), 400
    finally:
        conn.close()


@app.route("/api/get_patient/<int:fingerprint_id>")
def get_patient(fingerprint_id):
    """Get patient by fingerprint ID."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT fingerprint_id, name, age, sex, created_at FROM patients WHERE fingerprint_id = ?",
        (fingerprint_id,),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"ok": False, "error": "Patient not found"}), 404

    return jsonify({
        "ok": True,
        "patient": {
            "fingerprint_id": row["fingerprint_id"],
            "name": row["name"],
            "age": row["age"],
            "sex": row["sex"],
            "created_at": row["created_at"],
        },
    })


@app.route("/api/get_all_patients")
def get_all_patients():
    """Return all registered patients (for doctor dashboard)."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT fingerprint_id, name, age, sex, created_at FROM patients ORDER BY created_at DESC"
    )
    rows = cur.fetchall()
    conn.close()

    patients = [
        {
            "fingerprint_id": r["fingerprint_id"],
            "name": r["name"],
            "age": r["age"],
            "sex": r["sex"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    return jsonify({"ok": True, "patients": patients})


@app.route("/api/save_vitals", methods=["POST"])
def save_vitals():
    """
    Save vitals for a patient. Currently manual input.
    TODO: Integrate Arduino/sensor modules for heart rate, SpO2, etc.
    """
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    if fingerprint_id is None:
        return jsonify({"ok": False, "error": "Missing fingerprint_id"}), 400

    try:
        fingerprint_id = int(fingerprint_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Invalid fingerprint_id"}), 400

    weight = data.get("weight")
    height = data.get("height")
    heart_rate = data.get("heart_rate")
    spo2 = data.get("spo2")
    temperature = data.get("temperature")
    blood_pressure = data.get("blood_pressure") or ""

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO vitals (fingerprint_id, weight, height, heart_rate, spo2, temperature, blood_pressure)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            fingerprint_id,
            _float(weight),
            _float(height),
            _int(heart_rate),
            _int(spo2),
            _float(temperature),
            str(blood_pressure),
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


def _float(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _int(v):
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None


@app.route("/api/save_pain_selection", methods=["POST"])
def save_pain_selection():
    """Store selected body part and specific area for pain. Used before question page."""
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    body_part = (data.get("body_part") or "").strip()
    specific_area = (data.get("specific_area") or "").strip()

    if fingerprint_id is None or not body_part:
        return jsonify({"ok": False, "error": "Missing fingerprint_id or body_part"}), 400

    try:
        fingerprint_id = int(fingerprint_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Invalid fingerprint_id"}), 400

    allowed = (
        "Head", "Chest", "Abdomen", "Left Arm", "Right Arm",
        "Left Leg", "Right Leg", "Back",
    )
    if body_part not in allowed:
        return jsonify({"ok": False, "error": "Invalid body_part"}), 400

    # We store it in the next pain_analysis record when they submit answers.
    # For now we just validate; frontend keeps body_part and specific_area in sessionStorage.
    return jsonify({"ok": True, "body_part": body_part, "specific_area": specific_area})


@app.route("/api/save_pain_answers", methods=["POST"])
def save_pain_answers():
    """Store raw Q&A. AI analysis is done via /api/analyze_condition."""
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    body_part = (data.get("body_part") or "").strip()
    specific_area = (data.get("specific_area") or "").strip()
    questions = data.get("questions")  # list of question strings
    answers = data.get("answers")     # list of answer strings

    if fingerprint_id is None or not body_part:
        return jsonify({"ok": False, "error": "Missing fingerprint_id or body_part"}), 400

    try:
        fingerprint_id = int(fingerprint_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Invalid fingerprint_id"}), 400

    q_json = json.dumps(questions) if questions is not None else "[]"
    a_json = json.dumps(answers) if answers is not None else "[]"

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO pain_analysis (fingerprint_id, body_part, specific_area, questions, answers, severity, ai_summary)
        VALUES (?, ?, ?, ?, ?, NULL, NULL)
        """,
        (fingerprint_id, body_part, specific_area, q_json, a_json),
    )
    conn.commit()
    analysis_id = cur.lastrowid
    conn.close()
    return jsonify({"ok": True, "analysis_id": analysis_id})


@app.route("/api/analyze_condition", methods=["POST"])
def analyze_condition():
    """
    Send vitals + body part + specific area + 10 answers to Gemini API.
    Returns severity (LOW/MEDIUM/HIGH/EMERGENCY), summary, recommendation.
    AI is advisory only — NOT a medical diagnosis.
    """
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    body_part = data.get("body_part")
    specific_area = data.get("specific_area")
    answers = data.get("answers")  # list
    questions = data.get("questions")  # list

    if fingerprint_id is None or not body_part or not answers:
        return jsonify({"ok": False, "error": "Missing fingerprint_id, body_part, or answers"}), 400

    try:
        fingerprint_id = int(fingerprint_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Invalid fingerprint_id"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT name, age, sex FROM patients WHERE fingerprint_id = ?",
        (fingerprint_id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"ok": False, "error": "Patient not found"}), 404

    cur.execute(
        """
        SELECT weight, height, heart_rate, spo2, temperature, blood_pressure
        FROM vitals WHERE fingerprint_id = ?
        ORDER BY timestamp DESC LIMIT 1
        """,
        (fingerprint_id,),
    )
    v = cur.fetchone()
    conn.close()

    vitals = {}
    if v:
        vitals = {
            "weight": v["weight"],
            "height": v["height"],
            "heart_rate": v["heart_rate"],
            "spo2": v["spo2"],
            "temperature": v["temperature"],
            "blood_pressure": v["blood_pressure"],
        }

    # Build context for Gemini
    qa_lines = []
    for i, q in enumerate(questions or []):
        a = (answers or [])[i] if i < len(answers or []) else "N/A"
        qa_lines.append(f"Q: {q}\nA: {a}")

<<<<<<< Updated upstream
    location_text = f"{body_part}"
if specific_area:
    location_text += f" - {specific_area}"

prompt = f"""You are an advisory triage assistant for a prototype medical robot.
This is NOT a real diagnosis.

Patient: {row['name']}, age {row['age']}, sex {row['sex']}.
Pain location: {location_text}
Vitals: {json.dumps(vitals)}

Questions and answers:
{chr(10).join(qa_lines)}

IMPORTANT:
- You MUST respond with ONLY raw JSON
- Do NOT include explanations
- Do NOT include markdown
- Do NOT include text before or after JSON
- Output must start with {{ and end with }}

Respond exactly in this JSON format:
{{
  "severity": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "summary": "2-3 sentence explanation",
  "recommendation": "Home care" | "Doctor consultation" | "Immediate emergency care"
}}"""

>>>>>>> Stashed changes

Patient: {row['name']}, age {row['age']}, sex {row['sex']}.
Pain location: {location_text}
Vitals: {json.dumps(vitals)}

Questions and answers:
{chr(10).join(qa_lines)}

IMPORTANT:
- You MUST respond with ONLY raw JSON
- Do NOT include explanations
- Do NOT include markdown
- Do NOT include text before or after JSON
- Output must start with {{ and end with }}

Respond exactly in this JSON format:
{{
  "severity": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "summary": "2-3 sentence explanation",
  "recommendation": "Home care" | "Doctor consultation" | "Immediate emergency care"
}}
"""

    if not GEMINI_API_KEY:
        # Offline fallback: mock response for demos without API key
        mock = {
            "severity": "MEDIUM",
            "summary": "Analysis completed. This is a demo result for testing purposes.",
            "recommendation": "Doctor consultation",
        }
        _save_analysis_result(fingerprint_id, body_part, specific_area, questions, answers, mock)
        return jsonify({"ok": True, "result": mock})

    err, result = _call_gemini(prompt)
    if err:
        return jsonify({"ok": False, "error": err}), 500

    # Normalize severity
    sev = (result.get("severity") or "MEDIUM").upper()
    if sev not in ("LOW", "MEDIUM", "HIGH", "EMERGENCY"):
        sev = "MEDIUM"
    result["severity"] = sev
    result["summary"] = result.get("summary") or "No summary provided."
    result["recommendation"] = result.get("recommendation") or "Doctor consultation"

    _save_analysis_result(fingerprint_id, body_part, specific_area, questions, answers, result)
    return jsonify({"ok": True, "result": result})


@app.route("/api/get_patient_vitals/<int:fingerprint_id>")
def get_patient_vitals(fingerprint_id):
    """Get all vitals records for a patient."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT weight, height, heart_rate, spo2, temperature, blood_pressure, timestamp
        FROM vitals WHERE fingerprint_id = ?
        ORDER BY timestamp DESC
        """,
        (fingerprint_id,),
    )
    rows = cur.fetchall()
    conn.close()

    vitals = []
    for r in rows:
        vitals.append({
            "weight": r["weight"],
            "height": r["height"],
            "heart_rate": r["heart_rate"],
            "spo2": r["spo2"],
            "temperature": r["temperature"],
            "blood_pressure": r["blood_pressure"],
            "timestamp": r["timestamp"],
        })
    return jsonify({"ok": True, "vitals": vitals})


@app.route("/api/get_patient_analyses/<int:fingerprint_id>")
def get_patient_analyses(fingerprint_id):
    """Get all pain analysis records for a patient."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT body_part, specific_area, questions, answers, severity, ai_summary, recommendation, timestamp
        FROM pain_analysis WHERE fingerprint_id = ?
        ORDER BY timestamp DESC
        """,
        (fingerprint_id,),
    )
    rows = cur.fetchall()
    conn.close()

    analyses = []
    for r in rows:
        try:
            rec = r["recommendation"] or "Doctor consultation"
        except (KeyError, TypeError):
            rec = "Doctor consultation"
        
        analyses.append({
            "body_part": r["body_part"],
            "specific_area": r["specific_area"],
            "questions": json.loads(r["questions"] or "[]"),
            "answers": json.loads(r["answers"] or "[]"),
            "severity": r["severity"],
            "ai_summary": r["ai_summary"],
            "recommendation": rec,
            "timestamp": r["timestamp"],
        })
    return jsonify({"ok": True, "analyses": analyses})



@app.route("/api/delete_patient/<int:fingerprint_id>", methods=["POST"])
def delete_patient(fingerprint_id):
    """Delete a patient and all associated data."""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM patients WHERE fingerprint_id = ?", (fingerprint_id,))
        cur.execute("DELETE FROM vitals WHERE fingerprint_id = ?", (fingerprint_id,))
        cur.execute("DELETE FROM medical_history WHERE fingerprint_id = ?", (fingerprint_id,))
        cur.execute("DELETE FROM pain_analysis WHERE fingerprint_id = ?", (fingerprint_id,))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        conn.close()


def _save_analysis_result(fingerprint_id, body_part, specific_area, questions, answers, result):
    """Update latest pain_analysis row with AI result, or insert new."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id FROM pain_analysis
        WHERE fingerprint_id = ? AND body_part = ? AND severity IS NULL
        ORDER BY timestamp DESC LIMIT 1
        """,
        (fingerprint_id, body_part),
    )
    row = cur.fetchone()
    q_json = json.dumps(questions or [])
    a_json = json.dumps(answers or [])
    summary = result.get("summary") or ""
    severity = result.get("severity") or "MEDIUM"
    recommendation = result.get("recommendation") or "Doctor consultation"

    if row:
        cur.execute(
            """
            UPDATE pain_analysis SET questions = ?, answers = ?, severity = ?, ai_summary = ?, recommendation = ?, specific_area = ?
            WHERE id = ?
            """,
            (q_json, a_json, severity, summary, recommendation, specific_area, row["id"]),
        )
    else:
        cur.execute(
            """
            INSERT INTO pain_analysis (fingerprint_id, body_part, specific_area, questions, answers, severity, ai_summary, recommendation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (fingerprint_id, body_part, specific_area, q_json, a_json, severity, summary, recommendation),
        )
    conn.commit()
    conn.close()

def _call_gemini(prompt):
    """
    Call Gemini API via HTTP (AI Studio compatible).
    """
    import urllib.request
    import urllib.error
    import json

    print(">>> _call_gemini() CALLED <<<")
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

    url += f"?key={GEMINI_API_KEY}"

    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        print(">>> GEMINI HTTP ERROR <<<")
        print("STATUS:", e.code)
        print("BODY:", error_body)
        return f"HTTP {e.code}: {error_body}", None
    except Exception as e:
        print(">>> GEMINI GENERAL ERROR <<<", e)
        return str(e), None

    try:
        text = resp["candidates"][0]["content"]["parts"][0]["text"]
        return None, json.loads(text)
    except Exception:
        return "Gemini returned invalid JSON", None



@app.route("/api/get_analysis/<int:fingerprint_id>")
def get_analysis(fingerprint_id):
    """Get latest pain analysis for patient."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT body_part, specific_area, questions, answers, severity, ai_summary, recommendation, timestamp
        FROM pain_analysis WHERE fingerprint_id = ?
        ORDER BY timestamp DESC LIMIT 1
        """,
        (fingerprint_id,),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"ok": False, "error": "No analysis found"}), 404

    try:
        rec = row["recommendation"] or "Doctor consultation"
    except (KeyError, TypeError):
        rec = "Doctor consultation"

    return jsonify({
        "ok": True,
        "analysis": {
            "body_part": row["body_part"],
            "specific_area": row["specific_area"],
            "questions": json.loads(row["questions"] or "[]"),
            "answers": json.loads(row["answers"] or "[]"),
            "severity": row["severity"],
            "ai_summary": row["ai_summary"],
            "recommendation": rec,
            "timestamp": row["timestamp"],
        },
    })


# -----------------------------------------------------------------------------
# API: DOCTOR
# -----------------------------------------------------------------------------


@app.route("/api/doctor_login", methods=["POST"])
def doctor_login():
    """Validate doctor credentials. Prototype: hardcoded only."""
    data = request.get_json() or {}
    did = (data.get("doctor_id") or "").strip()
    pwd = data.get("password") or ""

    if did == DOCTOR_ID and pwd == DOCTOR_PASSWORD:
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "Invalid credentials"}), 401


@app.route("/api/get_medical_history/<int:fingerprint_id>")
def get_medical_history(fingerprint_id):
    """Get medical history for a patient."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT fingerprint_id, current_allergies, past_allergies,
               current_medications, past_medications, updated_at
        FROM medical_history WHERE fingerprint_id = ?
        """,
        (fingerprint_id,),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({
            "ok": True,
            "history": {
                "fingerprint_id": fingerprint_id,
                "current_allergies": "",
                "past_allergies": "",
                "current_medications": "",
                "past_medications": "",
                "updated_at": None,
            },
        })

    return jsonify({
        "ok": True,
        "history": {
            "fingerprint_id": row["fingerprint_id"],
            "current_allergies": row["current_allergies"] or "",
            "past_allergies": row["past_allergies"] or "",
            "current_medications": row["current_medications"] or "",
            "past_medications": row["past_medications"] or "",
            "updated_at": row["updated_at"],
        },
    })


@app.route("/api/save_medical_history/<int:fingerprint_id>", methods=["POST"])
def save_medical_history(fingerprint_id):
    """Create or update medical history for a patient."""
    data = request.get_json() or {}
    curr_all = (data.get("current_allergies") or "").strip()
    past_all = (data.get("past_allergies") or "").strip()
    curr_med = (data.get("current_medications") or "").strip()
    past_med = (data.get("past_medications") or "").strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO medical_history (fingerprint_id, current_allergies, past_allergies, current_medications, past_medications, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(fingerprint_id) DO UPDATE SET
            current_allergies = excluded.current_allergies,
            past_allergies = excluded.past_allergies,
            current_medications = excluded.current_medications,
            past_medications = excluded.past_medications,
            updated_at = CURRENT_TIMESTAMP
        """,
        (fingerprint_id, curr_all, past_all, curr_med, past_med),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# -----------------------------------------------------------------------------
# API: DOCTOR FEATURES - PDF Export, Reports, Charts
# -----------------------------------------------------------------------------

from fpdf import FPDF
import io

class MedicalPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'Medical Robot Assistant - Patient Report', 0, 1, 'C')
        self.ln(5)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

@app.route("/api/export_patient_report/<int:fingerprint_id>")
def export_patient_report(fingerprint_id):
    """Generate comprehensive PDF report for patient."""
    conn = get_db()
    cur = conn.cursor()
    
    # Get patient info
    cur.execute("SELECT * FROM patients WHERE fingerprint_id = ?", (fingerprint_id,))
    patient = cur.fetchone()
    
    if not patient:
        conn.close()
        return jsonify({"ok": False, "error": "Patient not found"}), 404
    
    # Get vitals history
    cur.execute(
        """SELECT * FROM vitals WHERE fingerprint_id = ? ORDER BY recorded_at DESC""",
        (fingerprint_id,)
    )
    vitals = cur.fetchall()
    
    # Get pain analysis history
    cur.execute(
        """SELECT * FROM pain_analysis WHERE fingerprint_id = ? ORDER BY timestamp DESC""",
        (fingerprint_id,)
    )
    analyses = cur.fetchall()
    
    # Get medical history
    cur.execute(
        """SELECT * FROM medical_history WHERE fingerprint_id = ?""",
        (fingerprint_id,)
    )
    medical_history = cur.fetchone()
    
    conn.close()
    
    # Create PDF
    pdf = MedicalPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Patient Information
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Patient Information', 0, 1)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 8, f"Name: {patient['name']}", 0, 1)
    pdf.cell(0, 8, f"Age: {patient['age']} | Sex: {patient['sex']}", 0, 1)
    pdf.cell(0, 8, f"Fingerprint ID: {patient['fingerprint_id']}", 0, 1)
    pdf.cell(0, 8, f"Registered: {patient['registered_at']}", 0, 1)
    pdf.ln(5)
    
    # Medical History
    if medical_history:
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Medical History', 0, 1)
        pdf.set_font('Arial', '', 11)
        pdf.multi_cell(0, 6, f"Current Allergies: {medical_history['current_allergies'] or 'None'}")
        pdf.multi_cell(0, 6, f"Past Allergies: {medical_history['past_allergies'] or 'None'}")
        pdf.multi_cell(0, 6, f"Current Medications: {medical_history['current_medications'] or 'None'}")
        pdf.multi_cell(0, 6, f"Past Medications: {medical_history['past_medications'] or 'None'}")
        pdf.ln(5)
    
    # Vitals Summary
    if vitals:
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Vitals History', 0, 1)
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(30, 8, 'Date', 1)
        pdf.cell(25, 8, 'Weight', 1)
        pdf.cell(25, 8, 'Height', 1)
        pdf.cell(25, 8, 'BP', 1)
        pdf.cell(25, 8, 'Heart Rate', 1)
        pdf.cell(25, 8, 'SpO2', 1)
        pdf.cell(25, 8, 'Temp', 1)
        pdf.ln()
        
        pdf.set_font('Arial', '', 9)
        for v in vitals[:10]:  # Last 10 records
            pdf.cell(30, 8, str(v['recorded_at'])[:10], 1)
            pdf.cell(25, 8, f"{v['weight'] or '-'} kg", 1)
            pdf.cell(25, 8, f"{v['height'] or '-'} cm", 1)
            pdf.cell(25, 8, v['blood_pressure'] or '-', 1)
            pdf.cell(25, 8, f"{v['heart_rate'] or '-'} bpm", 1)
            pdf.cell(25, 8, f"{v['spo2'] or '-'}%", 1)
            pdf.cell(25, 8, f"{v['temperature'] or '-'} C", 1)
            pdf.ln()
        pdf.ln(5)
    
    # Pain Analysis History
    if analyses:
        pdf.add_page()
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Pain Analysis History', 0, 1)
        
        for i, analysis in enumerate(analyses[:5]):  # Last 5 analyses
            pdf.set_font('Arial', 'B', 11)
            pdf.cell(0, 8, f"Analysis {i+1} - {analysis['timestamp']}", 0, 1)
            pdf.set_font('Arial', '', 10)
            pdf.cell(0, 6, f"Body Part: {analysis['body_part']}", 0, 1)
            if analysis['specific_area']:
                pdf.cell(0, 6, f"Specific Area: {analysis['specific_area']}", 0, 1)
            pdf.cell(0, 6, f"Severity: {analysis['severity']}", 0, 1)
            pdf.cell(0, 6, f"Recommendation: {analysis['recommendation'] or 'Doctor consultation'}", 0, 1)
            pdf.multi_cell(0, 6, f"Summary: {analysis['ai_summary'] or 'N/A'}")
            pdf.ln(3)
    
    # Doctor Notes Section
    pdf.add_page()
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Doctor Notes & Prescription', 0, 1)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 10, 'Prescription: _________________________________________________', 0, 1)
    pdf.ln(5)
    pdf.cell(0, 10, 'Doctor Signature: ______________________________________________', 0, 1)
    pdf.cell(0, 10, f'Date: {datetime.now().strftime("%Y-%m-%d %H:%M")}', 0, 1)
    
    # Output PDF
    output = io.BytesIO()
    pdf.output(output)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"patient_report_{fingerprint_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    )


@app.route("/api/get_patient_timeline/<int:fingerprint_id>")
def get_patient_timeline(fingerprint_id):
    """Get complete patient history timeline for charts."""
    conn = get_db()
    cur = conn.cursor()
    
    # Get all vitals ordered by date
    cur.execute(
        """SELECT weight, height, blood_pressure, heart_rate, spo2, temperature, recorded_at 
         FROM vitals WHERE fingerprint_id = ? ORDER BY recorded_at ASC""",
        (fingerprint_id,)
    )
    vitals = [dict(row) for row in cur.fetchall()]
    
    # Get all pain analyses
    cur.execute(
        """SELECT body_part, specific_area, severity, timestamp 
         FROM pain_analysis WHERE fingerprint_id = ? ORDER BY timestamp ASC""",
        (fingerprint_id,)
    )
    analyses = [dict(row) for row in cur.fetchall()]
    
    conn.close()
    
    return jsonify({
        "ok": True,
        "timeline": {
            "vitals": vitals,
            "pain_analyses": analyses
        }
    })


@app.route("/api/compare_analyses/<int:fingerprint_id>")
def compare_analyses(fingerprint_id):
    """Compare pain analyses over time."""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        """SELECT body_part, specific_area, severity, ai_summary, recommendation, timestamp 
         FROM pain_analysis WHERE fingerprint_id = ? ORDER BY timestamp DESC""",
        (fingerprint_id,)
    )
    analyses = [dict(row) for row in cur.fetchall()]
    conn.close()
    
    # Group by body part
    by_body_part = {}
    for analysis in analyses:
        part = analysis['body_part']
        if part not in by_body_part:
            by_body_part[part] = []
        by_body_part[part].append(analysis)
    
    return jsonify({
        "ok": True,
        "analyses": analyses,
        "by_body_part": by_body_part,
        "total_count": len(analyses)
    })


@app.route("/api/upload_doctor_document/<int:fingerprint_id>", methods=["POST"])
def upload_doctor_document(fingerprint_id):
    """Allow doctors to upload PDF documents for patients."""
    if 'file' not in request.files:
        return jsonify({"ok": False, "error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"ok": False, "error": "No file selected"}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({"ok": False, "error": "Only PDF files allowed"}), 400
    
    # Create uploads directory if not exists
    uploads_dir = APP_ROOT / "uploads" / str(fingerprint_id)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    filepath = uploads_dir / filename
    file.save(filepath)
    
    # Store reference in database
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """CREATE TABLE IF NOT EXISTS doctor_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fingerprint_id) REFERENCES patients(fingerprint_id)
        )"""
    )
    cur.execute(
        """INSERT INTO doctor_documents (fingerprint_id, filename, filepath) 
         VALUES (?, ?, ?)""",
        (fingerprint_id, filename, str(filepath))
    )
    conn.commit()
    conn.close()
    
    return jsonify({"ok": True, "message": "File uploaded successfully", "filename": filename})


@app.route("/api/get_doctor_documents/<int:fingerprint_id>")
def get_doctor_documents(fingerprint_id):
    """Get list of doctor uploaded documents for a patient."""
    conn = get_db()
    cur = conn.cursor()
    
    # Check if table exists
    cur.execute("""SELECT name FROM sqlite_master WHERE type='table' AND name='doctor_documents'""")
    if not cur.fetchone():
        conn.close()
        return jsonify({"ok": True, "documents": []})
    
    cur.execute(
        """SELECT id, filename, uploaded_at FROM doctor_documents 
         WHERE fingerprint_id = ? ORDER BY uploaded_at DESC""",
        (fingerprint_id,)
    )
    documents = [dict(row) for row in cur.fetchall()]
    conn.close()
    
    return jsonify({"ok": True, "documents": documents})


@app.route("/api/download_document/<int:doc_id>")
def download_document(doc_id):
    """Download a doctor uploaded document."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT filepath, filename FROM doctor_documents WHERE id = ?", (doc_id,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return jsonify({"ok": False, "error": "Document not found"}), 404
    
    return send_file(row['filepath'], as_attachment=True, download_name=row['filename'])


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("Medical Triage App running at http://localhost:5000")
    print("Set GEMINI_API_KEY for AI analysis. Optional for demos (mock result used).")
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
