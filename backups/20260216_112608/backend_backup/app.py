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
    """Store selected body part for pain. Used before question page."""
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    body_part = (data.get("body_part") or "").strip()

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
    # For now we just validate; frontend keeps body_part in sessionStorage.
    return jsonify({"ok": True, "body_part": body_part})


@app.route("/api/save_pain_answers", methods=["POST"])
def save_pain_answers():
    """Store raw Q&A. AI analysis is done via /api/analyze_condition."""
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    body_part = (data.get("body_part") or "").strip()
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
        INSERT INTO pain_analysis (fingerprint_id, body_part, questions, answers, severity, ai_summary)
        VALUES (?, ?, ?, ?, NULL, NULL)
        """,
        (fingerprint_id, body_part, q_json, a_json),
    )
    conn.commit()
    analysis_id = cur.lastrowid
    conn.close()
    return jsonify({"ok": True, "analysis_id": analysis_id})


@app.route("/api/analyze_condition", methods=["POST"])
def analyze_condition():
    """
    Send vitals + body part + 10 answers to Gemini API.
    Returns severity (LOW/MEDIUM/HIGH/EMERGENCY), summary, recommendation.
    AI is advisory only — NOT a medical diagnosis.
    """
    data = request.get_json() or {}
    fingerprint_id = data.get("fingerprint_id")
    body_part = data.get("body_part")
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

        prompt = f"""You are an advisory triage assistant for a prototype medical robot.
This is NOT a real diagnosis.

Patient: {row['name']}, age {row['age']}, sex {row['sex']}.
Pain location: {body_part}
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
            "summary": "No AI key configured. This is a mock result. Configure GEMINI_API_KEY for real analysis.",
            "recommendation": "Doctor consultation",
        }
        _save_analysis_result(fingerprint_id, body_part, questions, answers, mock)
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

    _save_analysis_result(fingerprint_id, body_part, questions, answers, result)
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
        SELECT body_part, questions, answers, severity, ai_summary, recommendation, timestamp
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


def _save_analysis_result(fingerprint_id, body_part, questions, answers, result):
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
            UPDATE pain_analysis SET questions = ?, answers = ?, severity = ?, ai_summary = ?, recommendation = ?
            WHERE id = ?
            """,
            (q_json, a_json, severity, summary, recommendation, row["id"]),
        )
    else:
        cur.execute(
            """
            INSERT INTO pain_analysis (fingerprint_id, body_part, questions, answers, severity, ai_summary, recommendation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (fingerprint_id, body_part, q_json, a_json, severity, summary, recommendation),
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
        SELECT body_part, questions, answers, severity, ai_summary, recommendation, timestamp
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
# MAIN
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("Medical Triage App running at http://localhost:5000")
    print("Set GEMINI_API_KEY for AI analysis. Optional for demos (mock result used).")
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
