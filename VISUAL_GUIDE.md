# Arduino Setup - Visual Guide for Beginners

## **Part 1: Understanding the System**

### **What is Arduino?**
Arduino is a small computer that can:
- Read sensors (temperature, heart rate, weight, height)
- Send data to your Raspberry Pi
- Run code you write

### **How Does It Connect?**

```
┌──────────────────────────┐
│      Your Arduino        │
│     (with sensors)       │
└─────────┬────────────────┘
          │
          │ USB Cable
          │ (data + power)
          │
┌─────────▼────────────────┐
│  Raspberry Pi            │
│  (medical-bot-website)   │
└─────────┬────────────────┘
          │
          │ Browser (WiFi)
          │
┌─────────▼────────────────┐
│  Patient's Phone/Tablet  │
│  (sees vitals on screen) │
└──────────────────────────┘
```

---

## **Part 2: Shopping List**

### **Essential (Minimum)**
```
□ 1x Arduino Uno or Arduino Nano        ~$25
□ 1x USB Cable (matches your Arduino)   ~$5
```

### **For Real Sensors (Add Later)**
```
□ 1x MAX30100 (heart rate + SpO2)       ~$20
□ 1x DHT22 (temperature)                ~$4
□ 1x HX711 + Load Cell (weight)         ~$15
□ 1x HC-SR04 (distance for height)      ~$3
□ Jumper wires (pack of 40)             ~$3
□ Breadboard                            ~$3
```

**Total for testing: ~$30**
**Total for real sensors: ~$75**

---

## **Part 3: Arduino Board Anatomy**

```
                    ARDUINO UNO
    ┌───────────────────────────────────┐
    │                                   │
    │  USB ────────┐                    │
    │  (connects   │                    │
    │   to Pi)     │                    │
    │              │                    │
    │  ┌─────────────────────────────┐ │
    │  │      Microcontroller       │ │
    │  │    (the "brain")           │ │
    │  └─────────────────────────────┘ │
    │                                   │
    │  ┌──────┐         ┌──────┐       │
    │  │ GND  │ ······· │ 5V   │       │
    │  ├──────┼────────┤──────┤       │
    │  │ D0-13│ Digital │ A0-A5│       │
    │  │      │ Pins    │ Analog│      │
    │  │      │ (GPIO)  │Inputs│       │
    │  │      │         │      │       │
    │  └──────┘         └──────┘       │
    │                                   │
    └───────────────────────────────────┘
```

### **Important Pins**

| Pin | Name | Use |
|-----|------|-----|
| 5V | Power | Powers sensors |
| GND | Ground | Completes circuit |
| D2 | Digital | Temperature sensor |
| A0-A5 | Analog | Sensor readings |

---

## **Part 4: Connecting Your First Sensor**

### **Example: DHT22 (Temperature)**

```
DHT22 Sensor             Arduino Board
┌─────────┐             ┌─────────────┐
│  VCC ───┼──────────┬──→ 5V          │
│  GND ───┼──────────┼──→ GND         │
│  DATA ──┼──────────┼──→ Pin 2       │
└─────────┘             │             │
             (Jumper    │             │
              Wires)   └─────────────┘
```

**What each wire does:**
- **VCC (Red)** → Power (+5V)
- **GND (Black)** → Ground (0V)
- **DATA (Green)** → Signal (digital pin)

---

## **Part 5: Arduino Code Basics**

### **Structure**

```cpp
void setup() {
    // Runs ONCE at startup
    Serial.begin(9600);  // Start communication
}

void loop() {
    // Runs repeatedly
    
    // Read sensors
    int temperature = readSensor();
    
    // Send data
    Serial.println(temperature);
    
    // Wait 1 second
    delay(1000);
}
```

### **Reading Data Flow**

```
Sensor
  ↓
Analog Pin (reads 0-1023)
  ↓
Convert to Real Units
  ↓
Create JSON
  ↓
Serial.println()
  ↓
USB → Raspberry Pi
  ↓
Website Dashboard
  ↓
Patient sees data on screen! ✅
```

---

## **Part 6: Installation Steps (Visual)**

### **Step 1: Install Arduino IDE**

```
[Computer] 
   ↓
[Download from arduino.cc]
   ↓
[Install like normal software]
   ↓
[Open → See IDE]
   ↓
[You're ready! ✅]
```

### **Step 2: Connect Arduino**

```
[Arduino Board]
     ↓ USB Cable
[Computer / Raspberry Pi]
     ↓
[USB Port lights up]
     ↓
[Device detected! ✅]
```

### **Step 3: Upload Code**

```
[Copy code from file]
   ↓
[Arduino IDE → New Sketch]
   ↓
[Paste code]
   ↓
[Click Upload]
   ↓
[Wait for "Done uploading"]
   ↓
[Success! ✅]
```

---

## **Part 7: Testing Checklist**

```
┌─────────────────────────────────┐
│ TESTING YOUR ARDUINO SETUP      │
├─────────────────────────────────┤
│ □ Arduino connected via USB     │
│ □ Arduino IDE shows port        │
│ □ Code uploaded successfully    │
│ □ Serial Monitor shows data     │
│ │                               │
│ │ Expected to see:              │
│ │ {"hr": 72, "spo2": 98, ...}   │
│ │                               │
│ □ Arduino connected to Pi       │
│ □ Python can read serial        │
│ □ Website shows 🟢 Connected    │
│ □ Dashboard fields auto-fill    │
│ □ Data saves to database        │
│                                 │
│ ✅ ALL DONE!                    │
└─────────────────────────────────┘
```

---

## **Part 8: Common Mistakes**

### **Mistake 1: Wrong Baud Rate**
```
❌ WRONG: Serial.begin(115200);
✅ CORRECT: Serial.begin(9600);
```
**Why:** Your website expects 9600!

### **Mistake 2: Wrong JSON Format**
```
❌ WRONG: {"HR": 72}          // Wrong key name
❌ WRONG: {"hr": "72"}        // Quoted number
✅ CORRECT: {"hr": 72}        // Exact format!
```

### **Mistake 3: Forgot Commas**
```
❌ WRONG: {"hr": 72 "spo2": 98}
✅ CORRECT: {"hr": 72, "spo2": 98}
```

### **Mistake 4: Wrong Pin Assignment**
```
❌ WRONG: Wire to pin A7 (doesn't exist)
✅ CORRECT: Wire to pins A0-A5 or D0-D13
```

---

## **Part 9: Real Sensor Examples**

### **Example 1: Simple Analog Sensor**

```cpp
void loop() {
    // Read from pin A0 (gets value 0-1023)
    int rawValue = analogRead(A0);
    
    // Convert to heart rate (60-120 bpm)
    int heartRate = map(rawValue, 0, 1023, 60, 120);
    
    // Send
    Serial.println(heartRate);
    delay(1000);
}
```

### **Example 2: Digital Temperature Sensor**

```cpp
#include <DHT.h>
DHT dht(2, DHT22);

void setup() {
    dht.begin();
}

void loop() {
    float temp = dht.readTemperature();
    Serial.println(temp);
    delay(2000);  // DHT22 needs 2 seconds
}
```

---

## **Part 10: Troubleshooting Flowchart**

```
Start
  │
  ├─→ Arduino shows up in Device Manager?
  │   ├─ NO  → Check USB cable, restart
  │   └─ YES ↓
  │
  ├─→ Code uploaded successfully?
  │   ├─ NO  → Check board type, try again
  │   └─ YES ↓
  │
  ├─→ Serial Monitor shows data?
  │   ├─ NO  → Check baud rate (9600)
  │   └─ YES ↓
  │
  ├─→ Is JSON format correct?
  │   ├─ NO  → Match format exactly
  │   └─ YES ↓
  │
  ├─→ Website backend running?
  │   ├─ NO  → Start: python backend/app.py
  │   └─ YES ↓
  │
  ├─→ Website shows 🟢 Connected?
  │   ├─ NO  → Reload page, restart backend
  │   └─ YES ✅ SUCCESS!
```

---

## **Part 11: Quick Reference**

### **File Locations**
```
Your Computer / Raspberry Pi
  └─ medical-bot-website/
      ├─ arduino_test_sketch.ino       ← Copy this to Arduino IDE
      ├─ ARDUINO_SETUP_GUIDE.md        ← Read this for details
      ├─ REAL_SENSORS_GUIDE.md         ← Real sensor code
      ├─ backend/app.py                ← Python (auto-reads Arduino)
      └─ frontend/dashboard.html       ← Website (shows data)
```

### **Key Commands**
```bash
# Install Python library
pip install pyserial

# Test Arduino connection
python test_arduino.py

# Start website
python backend/app.py

# Check serial port
ls /dev/ttyUSB*
```

### **Arduino Pins to Remember**
```
5V   → Power (use for sensors)
GND  → Ground (return path)
D2   → Digital pin (sensors like DHT)
A0   → Analog pin (sensors like photocells)
```

---

## **Part 12: What Happens Next**

### **Week 1:**
- [ ] Get Arduino + USB cable
- [ ] Install Arduino IDE
- [ ] Upload test code
- [ ] See data in Serial Monitor

### **Week 2:**
- [ ] Connect to Raspberry Pi
- [ ] Install pyserial
- [ ] Test website integration
- [ ] See dashboard work

### **Week 3+:**
- [ ] Add real sensors
- [ ] Follow REAL_SENSORS_GUIDE.md
- [ ] Integrate each sensor one at a time
- [ ] Test and verify

---

## **Part 13: Getting Help**

### **If Something Doesn't Work:**

1. **Check the guides:**
   - ARDUINO_SETUP_GUIDE.md
   - REAL_SENSORS_GUIDE.md
   - QUICK_REFERENCE.md

2. **Check Serial Monitor:**
   - Tools → Serial Monitor
   - Look for error messages
   - Check baud rate is 9600

3. **Check Python:**
   - Run `python backend/app.py`
   - Look for "Arduino connected"
   - Check for error messages

4. **Check Website:**
   - Open browser console (F12)
   - Look for JavaScript errors
   - Check Network tab for API calls

---

## **You're Ready!** 🚀

Everything is set up. Just follow the guides and you'll have live Arduino vitals on your medical website!

**Start with:** `ARDUINO_SETUP_GUIDE.md` → `arduino_test_sketch.ino` → Website Dashboard ✅

