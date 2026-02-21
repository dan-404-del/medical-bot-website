# Arduino Integration - Quick Reference Card

## **5-Minute Quick Start**

### **1. Install Package**
```bash
pip install pyserial
```

### **2. Upload Arduino Code**
Copy code from `arduino_test_sketch.ino` into Arduino IDE → Upload

### **3. Find Serial Port**
```bash
ls /dev/ttyUSB* /dev/ttyACM*
```
Note the port (usually `/dev/ttyUSB0`)

### **4. Restart Backend**
```bash
python backend/app.py
```

### **5. Check Website**
Go to: `http://localhost:5000/dashboard.html`
- Login → Go to Dashboard
- Should see: **🟢 Arduino Connected**
- Fields auto-fill with data

---

## **Arduino Code Template**

This is the MINIMUM code your Arduino needs:

```cpp
void setup() {
  Serial.begin(9600);  // IMPORTANT: 9600 baud
}

void loop() {
  int hr = readHeartRate();
  int spo2 = readSpO2();
  float temp = readTemperature();
  float weight = readWeight();
  float height = readHeight();
  
  // MUST be this exact format:
  Serial.print("{\"hr\": ");
  Serial.print(hr);
  Serial.print(", \"spo2\": ");
  Serial.print(spo2);
  Serial.print(", \"temp\": ");
  Serial.print(temp, 1);
  Serial.print(", \"weight\": ");
  Serial.print(weight, 1);
  Serial.print(", \"height\": ");
  Serial.print(height, 1);
  Serial.println("}");
  
  delay(1000);  // Send every 1 second
}
```

---

## **Expected Output Format**

Arduino MUST send:
```json
{"hr": 72, "spo2": 98, "temp": 36.8, "weight": 70.5, "height": 170.0}
```

**Keys must be:** `hr`, `spo2`, `temp`, `weight`, `height`
**Values must be:** numbers (no quotes)

---

## **API Endpoints**

### Get Live Arduino Data
```
GET /api/get_arduino_vitals
```
Response:
```json
{
  "ok": true,
  "heart_rate": 75,
  "spo2": 98,
  "temperature": 36.8,
  "weight": 70.5,
  "height": 170.0,
  "status": "connected",
  "timestamp": "2026-02-21T10:30:45.123456"
}
```

### Save Vitals to Database
```
POST /api/save_vitals
```
Body:
```json
{
  "fingerprint_id": 123,
  "heart_rate": 75,
  "spo2": 98,
  "temperature": 36.8,
  "weight": 70.5,
  "height": 170.0,
  "blood_pressure": "120/80"
}
```

---

## **Debugging Commands**

### Test Arduino Serial Output
```bash
python3 -c "
import serial
import json
ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=2)
for i in range(5):
    if ser.in_waiting:
        line = ser.readline().decode('utf-8').strip()
        print(json.loads(line))
ser.close()
"
```

### Check Backend Logs
```bash
python backend/app.py 2>&1 | grep -i arduino
```

### Test API from Command Line
```bash
curl http://localhost:5000/api/get_arduino_vitals | python -m json.tool
```

---

## **Serial Port Issues?**

### Find Port
```bash
# Linux
ls /dev/ttyUSB* /dev/ttyACM*

# Raspberry Pi
ls /dev/ttyAMA*

# Windows
mode COM3
```

### Fix Permissions
```bash
sudo usermod -a -G dialout $USER
newgrp dialout
```

### Test Port
```bash
stty -F /dev/ttyUSB0 9600 raw
cat /dev/ttyUSB0
```

---

## **Website Status Indicators**

**Green (Connected):**
```
🟢 Arduino Connected - Live Feed Active
```
→ Arduino is sending data
→ Form fields auto-updating
→ Ready to save vitals

**Red (Disconnected):**
```
🔴 Arduino Disconnected - Manual Input
```
→ Arduino not connected or sending data
→ Manual entry required
→ Check USB cable and Arduino

---

## **Real Sensor Upgrade**

When adding real sensors, update these functions in Arduino:

```cpp
// Replace with your sensor code:

int readHeartRate() {
  // Your MAX30100 code
}

int readSpO2() {
  // Your MAX30100 code
}

float readTemperature() {
  // Your DHT22 code
}

float readWeight() {
  // Your HX711 code
}

float readHeight() {
  // Your HC-SR04 code
}
```

See `REAL_SENSORS_GUIDE.md` for complete examples.

---

## **Files to Know**

| File | Purpose |
|------|---------|
| `backend/app.py` | Python backend (reads Arduino) |
| `frontend/app.js` | JavaScript (displays data) |
| `frontend/dashboard.html` | Patient dashboard |
| `arduino_test_sketch.ino` | Test code (copy to Arduino IDE) |
| `ARDUINO_SETUP_GUIDE.md` | Detailed setup guide |
| `REAL_SENSORS_GUIDE.md` | Real sensor code |

---

## **Troubleshooting Flowchart**

```
Arduino connected?
  ├─ NO → Check USB cable, restart Arduino
  └─ YES ↓
  
Arduino sending data in Serial Monitor?
  ├─ NO → Check baud rate (9600), reload Arduino
  └─ YES ↓
  
Backend sees data?
  ├─ NO → Check port name, restart backend
  └─ YES ↓
  
Website shows green?
  ├─ NO → Reload page (F5)
  └─ YES ✅ Done!
```

---

## **Performance Tips**

- **Default:** Arduino sends every 1 second
- **Faster:** Change `SAMPLE_INTERVAL` in Arduino code
- **Slower:** Change `setInterval` value in JavaScript
- **More stable:** Increase delay in Arduino to 2000ms
- **Accurate:** Average multiple readings before sending

---

## **Safety Checklist**

- ✅ Use quality USB cable (good power)
- ✅ Check wiring before powering
- ✅ Don't mix 5V and 3.3V sensors
- ✅ Add decoupling capacitors to sensors
- ✅ Test with fake data first
- ✅ Validate sensor ranges before saving

---

**Need help?** Check the full guides:
- `ARDUINO_SETUP_GUIDE.md` - Hardware & setup
- `REAL_SENSORS_GUIDE.md` - Sensor code
- `SETUP_COMPLETE.md` - Overview

