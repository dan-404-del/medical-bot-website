from flask import Flask, render_template, request, jsonify
from ai_engine_gemini import triage_ai

app = Flask(__name__)

# -------------------------------
# EXISTING WEBSITE (UNCHANGED)
# -------------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    result = None

    if request.method == "POST":
        symptoms = request.form["symptoms"]

        vitals = {
            "hr": int(request.form["hr"]),
            "spo2": int(request.form["spo2"]),
            "temp": float(request.form["temp"])
        }

        result = triage_ai(symptoms, vitals)

    return render_template("index.html", result=result)


# -------------------------------
# NEW API ENDPOINT (GEMINI)
# -------------------------------
@app.route("/api/triage", methods=["POST"])
def api_triage():
    data = request.get_json(force=True)

    symptoms = data.get("symptoms", "")
    vitals = {
        "hr": int(data.get("hr", 0)),
        "spo2": int(data.get("spo2", 0)),
        "temp": float(data.get("temp", 0))
    }

    result = triage_ai(symptoms, vitals)
    return jsonify(result)


# -------------------------------
# RUN ON PORT 5000
# -------------------------------
# -------------------------------
# RUN ON PORT 5000 (NO RELOADER)
# -------------------------------
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False
    )
