# Arduino to Website Integration - Quick Start

## **System Architecture (How It All Works Together)**

```
┌─────────────┐
│   Arduino   │  Reads 5 sensors (HR, SpO2, Temp, Weight, Height)
│   (USB)     │  Sends JSON data: {"hr": 75, "spo2": 98, ...}
└──────┬──────┘
       │ USB Serial at 9600 baud
       │
┌──────▼────────────────────────┐
│   Raspberry Pi (Backend)       │  Python Flask Server
│   backend/app.py              │  - Reads serial data in thread
│                               │  - Stores in global dictionary
│ /api/get_arduino_vitals       │  - Serves JSON via API
└──────┬────────────────────────┘
       │ HTTP Request/Response
       │
┌──────▼────────────────────────┐
│   Website Dashboard           │  Browser (patient's screen)
│   frontend/dashboard.html     │  - Shows 🟢 or 🔴 status
│   frontend/app.js            │  - Auto-fills vital fields
│                               │  - Updates every 1 second
└────────────────────────────────┘
```

---

## **What Was Updated**

### **1. Backend (Python)**
- ✅ Added `import serial` for reading USB data
- ✅ Created `read_arduino_data()` background thread
- ✅ Added `/api/get_arduino_vitals` endpoint
- ✅ Data updates automatically every 1 second

### **2. Frontend (JavaScript)**
- ✅ Added `fetchArduinoVitals()` function
- ✅ Updates form fields with live data
- ✅ Shows connection status (🟢 Connected / 🔴 Disconnected)
- ✅ Refreshes every 1 second

### **3. HTML**
- ✅ Added Arduino status indicator
- ✅ Display shows connection status

### **4. Requirements**
- ✅ Added `pyserial>=3.5` for serial communication

---

## **Quick Test Steps**

### **1. Install Missing Package**
```bash
cd /home/raspberrypi/medical-bot-website
source venv/bin/activate
pip install pyserial
```

### **2. Upload Arduino Code**
Use the code from `ARDUINO_SETUP_GUIDE.md` or your existing sensor code.

### **3. Connect Arduino to Pi via USB**

### **4. Find Serial Port**
```bash
ls /dev/ttyUSB* /dev/ttyACM*
```
You should see `/dev/ttyUSB0` or `/dev/ttyACM0`

### **5. Test with Python**
```bash
python3 -c "
import serial
ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=2)
for i in range(5):
    if ser.in_waiting:
        print(ser.readline())
ser.close()
"
```

### **6. Restart Backend**
```bash
python backend/app.py
```

### **7. Check Website**
- Open: `http://localhost:5000/dashboard.html`
- Login with fingerprint ID
- Go to Vitals section
- Should show **🟢 Arduino Connected**
- Fields auto-populate with live data

---

## **Arduino Code Structure**

Your Arduino code needs to:

1. **Read all 5 sensors**
2. **Create JSON**: `{"hr": X, "spo2": Y, "temp": Z, "weight": W, "height": H}`
3. **Send via Serial**: `Serial.println(jsonData);`
4. **Send every 1 second** (or as needed)

**Example minimal code:**
```cpp
void loop() {
  int hr = readHeartRate();      // Your sensor function
  int spo2 = readSpO2();         // Your sensor function
  float temp = readTemp();       // Your sensor function
  float weight = readWeight();   // Your sensor function
  float height = readHeight();   // Your sensor function
  
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
  
  delay(1000);  // Wait 1 second
}
```

---

## **API Reference**

### **Get Latest Arduino Vitals**
```
GET /api/get_arduino_vitals
```

**Response:**
```json
{
  "ok": true,
  "heart_rate": 75,
  "spo2": 98,
  "temperature": 36.8,
  "weight": 70.5,
  "height": 170.0,
  "timestamp": "2026-02-21T10:30:45.123456",
  "status": "connected"
}
```

### **Save Vitals to Database**
```
POST /api/save_vitals
```

**Request Body:**
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

## **Troubleshooting**

| Issue | Check |
|-------|-------|
| Arduino not detected | USB cable connected? Port name correct? |
| Serial permission error | Run: `sudo usermod -a -G dialout $USER` |
| Python can't import serial | Run: `pip install pyserial` |
| Website shows "Disconnected" | Restart `python backend/app.py` |
| Data not auto-filling | Check Arduino serial output in IDE |
| Website returns `null` values | Arduino not sending data yet |

---

## **File Changes Summary**

```
backend/app.py
  ↓ Added serial reading thread
  ↓ Added /api/get_arduino_vitals endpoint
  
frontend/app.js
  ↓ Added fetchArduinoVitals() function
  ↓ Updated initDashboard()
  
frontend/dashboard.html
  ↓ Added Arduino status indicator
  
requirements.txt
  ↓ Added pyserial>=3.5
```

---

## **Next Features (Optional)**

- [ ] Add data logging to CSV
- [ ] Add real-time graphs
- [ ] Add alert thresholds (HR > 120, SpO2 < 95)
- [ ] Add wireless connection (WiFi/Bluetooth)
- [ ] Add multiple patient monitoring

---

**Your system is ready!** Just connect the Arduino and start testing. 🚀

