/**
 * Medical Triage App - Frontend Logic
 * Vanilla JS only. Uses sessionStorage for fingerprint_id and body_part.
 * API base: /api (Flask backend).
 */

(function () {
  "use strict";

  const API = "/api";

  // ---------------------------------------------------------------------------
  // Session helpers: store fingerprint_id and body_part across pages
  // ---------------------------------------------------------------------------
  function getFingerprintId() {
    return sessionStorage.getItem("fingerprint_id") || "";
  }
  function setFingerprintId(id) {
    sessionStorage.setItem("fingerprint_id", String(id));
  }
  function getBodyPart() {
    return sessionStorage.getItem("body_part") || "";
  }
  function setBodyPart(part) {
    sessionStorage.setItem("body_part", part);
  }
  function getSpecificArea() {
    return sessionStorage.getItem("specific_area") || "";
  }
  function setSpecificArea(area) {
    sessionStorage.setItem("specific_area", area);
  }
  function clearSession() {
    sessionStorage.removeItem("fingerprint_id");
    sessionStorage.removeItem("body_part");
    sessionStorage.removeItem("specific_area");
  }

  /**
   * Exactly 10 questions per body part. Questions vary slightly by location.
   * Used for pain_questions.html and sent to AI.
   */
  const QUESTIONS_BY_BODY_PART = {
    Head: [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Any vision or balance issues?",
      "Does movement worsen pain?",
      "History of head injury?",
      "Pain worsening or stable?",
    ],
    Chest: [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading (e.g. arm, jaw)?",
      "Fever present?",
      "Breathing difficulty?",
      "Does movement worsen pain?",
      "History of chest injury or heart issues?",
      "Pain worsening or stable?",
    ],
    Abdomen: [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Nausea or vomiting?",
      "Does movement worsen pain?",
      "History of abdominal injury or surgery?",
      "Pain worsening or stable?",
    ],
    "Left Arm": [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Numbness or tingling?",
      "Does movement worsen pain?",
      "History of injury?",
      "Pain worsening or stable?",
    ],
    "Right Arm": [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Numbness or tingling?",
      "Does movement worsen pain?",
      "History of injury?",
      "Pain worsening or stable?",
    ],
    "Left Leg": [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Swelling or redness?",
      "Does movement worsen pain?",
      "History of injury?",
      "Pain worsening or stable?",
    ],
    "Right Leg": [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Swelling or redness?",
      "Does movement worsen pain?",
      "History of injury?",
      "Pain worsening or stable?",
    ],
    Back: [
      "Pain intensity (1-10)?",
      "Sharp or dull pain?",
      "Sudden or gradual onset?",
      "How long have you had it?",
      "Is pain spreading?",
      "Fever present?",
      "Numbness or leg weakness?",
      "Does movement worsen pain?",
      "History of back injury?",
      "Pain worsening or stable?",
    ],
  };

  function getQuestionsForBodyPart(part) {
    return QUESTIONS_BY_BODY_PART[part] || QUESTIONS_BY_BODY_PART["Head"];
  }

  // ---------------------------------------------------------------------------
  // API helpers
  // ---------------------------------------------------------------------------
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  // ---------------------------------------------------------------------------
  // Page: index.html – Patient Registration
  // ---------------------------------------------------------------------------
  function initRegister() {
    const form = document.getElementById("register-form");
    const msg = document.getElementById("register-msg");
    const loginForm = document.getElementById("login-form");
    const loginMsg = document.getElementById("login-msg");

    // Login: already registered – use Fingerprint ID only
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginMsg) { loginMsg.textContent = ""; loginMsg.className = "msg"; }
        const fidInput = document.getElementById("login_fingerprint_id");
        const fid = (fidInput && fidInput.value.trim()) || "";
        if (!fid) {
          if (loginMsg) { loginMsg.textContent = "Enter your Fingerprint ID."; loginMsg.className = "msg error"; }
          return;
        }
        try {
          const r = await fetchJSON(`${API}/get_patient/${parseInt(fid, 10)}`);
          if (r.ok && r.patient) {
            setFingerprintId(r.patient.fingerprint_id);
            window.location.href = "/dashboard.html";
          } else {
            if (loginMsg) { loginMsg.textContent = "Patient not found. Register first."; loginMsg.className = "msg error"; }
          }
        } catch (err) {
          if (loginMsg) { loginMsg.textContent = err.message || "Login failed."; loginMsg.className = "msg error"; }
        }
      });
    }

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";
      msg.className = "msg";

      const name = document.getElementById("name").value.trim();
      const age = document.getElementById("age").value.trim();
      const sex = document.getElementById("sex").value;
      const fingerprintId = document.getElementById("fingerprint_id").value.trim();

      if (!name || !age || !fingerprintId) {
        msg.textContent = "Please fill Name, Age, and Fingerprint ID.";
        msg.className = "msg error";
        return;
      }

      try {
        const r = await fetchJSON(`${API}/register_patient`, {
          method: "POST",
          body: JSON.stringify({
            name,
            age: parseInt(age, 10),
            sex: sex || "Other",
            fingerprint_id: parseInt(fingerprintId, 10),
          }),
        });
        if (r.ok) {
          setFingerprintId(r.fingerprint_id);
          window.location.href = "/dashboard.html";
        }
      } catch (err) {
        msg.textContent = err.message || "Registration failed.";
        msg.className = "msg error";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Page: dashboard.html – Patient Dashboard (vitals)
  // ---------------------------------------------------------------------------
  function initDashboard() {
    const fid = getFingerprintId();
    if (!fid) {
      window.location.href = "/";
      return;
    }

    const info = document.getElementById("patient-info");
    const vitalsForm = document.getElementById("vitals-form");
    const vitalsMsg = document.getElementById("vitals-msg");

    async function loadPatient() {
      try {
        const r = await fetchJSON(`${API}/get_patient/${fid}`);
        if (!r.ok || !r.patient) {
          window.location.href = "/";
          return;
        }
        const p = r.patient;
        info.innerHTML = `
          <p><strong>Name:</strong> ${escapeHtml(p.name)}</p>
          <p><strong>Age:</strong> ${p.age}</p>
          <p><strong>Sex:</strong> ${escapeHtml(p.sex)}</p>
          <p><strong>Fingerprint ID:</strong> ${p.fingerprint_id}</p>
        `;

        // Fetch and display medical history for patients (read-only)
        const historyR = await fetchJSON(`${API}/get_medical_history/${fid}`);
        const h = historyR.history || {};
        const remarksEl = document.getElementById("doctor-remarks");
        if (remarksEl) {
          remarksEl.innerHTML = `
            <p><strong>Current Allergies:</strong> ${escapeHtml(h.current_allergies || 'N/A')}</p>
            <p><strong>Past Allergies:</strong> ${escapeHtml(h.past_allergies || 'N/A')}</p>
            <p><strong>Current Medications:</strong> ${escapeHtml(h.current_medications || 'N/A')}</p>
            <p><strong>Past Medications:</strong> ${escapeHtml(h.past_medications || 'N/A')}</p>
          `;
        }
      } catch {
        window.location.href = "/";
      }
    }

    if (vitalsForm) {
      vitalsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        vitalsMsg.textContent = "";
        vitalsMsg.className = "msg";
        const get = (id) => (document.getElementById(id) && document.getElementById(id).value) || "";
        try {
          await fetchJSON(`${API}/save_vitals`, {
            method: "POST",
            body: JSON.stringify({
              fingerprint_id: parseInt(fid, 10),
              weight: get("weight") ? parseFloat(get("weight")) : null,
              height: get("height") ? parseFloat(get("height")) : null,
              heart_rate: get("heart_rate") ? parseInt(get("heart_rate"), 10) : null,
              spo2: get("spo2") ? parseInt(get("spo2"), 10) : null,
              temperature: get("temperature") ? parseFloat(get("temperature")) : null,
              blood_pressure: get("blood_pressure"),
            }),
          });
          vitalsMsg.textContent = "Vitals saved.";
          vitalsMsg.className = "msg success";
        } catch (err) {
          vitalsMsg.textContent = err.message || "Failed to save vitals.";
          vitalsMsg.className = "msg error";
        }
      });
    }

    const painBtn = document.getElementById("btn-pain");
    if (painBtn) {
      painBtn.addEventListener("click", () => {
        window.location.href = "/pain_map.html";
      });
    }

    loadPatient();
  }

  // ---------------------------------------------------------------------------
  // Page: pain_map.html – Body part selection
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Page: pain_map.html – Body part selection
  // ---------------------------------------------------------------------------
  // Coordinates for clickable regions on body diagram (relative to 280x450 image)
  const BODY_PART_REGIONS = [
    { name: "Head",      x: 80, y: 0,   width: 120, height: 80 },
    { name: "Chest",     x: 80, y: 85,  width: 120, height: 100 },
    { name: "Abdomen",   x: 80, y: 190, width: 120, height: 80 },
    { name: "Left Arm",  x: 0,  y: 80,  width: 70,  height: 150 },
    { name: "Right Arm", x: 210, y: 80, width: 70,  height: 150 },
    { name: "Left Leg",  x: 60, y: 280, width: 70,  height: 170 },
    { name: "Right Leg", x: 150, y: 280, width: 70,  height: 170 },
    { name: "Back",      x: 80, y: 85,  width: 120, height: 200 }, // Overlaps chest/abdomen, for simplicity assumes click on torso back area.
  ];

  // Specific areas for each body part
  const SPECIFIC_AREAS = {
    "Head": ["Forehead", "Temple", "Eye area", "Nose", "Cheeks", "Jaw", "Neck", "Scalp"],
    "Chest": ["Sternum", "Left side", "Right side", "Upper chest", "Lower chest", "Heart area", "Lungs area"],
    "Abdomen": ["Upper abdomen", "Lower abdomen", "Left side", "Right side", "Navel area", "Stomach area", "Intestinal area"],
    "Left Arm": ["Shoulder", "Upper arm", "Elbow", "Forearm", "Wrist", "Hand", "Fingers", "Thumb"],
    "Right Arm": ["Shoulder", "Upper arm", "Elbow", "Forearm", "Wrist", "Hand", "Fingers", "Thumb"],
    "Left Leg": ["Hip", "Upper thigh", "Knee", "Lower thigh", "Shin", "Ankle", "Foot", "Toes"],
    "Right Leg": ["Hip", "Upper thigh", "Knee", "Lower thigh", "Shin", "Ankle", "Foot", "Toes"],
    "Back": ["Upper back", "Middle back", "Lower back", "Left side", "Right side", "Spine", "Shoulder blades", "Tailbone"]
  };

  function initPainMap() {
    const fid = getFingerprintId();
    if (!fid) {
      window.location.href = "/";
      return;
    }

    const overlay = document.getElementById("body-diagram-overlay");
    const diagramImg = document.getElementById("body-diagram-img");
    const quickBtns = document.getElementById("body-part-buttons");
    const msg = document.getElementById("pain-map-msg");
    const nextBtn = document.getElementById("btn-pain-next");
    const skipBtn = document.getElementById("btn-skip-pain");
    const diagramLabel = document.getElementById("diagram-label");

    if (!overlay) return;

    // Gender-specific diagram: fetch patient and show Male/Female label
    fetchJSON(`${API}/get_patient/${parseInt(fid, 10)}`)
      .then((r) => {
        if (r.ok && r.patient && diagramLabel) {
          const sex = (r.patient.sex || "").toLowerCase();
          diagramLabel.textContent = sex === "female" ? "Body diagram (Female)" : "Body diagram (Male)";
        }
      })
      .catch(() => {});

    let selectedPart = getBodyPart();
    let selectedArea = getSpecificArea();
    let highlightedArea = null;

    function showSpecificAreaSection(bodyPart) {
      const specificSection = document.getElementById("specific-area-section");
      const selectedPartSpan = document.getElementById("selected-body-part");
      const areaButtons = document.getElementById("specific-area-buttons");
      const bodyPartImage = document.getElementById("body-part-image");
      const areaNamesBox = document.getElementById("area-names-box");

      if (!specificSection || !SPECIFIC_AREAS[bodyPart]) {
        return;
      }

      // Update section title
      if (selectedPartSpan) {
        selectedPartSpan.textContent = bodyPart;
      }

      // Update image (placeholder for now)
      if (bodyPartImage) {
        bodyPartImage.innerHTML = `
          <div style="text-align: center; color: #718096;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🦾</div>
            <div>${bodyPart} Image</div>
          </div>
        `;
      }

      // Update area names box
      if (areaNamesBox) {
        const areas = SPECIFIC_AREAS[bodyPart];
        areaNamesBox.innerHTML = areas.map(area => 
          `<div style="padding: 4px 0; border-bottom: 1px solid #e2e8f0;">• ${area}</div>`
        ).join('');
      }

      // Create area buttons
      if (areaButtons) {
        areaButtons.innerHTML = "";
        SPECIFIC_AREAS[bodyPart].forEach(area => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-outline";
          btn.textContent = area;
          btn.addEventListener("click", () => selectSpecificArea(area));
          areaButtons.appendChild(btn);
        });
      }

      // Show the section
      specificSection.classList.remove("hidden");
    }

    function selectSpecificArea(area) {
      selectedArea = area;
      setSpecificArea(area);
      
      // Update button styles
      const areaButtons = document.getElementById("specific-area-buttons");
      if (areaButtons) {
        areaButtons.querySelectorAll("button").forEach(btn => {
          if (btn.textContent === area) {
            btn.className = "btn btn-primary";
          } else {
            btn.className = "btn btn-outline";
          }
        });
      }

      // Update message
      if (msg) {
        msg.textContent = `Selected: ${selectedPart} - ${area}`;
        msg.className = "msg success";
      }
    }

    function highlightBodyPart(partName, region) {
      if (highlightedArea) {
        overlay.removeChild(highlightedArea);
      }
      if (!partName) {
        selectedPart = "";
        setBodyPart("");
        return;
      }

      highlightedArea = document.createElement("div");
      highlightedArea.style.position = "absolute";
      highlightedArea.style.left = `${region.x}px`;
      highlightedArea.style.top = `${region.y}px`;
      highlightedArea.style.width = `${region.width}px`;
      highlightedArea.style.height = `${region.height}px`;
      highlightedArea.style.backgroundColor = "rgba(49, 130, 206, 0.4)"; // Blue transparent
      highlightedArea.style.border = "2px solid #3182ce";
      highlightedArea.style.borderRadius = "5px";
      highlightedArea.style.cursor = "pointer";
      overlay.appendChild(highlightedArea);
      selectedPart = partName;
      setBodyPart(partName);
    }

    function selectPartByName(partName) {
      const region = BODY_PART_REGIONS.find((r) => r.name === partName);
      if (!region) return;
      highlightBodyPart(partName, region);
      showSpecificAreaSection(partName);
      if (msg) {
        msg.textContent = `Selected: ${partName}`;
        msg.className = "msg success";
      }
    }

    // If image fails to load, show message and rely on quick buttons
    if (diagramImg) {
      diagramImg.addEventListener("error", () => {
        if (msg) {
          msg.textContent = "Body diagram failed to load. Use the Quick select buttons below.";
          msg.className = "msg error";
        }
      });
    }

    // Build visible body-part buttons
    if (quickBtns) {
      quickBtns.innerHTML = "";
      BODY_PART_REGIONS.forEach((r) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn btn-secondary";
        b.textContent = r.name;
        b.addEventListener("click", () => selectPartByName(r.name));
        quickBtns.appendChild(b);
      });
    }

    // Restore selection on load
    if (selectedPart) {
      selectPartByName(selectedPart);
    }

    overlay.addEventListener("click", (e) => {
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let clickedPart = null;
      let clickedRegion = null;

      for (const region of BODY_PART_REGIONS) {
        // Adjust region coordinates based on diagram container scaling
        // The container is 280x450, the coordinates are for this fixed size
        if (x >= region.x && x <= region.x + region.width &&
            y >= region.y && y <= region.y + region.height) {
          clickedPart = region.name;
          clickedRegion = region;
          break;
        }
      }

      if (clickedPart) {
        highlightBodyPart(clickedPart, clickedRegion);
        showSpecificAreaSection(clickedPart);
        if (msg) {
          msg.textContent = `Selected: ${clickedPart}`;
          msg.className = "msg success";
        }
      } else {
        highlightBodyPart(null, null); // Clear selection
        // Hide specific area section
        const specificSection = document.getElementById("specific-area-section");
        if (specificSection) {
          specificSection.classList.add("hidden");
        }
        if (msg) {
          msg.textContent = "Click a body part on the diagram (or use Quick select buttons).";
          msg.className = "msg error";
        }
      }
    });

    if (nextBtn) {
      nextBtn.addEventListener("click", async () => {
        if (!selectedPart) {
          msg.textContent = "Please select a body part.";
          msg.className = "msg error";
          return;
        }
        msg.textContent = "";
        try {
          await fetchJSON(`${API}/save_pain_selection`, {
            method: "POST",
            body: JSON.stringify({ 
              fingerprint_id: parseInt(fid, 10), 
              body_part: selectedPart,
              specific_area: selectedArea || ""
            }),
          });
          window.location.href = "/pain_questions.html";
        } catch (err) {
          msg.textContent = err.message || "Failed to save selection.";
          msg.className = "msg error";
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        // Clear any pain selection related session data before skipping
        setBodyPart(""); // Clear selected body part
        window.location.href = "/dashboard.html";
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Page: pain_questions.html – 10 questions, then Analyze
  // ---------------------------------------------------------------------------
  function initPainQuestions() {
    const fid = getFingerprintId();
    const bodyPart = getBodyPart();
    const specificArea = getSpecificArea();
    if (!fid || !bodyPart) {
      window.location.href = "/dashboard.html";
      return;
    }

    const title = document.getElementById("pain-questions-title");
    const form = document.getElementById("pain-questions-form");
    const container = document.getElementById("questions-container");
    const msg = document.getElementById("pain-questions-msg");

    if (title) title.textContent = `Pain location: ${bodyPart}${specificArea ? ` - ${specificArea}` : ''}`;

    const questions = getQuestionsForBodyPart(bodyPart);
    const answers = [];

    function addQuestion(q, i) {
      const div = document.createElement("div");
      div.className = "question-block";
      const label = document.createElement("label");
      label.textContent = `Q${i + 1}. ${q}`;

      let input;
      if (q.toLowerCase().includes("intensity (1-10)")) {
        input = document.createElement("input");
        input.type = "number";
        input.min = 1;
        input.max = 10;
        input.required = true;
        input.placeholder = "1–10";
        input.dataset.q = i;
      } else if (
        q.toLowerCase().includes("sharp or dull") ||
        q.toLowerCase().includes("sudden or gradual") ||
        q.toLowerCase().includes("spreading") ||
        q.toLowerCase().includes("fever") ||
        q.toLowerCase().includes("breathing") ||
        q.toLowerCase().includes("numbness") ||
        q.toLowerCase().includes("tingling") ||
        q.toLowerCase().includes("vision") ||
        q.toLowerCase().includes("balance") ||
        q.toLowerCase().includes("nausea") ||
        q.toLowerCase().includes("vomiting") ||
        q.toLowerCase().includes("swelling") ||
        q.toLowerCase().includes("weakness") ||
        q.toLowerCase().includes("movement") ||
        q.toLowerCase().includes("injury") ||
        q.toLowerCase().includes("worsening") ||
        q.toLowerCase().includes("how long") ||
        q.toLowerCase().includes("history")
      ) {
        const opts = getOptionsForQuestion(q);
        input = document.createElement("div");
        input.className = "radio-group";
        opts.forEach((opt) => {
          const lab = document.createElement("label");
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = `q${i}`;
          radio.value = opt;
          radio.dataset.q = i;
          lab.appendChild(radio);
          lab.appendChild(document.createTextNode(" " + opt));
          input.appendChild(lab);
        });
      } else {
        // For any remaining questions, provide Yes/No options instead of text input
        input = document.createElement("div");
        input.className = "radio-group";
        ["Yes", "No"].forEach((opt) => {
          const lab = document.createElement("label");
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = `q${i}`;
          radio.value = opt;
          radio.dataset.q = i;
          lab.appendChild(radio);
          lab.appendChild(document.createTextNode(" " + opt));
          input.appendChild(lab);
        });
      }

      div.appendChild(label);
      div.appendChild(input);
      (container || form).appendChild(div);
    }

    function getOptionsForQuestion(q) {
      if (q.toLowerCase().includes("sharp or dull")) return ["Sharp", "Dull"];
      if (q.toLowerCase().includes("sudden or gradual")) return ["Sudden", "Gradual"];
      if (q.toLowerCase().includes("spreading")) return ["Yes", "No"];
      if (q.toLowerCase().includes("fever")) return ["Yes", "No"];
      if (q.toLowerCase().includes("breathing")) return ["Yes", "No"];
      if (q.toLowerCase().includes("numbness")) return ["Yes", "No"];
      if (q.toLowerCase().includes("tingling")) return ["Yes", "No"];
      if (q.toLowerCase().includes("vision")) return ["Yes", "No"];
      if (q.toLowerCase().includes("balance")) return ["Yes", "No"];
      if (q.toLowerCase().includes("nausea")) return ["Yes", "No"];
      if (q.toLowerCase().includes("vomiting")) return ["Yes", "No"];
      if (q.toLowerCase().includes("swelling")) return ["Yes", "No"];
      if (q.toLowerCase().includes("weakness")) return ["Yes", "No"];
      if (q.toLowerCase().includes("movement")) return ["Yes", "No"];
      if (q.toLowerCase().includes("injury")) return ["Yes", "No"];
      if (q.toLowerCase().includes("worsening")) return ["Worsening", "Stable"];
      if (q.toLowerCase().includes("how long")) return ["Less than 1 day", "1-3 days", "4-7 days", "More than 1 week"];
      if (q.toLowerCase().includes("history")) return ["Yes", "No"];
      return ["Yes", "No"];
    }

    function collectAnswers() {
      const out = [];
      const root = container || form;
      for (let i = 0; i < questions.length; i++) {
        const el = root.querySelector(`input[data-q="${i}"]`) || root.querySelector(`[data-q="${i}"]`);
        if (!el) {
          out.push("");
          continue;
        }
        if (el.type === "number") {
          out.push((el.value || "").trim());
        } else {
          // Handle radio button groups
          const radio = root.querySelector(`input[name="q${i}"]:checked`);
          out.push(radio ? radio.value : "");
        }
      }
      return out;
    }

    questions.forEach((q, i) => addQuestion(q, i));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";
      msg.className = "msg";
      const ans = collectAnswers();
      if (ans.some((a) => !a)) {
        msg.textContent = "Please answer all questions.";
        msg.className = "msg error";
        return;
      }

      try {
        await fetchJSON(`${API}/save_pain_answers`, {
          method: "POST",
          body: JSON.stringify({
            fingerprint_id: parseInt(fid, 10),
            body_part: bodyPart,
            specific_area: specificArea,
            questions,
            answers: ans,
          }),
        });
        const r = await fetchJSON(`${API}/analyze_condition`, {
          method: "POST",
          body: JSON.stringify({
            fingerprint_id: parseInt(fid, 10),
            body_part: bodyPart,
            specific_area: specificArea,
            questions,
            answers: ans,
          }),
        });
        if (r.ok && r.result) {
          sessionStorage.setItem("last_analysis", JSON.stringify(r.result));
          window.location.href = "/analysis_result.html";
        } else {
          msg.textContent = "Analysis failed.";
          msg.className = "msg error";
        }
      } catch (err) {
        msg.textContent = err.message || "Analysis failed.";
        msg.className = "msg error";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Page: analysis_result.html
  // ---------------------------------------------------------------------------
  function initAnalysisResultSync() {
    const fid = getFingerprintId();
    if (!fid) {
      window.location.href = "/";
      return;
    }

    const raw = sessionStorage.getItem("last_analysis");
    let result = null;
    try {
      result = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    const card = document.getElementById("result-card");
    const summaryEl = document.getElementById("result-summary");
    const recEl = document.getElementById("result-recommendation");
    const homeBtn = document.getElementById("btn-result-home");

    function render(res) {
      if (!res) {
        if (card) card.innerHTML = "<p>No analysis result found.</p>";
        return;
      }
      const sev = (res.severity || "MEDIUM").toUpperCase();
      if (card) {
        card.className = "result-card severity-" + sev;
        card.innerHTML = "<h2>Severity: " + sev + "</h2>";
      }
      if (summaryEl) summaryEl.textContent = res.summary || "";
      if (recEl) recEl.textContent = res.recommendation || "Doctor consultation";
    }

    if (result) {
      render(result);
    } else {
      fetchJSON(`${API}/get_analysis/${fid}`)
        .then((r) => {
          if (r.ok && r.analysis)
            render({
              severity: r.analysis.severity,
              summary: r.analysis.ai_summary,
              recommendation: r.analysis.recommendation || "Doctor consultation",
            });
          else render(null);
        })
        .catch(() => render(null));
    }

    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        sessionStorage.removeItem("last_analysis");
        window.location.href = "/dashboard.html";
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Page: doctor_login.html
  // ---------------------------------------------------------------------------
  function initDoctorLogin() {
    const form = document.getElementById("doctor-login-form");
    const msg = document.getElementById("doctor-login-msg");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";
      msg.className = "msg";
      const doctorId = document.getElementById("doctor_id").value.trim();
      const password = document.getElementById("doctor_password").value;

      try {
        const r = await fetchJSON(`${API}/doctor_login`, {
          method: "POST",
          body: JSON.stringify({ doctor_id: doctorId, password }),
        });
        if (r.ok) {
          sessionStorage.setItem("doctor_logged_in", "1");
          window.location.href = "/doctor_dashboard.html";
        }
      } catch (err) {
        msg.textContent = err.message || "Invalid credentials.";
        msg.className = "msg error";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Page: doctor_dashboard.html
  // ---------------------------------------------------------------------------
  function initDoctorDashboard() {
    if (!sessionStorage.getItem("doctor_logged_in")) {
      window.location.href = "/doctor_login.html";
      return;
    }

    const logout = document.getElementById("doctor-logout");
    if (logout) logout.addEventListener("click", (e) => { e.preventDefault(); sessionStorage.removeItem("doctor_logged_in"); window.location.href = "/doctor_login.html"; });

    const search = document.getElementById("search-input");
    const list = document.getElementById("patient-list");
    const detail = document.getElementById("patient-detail");

    let allPatients = [];
    let selectedFid = null;

    const deleteBtn = document.getElementById("delete-patient-btn");
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!selectedFid) return;
        if (!confirm(`Are you sure you want to delete patient ${selectedFid}? This cannot be undone.`)) {
          return;
        }
        try {
          await fetchJSON(`${API}/delete_patient/${selectedFid}`, { method: "POST" });
          alert("Patient deleted successfully.");
          detail.classList.add("hidden");
          selectedFid = null;
          deleteBtn.classList.add("hidden"); // Hide button after deletion
          loadPatients(); // Reload the patient list
        } catch (err) {
          alert(err.message || "Failed to delete patient.");
        }
      };
    }

    async function loadPatients() {
      try {
        const r = await fetchJSON(`${API}/get_all_patients`);
        allPatients = r.patients || [];
        renderList(allPatients);
      } catch (err) {
        if (list) list.innerHTML = "<li>Failed to load patients.</li>";
      }
    }

    function renderList(patients) {
      if (!list) return;
      list.innerHTML = "";
      patients.forEach((p) => {
        const li = document.createElement("li");
        li.dataset.fid = p.fingerprint_id;
        li.innerHTML = `<span class="name">${escapeHtml(p.name)}</span><span class="meta">ID: ${p.fingerprint_id} · ${p.age} y · ${p.sex}</span>`;
        li.addEventListener("click", () => selectPatient(p.fingerprint_id));
        list.appendChild(li);
      });
    }

    function filterList() {
      const q = (search && search.value.trim().toLowerCase()) || "";
      if (!q) {
        renderList(allPatients);
        return;
      }
      const filtered = allPatients.filter(
        (p) =>
          String(p.fingerprint_id) === q ||
          (p.name || "").toLowerCase().includes(q)
      );
      renderList(filtered);
    }

    if (search) search.addEventListener("input", filterList);

    async function selectPatient(fid) {
      selectedFid = fid;
      list.querySelectorAll("li").forEach((el) => el.classList.toggle("selected", parseInt(el.dataset.fid, 10) === fid));
      detail.classList.remove("hidden");
      if (deleteBtn) deleteBtn.classList.remove("hidden");

      // Temporarily clear detail while loading, but keep the delete button intact
      const currentDetailContent = detail.innerHTML;
      detail.innerHTML = "<p>Loading…</p>" + (deleteBtn ? deleteBtn.outerHTML : "");

      try {
        const r = await fetchJSON(`${API}/get_medical_history/${fid}`);
        const h = r.history || {};

        const vitalsR = await fetchJSON(`${API}/get_patient_vitals/${fid}`);
        const vitals = vitalsR.vitals || [];

        const analysesR = await fetchJSON(`${API}/get_patient_analyses/${fid}`);
        const analyses = analysesR.analyses || [];

        let vitalsHtml = '<h3>No vitals recorded.</h3>';
        if (vitals.length > 0) {
            vitalsHtml = '<div class="vitals-list">';
            vitals.forEach(v => {
                vitalsHtml += `
                    <div class="vitals-item" style="background: #f7fafc; padding: 12px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
                        <p><strong>Timestamp:</strong> ${v.timestamp}</p>
                        <p><strong>Weight:</strong> ${v.weight || 'N/A'} kg</p>
                        <p><strong>Height:</strong> ${v.height || 'N/A'} cm</p>
                        <p><strong>Heart Rate:</strong> ${v.heart_rate || 'N/A'} bpm</p>
                        <p><strong>SpO2:</strong> ${v.spo2 || 'N/A'} %</p>
                        <p><strong>Temperature:</strong> ${v.temperature || 'N/A'} °C</p>
                        <p><strong>Blood Pressure:</strong> ${escapeHtml(v.blood_pressure || 'N/A')}</p>
                    </div>
                `;
            });
            vitalsHtml += '</div>';
        }

        let analysesHtml = '<h3>No AI analyses recorded.</h3>';
        if (analyses.length > 0) {
            analysesHtml = '<div class="analyses-list">';
            analyses.forEach(a => {
                const severityClass = `severity-${(a.severity || 'MEDIUM').toUpperCase()}`;
                analysesHtml += `
                    <div class="analyses-item ${severityClass}" style="padding: 12px; border-radius: 6px; margin-bottom: 8px; border: 1px solid;">
                        <p><strong>Timestamp:</strong> ${a.timestamp}</p>
                        <p><strong>Body Part:</strong> ${escapeHtml(a.body_part)}</p>
                        <p><strong>Severity:</strong> <span class="${severityClass}">${a.severity}</span></p>
                        <p><strong>Summary:</strong> ${escapeHtml(a.ai_summary || 'N/A')}</p>
                        <p><strong>Recommendation:</strong> ${escapeHtml(a.recommendation || 'N/A')}</p>
                    </div>
                `;
            });
            analysesHtml += '</div>';
        }

        detail.innerHTML = `
          <div id="medical-history-content">
            <h2>Medical history – Patient ${fid}</h2>
            <form id="medical-history-form" class="medical-history-form">
              <div class="form-group">
                <label>Current allergies</label>
                <textarea id="curr_allergies">${escapeHtml(h.current_allergies || "")}</textarea>
              </div>
              <div class="form-group">
                <label>Past allergies</label>
                <textarea id="past_allergies">${escapeHtml(h.past_allergies || "")}</textarea>
              </div>
              <div class="form-group">
                <label>Current medications</label>
                <textarea id="curr_medications">${escapeHtml(h.current_medications || "")}</textarea>
              </div>
              <div class="form-group">
                <label>Past medications</label>
                <textarea id="past_medications">${escapeHtml(h.past_medications || "")}</textarea>
              </div>
              <div id="history-msg" class="msg"></div>
              <button type="submit" class="btn btn-primary">Save medical history</button>
            </form>

            <div style="margin-top: 30px;">
              <h2>Vitals History</h2>
              ${vitalsHtml}
            </div>

            <div style="margin-top: 30px;">
              <h2>AI Triage History</h2>
              ${analysesHtml}
            </div>
          </div>
        `;

        const f = document.getElementById("medical-history-form");
        const m = document.getElementById("history-msg");
        if (f) {
          f.addEventListener("submit", async (ev) => {
            ev.preventDefault();
            m.textContent = "";
            m.className = "msg";
            try {
              await fetchJSON(`${API}/save_medical_history/${fid}`, {
                method: "POST",
                body: JSON.stringify({
                  current_allergies: document.getElementById("curr_allergies").value,
                  past_allergies: document.getElementById("past_allergies").value,
                  current_medications: document.getElementById("curr_medications").value,
                  past_medications: document.getElementById("past_medications").value,
                }),
              });
              m.textContent = "Saved.";
              m.className = "msg success";
            } catch (err) {
              m.textContent = err.message || "Save failed.";
              m.className = "msg error";
            }
          });
        }
      } catch (err) {
        detail.innerHTML = "<p>Failed to load history.</p>";
      }
    }

    loadPatients();
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Router: run init for current page
  // ---------------------------------------------------------------------------
  const path = window.location.pathname || "";
  if (path === "/" || path === "/index.html" || path.endsWith("/")) initRegister();
  else if (path.includes("dashboard.html") && !path.includes("doctor")) initDashboard();
  else if (path.includes("pain_map.html")) initPainMap();
  else if (path.includes("pain_questions.html")) initPainQuestions();
  else if (path.includes("analysis_result.html")) initAnalysisResultSync();
  else if (path.includes("doctor_login.html")) initDoctorLogin();
  else if (path.includes("doctor_dashboard.html")) initDoctorDashboard();
})();
