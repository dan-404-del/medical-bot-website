/**
 * Medical Triage App - Frontend Logic
 * Vanilla JS only. Uses sessionStorage for fingerprint_id and body_part.
 * API base: /api (Flask backend).
 */

(function () {
  "use strict";

  const API = "/api";

  // ---------------------------------------------------------------------------
  // GLOBAL STATE & HELPERS
  // ---------------------------------------------------------------------------

  // Language translations
  const translations = {
    en: {
      'app-title': 'Medical Robot Assistant',
      'patient-registration': 'Patient Registration',
      'full-name': 'Full Name',
      'age': 'Age',
      'sex': 'Sex',
      'fingerprint-id': 'Fingerprint ID',
      'register-patient': 'Register Patient',
      'already-registered': 'Already registered? Login with Fingerprint ID',
      'new-patient': 'New patient? Register',
      'doctor-login': 'Doctor login',
      'pain-selection': 'Pain Selection',
      'select-body-part': 'Select body part where you feel pain',
      'pain-questions': 'Pain Questions',
      'analyze-condition': 'Analyze Condition',
      'dashboard': 'Dashboard',
      'vitals': 'Vitals',
      'medical-history': 'Medical History'
    },
    ml: {
      'app-title': 'മെഡിക്കൽ റോബോട്ട് അസിസ്റ്റന്റ്',
      'patient-registration': 'രോഗികൾ രജിസ്ട്രേഷൻൻ',
      'full-name': 'പൂർത്തിയ പേര്',
      'age': 'പ്രായം',
      'sex': 'ലിംഗം',
      'fingerprint-id': 'ഫിംഗർപ്രിന്റ് ഐഡി',
      'register-patient': 'രോഗികൾ രജിസ്ട്രേഷ഻ൻ',
      'already-registered': 'ഇതിനക്ക് രജിസ്ട്രേഷപ്പെട്ടുണ്ടോ? ഫിംഗർപ്രിന്റ് ഐഡി ഉപയോഗിക്കുക',
      'new-patient': 'പുതിയ രോഗികൾ? രജിസ്ട്രേഷ഻ൻ',
      'doctor-login': 'ഡോക്ടർ ലോഗിൻ',
      'pain-selection': 'വേദന തിരഞ്ഞൽ',
      'select-body-part': 'നിങ്ങൾട്ട് വേദന അനുഭവിക്കുന്ന ശരീരഭാഗം തിരഞ്ഞൽ',
      'pain-questions': 'വേദന ചോദ്യങ്ങൾ',
      'analyze-condition': 'അവസ്ഥ വിശകലാം വിശകലാം',
      'dashboard': 'ഡാഷ്ബോർഡ്',
      'vitals': 'പ്രാണശക്ഷേത്രം',
      'medical-history': 'മെഡിക്കൽ ചരിത്ര'
    },
    hi: {
      'app-title': 'मेडिकल रोबोट सहायक',
      'patient-registration': 'मरीज रजिस्ट्रेशन',
      'full-name': 'पूरा नाम',
      'age': 'उम्र',
      'sex': 'लिंग',
      'fingerprint-id': 'फिंगरप्रिंट आईडी',
      'register-patient': 'मरीज रजिस्ट्र करें',
      'already-registered': 'पहले से रजिस्ट्र्ड? फिंगरप्रिंट आईडी से लॉगिन करें',
      'new-patient': 'नया मरीज? रजिस्ट्र करें',
      'doctor-login': 'डॉक्टर लॉगिन',
      'pain-selection': 'दर्द चयन',
      'select-body-part': 'उस शरीर भाग में दर्द महसूस हो रहा है',
      'pain-questions': 'दर्द प्रश्न',
      'analyze-condition': 'स्थिति का विश्लेषण करें',
      'dashboard': 'डैशबोर्ड',
      'vitals': 'जीवन संकेत',
      'medical-history': 'चिकित्स्य इतिहास'
    }
  };

  function getCurrentLanguage() {
    return localStorage.getItem('selectedLanguage') || 'en';
  }

  function applyTranslations() {
    const lang = getCurrentLanguage();
    const elements = document.querySelectorAll('[data-translate]');
  
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translations[lang] && translations[lang][key]) {
        element.textContent = translations[lang][key];
      }
    });
  }

  // Make applyTranslations globally accessible
  window.applyTranslations = applyTranslations;

  // Session helpers
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
    const arduinoStatus = document.getElementById("arduino-status");

    let arduinoInterval;

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

    // Fetch Arduino vitals and update form fields
    async function fetchArduinoVitals() {
      try {
        const r = await fetchJSON(`${API}/get_arduino_vitals`);
        
        if (r.ok) {
          // Update Arduino status indicator
          if (arduinoStatus) {
            if (r.status === "connected") {
              arduinoStatus.innerHTML = "🟢 Arduino Connected - Live Feed Active";
              arduinoStatus.style.background = "#f0fdf4";
              arduinoStatus.style.color = "#15803d";
            } else {
              arduinoStatus.innerHTML = "🔴 Arduino Disconnected - Manual Input";
              arduinoStatus.style.background = "#fff5f5";
              arduinoStatus.style.color = "#c53030";
            }
          }

          // Auto-populate form with Arduino data if available
          if (r.heart_rate !== null) {
            const hrInput = document.getElementById("heart_rate");
            if (hrInput && hrInput.value === "") {
              hrInput.value = r.heart_rate;
            }
          }
          if (r.spo2 !== null) {
            const spo2Input = document.getElementById("spo2");
            if (spo2Input && spo2Input.value === "") {
              spo2Input.value = r.spo2;
            }
          }
          if (r.temperature !== null) {
            const tempInput = document.getElementById("temperature");
            if (tempInput && tempInput.value === "") {
              tempInput.value = r.temperature;
            }
          }
          if (r.weight !== null) {
            const weightInput = document.getElementById("weight");
            if (weightInput && weightInput.value === "") {
              weightInput.value = r.weight;
            }
          }
          if (r.height !== null) {
            const heightInput = document.getElementById("height");
            if (heightInput && heightInput.value === "") {
              heightInput.value = r.height;
            }
          }

          // Show timestamp when data was received
          if (r.status === "connected" && r.timestamp) {
            const timeStr = new Date(r.timestamp).toLocaleTimeString();
            vitalsMsg.textContent = `✓ Live Arduino data (updated: ${timeStr})`;
            vitalsMsg.className = "msg success";
          }
        }
      } catch (err) {
        console.error("Failed to fetch Arduino vitals:", err);
      }
    }

    // Start fetching Arduino data on page load
    fetchArduinoVitals();
    
    // Refresh Arduino data every 1 second for live updates
    arduinoInterval = setInterval(fetchArduinoVitals, 1000);

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

      // Create area buttons with Method 3 (Image + Text Layout)
      if (areaButtons) {
        areaButtons.innerHTML = "";
        SPECIFIC_AREAS[bodyPart].forEach((area, index) => {
          // Convert area name to filename format
          const imageFileName = bodyPart.toLowerCase().replace(/\s+/g, '_') + '_' + area.toLowerCase().replace(/\s+/g, '_') + '.png';
          
          const boxDiv = document.createElement("div");
          boxDiv.className = "specific-area-box";
          boxDiv.style.cssText = `
            display: flex;
            gap: 15px;
            padding: 15px;
            border: 2px solid #cbd5e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            background: #fff;
            margin-bottom: 10px;
          `;
          
          boxDiv.onmouseover = function() {
            this.style.borderColor = '#805ad5';
            this.style.background = '#f7fafc';
            this.style.boxShadow = '0 2px 8px rgba(128,90,213,0.2)';
          };
          
          boxDiv.onmouseout = function() {
            this.style.borderColor = '#cbd5e0';
            this.style.background = '#fff';
            this.style.boxShadow = 'none';
          };
          
          boxDiv.innerHTML = `
            <!-- IMAGE SECTION (LEFT) -->
            <div style="flex-shrink: 0; position: relative;">
              <img 
                src="/images/${imageFileName}" 
                alt="${area}" 
                style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #e2e8f0; background: #f7fafc;"
                onerror="this.style.background='#fed7d7'; this.style.borderColor='#fc8181'; this.innerHTML='📷';"
              >
            </div>

            <!-- TEXT SECTION (RIGHT) -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <input 
                  type="radio" 
                  name="specific_area_radio" 
                  value="${area}" 
                  id="area_${index}"
                  style="width: 18px; height: 18px; cursor: pointer;">
                <label 
                  for="area_${index}" 
                  style="cursor: pointer; font-size: 16px; font-weight: bold; margin: 0; color: #2d3748;">
                  ${area}
                </label>
              </div>
              <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.4;">
                📍 Specific area of ${bodyPart.toLowerCase()}
              </p>
            </div>
          `;
          
          boxDiv.addEventListener("click", () => {
            selectSpecificArea(area);
            document.getElementById(`area_${index}`).checked = true;
          });
          
          areaButtons.appendChild(boxDiv);
        });
      }

      // Show the section
      specificSection.classList.remove("hidden");
    }

    function selectSpecificArea(area) {
      selectedArea = area;
      setSpecificArea(area);
      
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
          sessionStorage.setItem("doctor_id", doctorId);
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
    let currentPatient = null;

    // Chart instances storage
    let charts = {};

    const deleteBtn = document.getElementById("delete-patient-btn");
    const exportBtn = document.getElementById("export-report-btn");
    const printBtn = document.getElementById("print-prescription-btn");
    const timelineBtn = document.getElementById("view-timeline-btn");
    const compareBtn = document.getElementById("compare-analyses-btn");
    const uploadForm = document.getElementById("upload-document-form");

    // View Vitals Timeline
    if (timelineBtn) {
      timelineBtn.onclick = () => {
        const chartsContainer = document.getElementById("vitals-charts-container");
        if (chartsContainer) {
          chartsContainer.scrollIntoView({ behavior: "smooth" });
        }
      };
    }

    // Compare Pain Analyses
    if (compareBtn) {
      compareBtn.onclick = () => {
        const painContainer = document.getElementById("pain-comparison-container");
        if (painContainer) {
          painContainer.scrollIntoView({ behavior: "smooth" });
        }
      };
    }

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
          currentPatient = null;
          loadPatients();
        } catch (err) {
          alert(err.message || "Failed to delete patient.");
        }
      };
    }

    // Export PDF Report
    if (exportBtn) {
      exportBtn.onclick = () => {
        if (!selectedFid) return alert("Please select a patient first");
        window.open(`${API}/export_patient_report/${selectedFid}`, '_blank');
      };
    }

    // Print Prescription
    if (printBtn) {
      printBtn.onclick = () => {
        if (!selectedFid || !currentPatient) return alert("Please select a patient first");
        const doctorId = sessionStorage.getItem("doctor_id") || "Dr. [Your Name]";
        const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const prescriptionKey = `prescription_${selectedFid}`;
        const savedPrescription = localStorage.getItem(prescriptionKey) || '{}';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
          <head><title>Prescription - ${currentPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #3182ce; font-size: 28px; }
            .header h2 { margin: 5px 0 0 0; color: #718096; font-size: 18px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3182ce; }
            .info-box h4 { margin: 0 0 10px 0; color: #2d3748; font-size: 13px; font-weight: bold; }
            .info-box p { margin: 5px 0; font-size: 13px; }
            .prescription-box { border: 2px solid #cbd5e0; padding: 30px; min-height: 450px; margin-bottom: 30px; background: #fafbfc; page-break-inside: avoid; }
            .prescription-box h3 { margin: 0 0 20px 0; font-size: 20px; font-weight: bold; }
            textarea { width: 100%; border: 1px solid #cbd5e0; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; resize: vertical; background: white; }
            .form-row { margin-bottom: 20px; }
            .form-row label { display: block; font-weight: bold; font-size: 11px; color: #4a5568; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
            .signature { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 30px; }
            .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 2px solid #000; height: 50px; margin-bottom: 8px; }
            .sig-label { font-size: 11px; color: #4a5568; font-weight: bold; }
            .metadata { font-size: 10px; color: #a0aec0; margin-top: 15px; text-align: center; }
            @media print { 
              .no-print { display: none !important; }
              body { padding: 10px; }
              textarea { border: 1px solid #cbd5e0 !important; background: white !important; }
              .prescription-box { page-break-inside: avoid; }
            }
          </style>
          </head>
          <body>
            <div class="header">
              <h1>🏥 Medical Robot Assistant</h1>
              <h2>Medical Prescription Form</h2>
            </div>
            
            <div class="info-grid">
              <div class="info-box">
                <h4>👤 Patient Information</h4>
                <p><strong>${currentPatient.name}</strong></p>
                <p>Age: ${currentPatient.age} years</p>
                <p>Sex: ${currentPatient.sex}</p>
                <p>ID: ${currentPatient.fingerprint_id}</p>
              </div>
              <div class="info-box">
                <h4>👨‍⚕️ Doctor & Date</h4>
                <p><strong>Doctor:</strong> ${doctorId}</p>
                <p><strong>Date:</strong> ${todayDate}</p>
                <p><strong>Clinic:</strong> Medical Triage</p>
              </div>
            </div>
            
            <div class="prescription-box">
              <h3>Rx - Medical Prescription</h3>
              
              <div class="form-row">
                <label>📋 Diagnosis</label>
                <textarea id="diagnosis" rows="3" placeholder="Enter patient diagnosis and clinical findings..."></textarea>
              </div>
              
              <div class="form-row">
                <label>💊 Medications & Dosage</label>
                <textarea id="medications" rows="5" placeholder="Example Format:\\n1. Paracetamol 500mg - 1 tablet twice daily after meals for 5 days\\n2. Amoxicillin 250mg - 1 tablet three times daily for 7 days\\n3. Vitamin C 1000mg - 1 tablet daily\\n\\nFrequency and duration required."></textarea>
              </div>
              
              <div class="form-row">
                <label>📝 Patient Instructions & Precautions</label>
                <textarea id="instructions" rows="3" placeholder="e.g., Avoid dairy with antibiotics, drink plenty of water, rest for 2 days, avoid strenuous activity..."></textarea>
              </div>
              
              <div class="form-row">
                <label>📌 Additional Notes</label>
                <textarea id="notes" rows="2" placeholder="Follow-up, lab tests required, allergies noted, etc..."></textarea>
              </div>
            </div>
            
            <div class="signature">
              <div class="sig-grid">
                <div class="sig-box">
                  <div class="sig-line\"></div>
                  <div class="sig-label\">Doctor's Signature & Stamp</div>
                </div>
                <div class="sig-box\">
                  <div class="sig-label\"><strong>Date:</strong> ${todayDate}</div>
                </div>
              </div>
            </div>
            
            <div class="metadata">
              Prescription Generated: ${new Date().toLocaleString()} | Hospital: Medical Triage Clinic | Valid with Doctor's Signature
            </div>
            
            <button class="no-print" onclick="savePrescription(); window.print();" style="position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);\">💾 Save & Print</button>
            
            <script>
              function savePrescription() {
                const data = {
                  diagnosis: document.getElementById('diagnosis').value,
                  medications: document.getElementById('medications').value,
                  instructions: document.getElementById('instructions').value,
                  notes: document.getElementById('notes').value,
                  date: '${todayDate}',
                  doctor: '${doctorId}'
                };
                localStorage.setItem('prescription_${selectedFid}', JSON.stringify(data));
              }
              
              // Load saved prescription if exists
              try {
                const saved = JSON.parse(\`${savedPrescription}\`);
                if (saved && saved.diagnosis) {
                  if (document.getElementById('diagnosis')) document.getElementById('diagnosis').value = saved.diagnosis;
                  if (document.getElementById('medications')) document.getElementById('medications').value = saved.medications;
                  if (document.getElementById('instructions')) document.getElementById('instructions').value = saved.instructions;
                  if (document.getElementById('notes')) document.getElementById('notes').value = saved.notes;
                }
              } catch (e) {}
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      };
    }

    // Document Upload
    if (uploadForm) {
      uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!selectedFid) return alert("Please select a patient first");
        
        const fileInput = document.getElementById("document-file");
        const msgDiv = document.getElementById("upload-msg");
        
        if (!fileInput.files || !fileInput.files[0]) {
          msgDiv.textContent = "Please select a PDF file";
          msgDiv.className = "msg error";
          return;
        }

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
          const response = await fetch(`${API}/upload_doctor_document/${selectedFid}`, {
            method: "POST",
            body: formData
          });
          const result = await response.json();
          
          if (result.ok) {
            msgDiv.textContent = "Document uploaded successfully!";
            msgDiv.className = "msg success";
            fileInput.value = "";
            loadDocuments(selectedFid);
          } else {
            msgDiv.textContent = result.error || "Upload failed";
            msgDiv.className = "msg error";
          }
        } catch (err) {
          msgDiv.textContent = "Upload failed: " + err.message;
          msgDiv.className = "msg error";
        }
      };
    }

    // Load documents for patient
    async function loadDocuments(fid) {
      const docsList = document.getElementById("documents-list");
      if (!docsList) return;
      
      try {
        const r = await fetchJSON(`${API}/get_doctor_documents/${fid}`);
        const docs = r.documents || [];
        
        if (docs.length === 0) {
          docsList.innerHTML = "<li style='color: #666;'>No documents uploaded yet</li>";
        } else {
          docsList.innerHTML = docs.map(d => `
            <li style="padding: 10px; background: #f7fafc; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>📄 ${escapeHtml(d.filename)}<br><small style="color: #666;">${d.uploaded_at}</small></span>
              <a href="${API}/download_document/${d.id}" class="btn btn-secondary" style="padding: 8px 16px; font-size: 14px;">Download</a>
            </li>
          `).join("");
        }
      } catch (err) {
        docsList.innerHTML = "<li style='color: red;'>Failed to load documents</li>";
      }
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

    // Load and display charts
    async function loadVitalsCharts(fid) {
      try {
        const r = await fetchJSON(`${API}/get_patient_timeline/${fid}`);
        if (!r.ok || !r.timeline) {
          console.error("Invalid response:", r);
          return;
        }
        const vitals = r.timeline.vitals || [];
        
        if (vitals.length === 0) {
          const container = document.getElementById('vitals-charts-container');
          if (container) {
            const msg = container.querySelector('div') || document.createElement('div');
            msg.innerHTML = '<p style="color: #666; padding: 20px;">No vitals data recorded yet. Please add vitals data first.</p>';
            if (!container.querySelector('div')) container.appendChild(msg);
          }
          return;
        }

        const dates = vitals.map(v => v.timestamp ? v.timestamp.substring(0, 10) : '');
        if (dates.length === 0) return;
        
        // Destroy existing charts
        Object.values(charts).forEach(chart => { if (chart) chart.destroy(); });
        charts = {};

        // Weight Chart
        const weightCtx = document.getElementById('weight-chart');
        if (weightCtx) {
          const weightData = vitals.map(v => v.weight || null).filter((v, i) => i < dates.length);
          if (weightData.some(v => v !== null)) {
            charts.weight = new Chart(weightCtx, {
              type: 'line',
              data: {
                labels: dates,
                datasets: [{
                  label: 'Weight (kg)',
                  data: weightData,
                  borderColor: '#3182ce',
                  backgroundColor: 'rgba(49, 130, 206, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              },
              options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true } } }
            });
          }
        }

        // Blood Pressure Chart
        const bpCtx = document.getElementById('bp-chart');
        if (bpCtx) {
          const bpData = vitals.map(v => {
            if (!v.blood_pressure) return null;
            const parts = v.blood_pressure.split('/');
            return parts[0] ? parseInt(parts[0]) : null;
          }).filter(v => v !== null);
          
          if (bpData.length > 0) {
            charts.bp = new Chart(bpCtx, {
              type: 'line',
              data: {
                labels: dates.slice(0, bpData.length),
                datasets: [{
                  label: 'Systolic BP',
                  data: bpData,
                  borderColor: '#e53e3e',
                  backgroundColor: 'rgba(229, 62, 62, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              },
              options: { responsive: true, maintainAspectRatio: true }
            });
          }
        }

        // Heart Rate & SpO2 Chart
        const heartCtx = document.getElementById('heart-chart');
        if (heartCtx) {
          const datasets = [];
          if (vitals.some(v => v.heart_rate)) {
            datasets.push({
              label: 'Heart Rate (bpm)',
              data: vitals.map(v => v.heart_rate),
              borderColor: '#38a169',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
              fill: true,
              tension: 0.4
            });
          }
          if (vitals.some(v => v.spo2)) {
            datasets.push({
              label: 'SpO2 (%)',
              data: vitals.map(v => v.spo2),
              borderColor: '#3182ce',
              backgroundColor: 'rgba(49, 130, 206, 0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y1'
            });
          }
          
          if (datasets.length > 0) {
            charts.heart = new Chart(heartCtx, {
              type: 'line',
              data: { labels: dates, datasets },
              options: { 
                responsive: true, 
                maintainAspectRatio: true,
                scales: {
                  y1: { position: 'right', min: 90, max: 100 }
                }
              }
            });
          }
        }

        // Temperature Chart
        const tempCtx = document.getElementById('temp-chart');
        if (tempCtx && vitals.some(v => v.temperature)) {
          charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
              labels: dates,
              datasets: [{
                label: 'Temperature (°C)',
                data: vitals.map(v => v.temperature),
                borderColor: '#d69e2e',
                backgroundColor: 'rgba(214, 158, 46, 0.1)',
                fill: true,
                tension: 0.4
              }]
            },
            options: { 
              responsive: true, 
              maintainAspectRatio: true,
              scales: {
                y: { min: 35, max: 42 }
              }
            }
          });
        }
      } catch (err) {
        console.error("Failed to load charts:", err);
        const container = document.getElementById('vitals-charts-container');
        if (container) {
          const msg = document.createElement('div');
          msg.innerHTML = `<p style="color: #e53e3e; padding: 20px;">Error loading charts: ${err.message || 'Unknown error'}</p>`;
          const existing = container.querySelector('div:not([style*="grid"])');
          if (existing) existing.remove();
          container.insertBefore(msg, container.firstChild);
        }
      }
    }

    // Load pain comparison
    async function loadPainComparison(fid) {
      const container = document.getElementById('pain-comparison-content');
      if (!container) return;
      
      try {
        const r = await fetchJSON(`${API}/compare_analyses/${fid}`);
        const analyses = r.analyses || [];
        const byBodyPart = r.by_body_part || {};
        
        if (analyses.length === 0) {
          container.innerHTML = "<p style='color: #666;'>No pain analyses recorded yet</p>";
          return;
        }

        let html = `<p><strong>Total Analyses:</strong> ${r.total_count}</p>`;
        
        // Group by body part
        Object.keys(byBodyPart).forEach(part => {
          const partAnalyses = byBodyPart[part];
          html += `
            <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #3182ce;">
              <h4>${escapeHtml(part)} (${partAnalyses.length} analyses)</h4>
          `;
          
          partAnalyses.forEach((a, idx) => {
            const severityColor = a.severity === 'HIGH' || a.severity === 'EMERGENCY' ? '#e53e3e' : 
                                  a.severity === 'MEDIUM' ? '#d69e2e' : '#38a169';
            html += `
              <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 6px;">
                <p style="margin: 0;"><strong>Analysis #${idx + 1}</strong> - ${a.timestamp}</p>
                <p style="margin: 5px 0;">Severity: <span style="color: ${severityColor}; font-weight: bold;">${a.severity}</span></p>
                ${a.specific_area ? `<p style="margin: 5px 0;">Specific Area: ${escapeHtml(a.specific_area)}</p>` : ''}
                <p style="margin: 5px 0; font-size: 14px; color: #666;">${escapeHtml(a.ai_summary || 'No summary')}</p>
              </div>
            `;
          });
          
          html += `</div>`;
        });
        
        container.innerHTML = html;
      } catch (err) {
        container.innerHTML = "<p style='color: red;'>Failed to load pain comparison</p>";
      }
    }

    // Load body part images upload UI
    async function loadBodyPartImages(fid) {
      const container = document.getElementById('body-part-images-list');
      if (!container) return;
      
      try {
        const r = await fetchJSON(`${API}/get_patient_analyses/${fid}`);
        const analyses = r.analyses || [];
        
        if (analyses.length === 0) {
          container.innerHTML = "<p style='color: #666;'>No pain analyses to attach images to</p>";
          return;
        }

        let html = '';
        analyses.forEach((a, idx) => {
          html += `
            <div style="margin-top: 15px; padding: 15px; background: #f9f5f0; border-radius: 8px; border-left: 4px solid #d69e2e;">
              <p style="margin: 0 0 10px 0;"><strong>📍 ${escapeHtml(a.body_part)}</strong> ${a.specific_area ? `(${escapeHtml(a.specific_area)})` : ''} - ${a.timestamp}</p>
              <div style="background: white; padding: 12px; border-radius: 6px; display: flex; gap: 10px; align-items: flex-end;">
                <div style="flex: 1;">
                  <label for="image_${a.id}" style="display: block; font-size: 12px; color: #4a5568; margin-bottom: 5px; font-weight: bold;">Upload Image (PNG/JPG):</label>
                  <input type="file" id="image_${a.id}" class="body-part-image-input" data-analysis-id="${a.id}" accept="image/png,image/jpeg,.jpg,.png" style="flex: 1; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px;">
                </div>
                <button class="btn btn-primary upload-body-image-btn" data-analysis-id="${a.id}" style="padding: 8px 16px; font-size: 14px;">📤 Upload</button>
              </div>
              ${a.image_path ? `<p style="margin-top: 8px; font-size: 12px; color: #38a169;">✅ Image attached: ${a.image_path.split('/').pop()}</p>` : ''}
            </div>
          `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners to upload buttons
        document.querySelectorAll('.upload-body-image-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const analysisId = e.target.getAttribute('data-analysis-id');
            const fileInput = document.getElementById(`image_${analysisId}`);
            await uploadBodyPartImage(fid, analysisId, fileInput);
          });
        });
      } catch (err) {
        container.innerHTML = "<p style='color: red;'>Failed to load pain analyses</p>";
      }
    }

    // Upload body part image
    async function uploadBodyPartImage(fid, analysisId, fileInput) {
      if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select an image file');
        return;
      }

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('pain_id', analysisId);

      try {
        const response = await fetch(`${API}/upload_body_part_image/${fid}`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.ok) {
          alert('Image uploaded successfully!');
          fileInput.value = '';
          loadBodyPartImages(fid); // Reload the list
        } else {
          alert('Upload failed: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Upload error: ' + err.message);
      }
    }

    async function selectPatient(fid) {
      selectedFid = fid;
      currentPatient = allPatients.find(p => p.fingerprint_id === fid);
      
      list.querySelectorAll("li").forEach((el) => el.classList.toggle("selected", parseInt(el.dataset.fid, 10) === fid));
      detail.classList.remove("hidden");

      // Load documents
      loadDocuments(fid);
      
      // Load charts
      loadVitalsCharts(fid);
      
      // Load pain comparison
      loadPainComparison(fid);
      
      // Load body part images UI
      loadBodyPartImages(fid);

      // Keep the rest of the existing functionality
      try {
        const r = await fetchJSON(`${API}/get_medical_history/${fid}`);
        const h = r.history || {};

        const vitalsR = await fetchJSON(`${API}/get_patient_vitals/${fid}`);
        const vitals = vitalsR.vitals || [];

        const analysesR = await fetchJSON(`${API}/get_patient_analyses/${fid}`);
        const analyses = analysesR.analyses || [];

        const historyContent = document.getElementById("medical-history-content");
        const vitalsContainer = document.getElementById("vitals-history-content");
        const analysesContainer = document.getElementById("patient-analyses-list");

        if (historyContent) {
          historyContent.innerHTML = `
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
        }

        if (vitalsContainer) {
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
          vitalsContainer.innerHTML = vitalsHtml;
        }

        if (analysesContainer) {
          let analysesHtml = '<h3>No AI analyses recorded.</h3>';
          if (analyses.length > 0) {
            analysesHtml = '<div class="analyses-list">';
            analyses.forEach(a => {
              const severityClass = `severity-${(a.severity || 'MEDIUM').toUpperCase()}`;
              analysesHtml += `
                <div class="analyses-item ${severityClass}" style="padding: 12px; border-radius: 6px; margin-bottom: 8px; border: 1px solid;">
                  <p><strong>Timestamp:</strong> ${a.timestamp}</p>
                  <p><strong>Body Part:</strong> ${escapeHtml(a.body_part)}</p>
                  ${a.specific_area ? `<p><strong>Specific Area:</strong> ${escapeHtml(a.specific_area)}</p>` : ''}
                  <p><strong>Severity:</strong> <span class="${severityClass}">${a.severity}</span></p>
                  <p><strong>Summary:</strong> ${escapeHtml(a.ai_summary || 'N/A')}</p>
                  <p><strong>Recommendation:</strong> ${escapeHtml(a.recommendation || 'N/A')}</p>
                </div>
              `;
            });
            analysesHtml += '</div>';
          }
          analysesContainer.innerHTML = analysesHtml;
        }

      } catch (err) {
        console.error("Failed to load patient data:", err);
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
