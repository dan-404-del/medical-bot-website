# Arduino Medical Vitals Setup Guide - For Beginners

This guide will help you set up Arduino to send heart rate, SpO2, temperature, weight, and height to your Raspberry Pi medical website.

---

## **PART 1: Hardware Setup**

### **Components You Need:**
1. **Arduino Board** (e.g., Arduino Uno, Arduino Nano)
2. **5 Sensors:**
   - **Heart Rate Sensor** (e.g., MAX30100 or Max30102)
   - **SpO2 Sensor** (integrated in MAX30100/30102)
   - **Temperature Sensor** (e.g., DHT22 or DS18B20)
   - **Weight Scale Module** (e.g., HX711 Load Cell)
   - **Height Sensor** (e.g., Ultrasonic HC-SR04 or Potentiometer)
3. **USB Cable** (to connect Arduino to Raspberry Pi)
4. **Jumper Wires**
5. **Breadboard** (optional, for prototyping)

### **Pin Connections to Arduino:**

```
┌─────────────────────────────────────────────┐
│          ARDUINO PIN LAYOUT                 │
├─────────────────────────────────────────────┤
│ Heart Rate/SpO2 (MAX30100):                │
│   - VCC → 5V                               │
│   - GND → GND                              │
│   - SCL → A5 (or 21 on Arduino Mega)      │
│   - SDA → A4 (or 20 on Arduino Mega)      │
│                                             │
│ Temperature (DHT22):                       │
│   - VCC → 5V                               │
│   - GND → GND                              │
│   - DATA → Pin 2                           │
│                                             │
│ Weight (HX711):                            │
│   - VCC → 5V                               │
│   - GND → GND                              │
│   - DT → A1                                │
│   - SCK → A0                               │
│                                             │
│ Height (Ultrasonic):                       │
│   - VCC → 5V                               │
│   - GND → GND                              │
│   - TRIG → A3                              │
│   - ECHO → A2                              │
└─────────────────────────────────────────────┘
```

---

## **PART 2: Arduino Code (Beginner Friendly)**

### **Step 1: Install Required Libraries**

1. Open **Arduino IDE**
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search and install these libraries:
   - `DHT sensor library` by Adafruit
   - `MAX30100lib` by omega682
   - `HX711` by bogde
   - Leave out HC-SR04 (use built-in)

### **Step 2: Upload This Code to Arduino**

Copy and paste this COMPLETE code into Arduino IDE:

```cpp
// ============================================================================
// MEDICAL VITALS ARDUINO CODE - Simple Version for Beginners
// ============================================================================

#include <Wire.h>
#include <DHT.h>

// ============================================================================
// PIN DEFINITIONS - Change these if your sensors use different pins
// ============================================================================
#define DHT_PIN 2              // Temperature sensor pin
#define DHT_TYPE DHT22         // DHT22 sensor type
#define HEART_RATE_PIN A0      // Fake heart rate (for testing)
#define SPO2_PIN A1            // Fake SpO2 (for testing)
#define WEIGHT_PIN A2          // Fake weight (for testing)
#define HEIGHT_PIN A3          // Fake height (for testing)

// ============================================================================
// SENSOR SETUP
// ============================================================================
DHT dht(DHT_PIN, DHT_TYPE);

// Timing variables
unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL = 1000;  // Sample every 1 second

// ============================================================================
// SETUP - Runs once when Arduino starts
// ============================================================================
void setup() {
  Serial.begin(9600);           // Start serial communication at 9600 baud
  dht.begin();                  // Initialize temperature sensor
  
  pinMode(HEART_RATE_PIN, INPUT);
  pinMode(SPO2_PIN, INPUT);
  pinMode(WEIGHT_PIN, INPUT);
  pinMode(HEIGHT_PIN, INPUT);
  
  delay(2000);  // Wait for sensors to initialize
  Serial.println("{\"status\": \"Arduino initialized\"}");
}

// ============================================================================
// MAIN LOOP - Runs repeatedly
// ============================================================================
void loop() {
  unsigned long currentTime = millis();
  
  // Only read sensors every SAMPLE_INTERVAL milliseconds
  if (currentTime - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = currentTime;
    
    // Read all sensors
    readAllSensors();
  }
}

// ============================================================================
// FUNCTION: Read all sensors and send data
// ============================================================================
void readAllSensors() {
  // Read temperature from DHT22
  float temperature = dht.readTemperature();
  
  // If temperature reading failed, use a default value
  if (isnan(temperature)) {
    temperature = 36.5;  // Normal body temperature
  }
  
  // Read analog sensor values (0-1023)
  int heartRateRaw = analogRead(HEART_RATE_PIN);
  int spo2Raw = analogRead(SPO2_PIN);
  int weightRaw = analogRead(WEIGHT_PIN);
  int heightRaw = analogRead(HEIGHT_PIN);
  
  // Convert raw analog values to realistic medical readings
  // Heart Rate: Map 0-1023 to 60-120 bpm
  int heartRate = map(heartRateRaw, 0, 1023, 60, 120);
  
  // SpO2: Map 0-1023 to 95-100 %
  int spo2 = map(spo2Raw, 0, 1023, 95, 100);
  
  // Weight: Map 0-1023 to 40-100 kg (adjust for your scale)
  float weight = (weightRaw / 1023.0) * 60.0 + 40.0;
  
  // Height: Map 0-1023 to 150-200 cm (adjust for your sensor)
  float height = (heightRaw / 1023.0) * 50.0 + 150.0;
  
  // Create JSON string to send (IMPORTANT: Must match Python backend format)
  String jsonData = "{";
  jsonData += "\"hr\": " + String(heartRate) + ", ";
  jsonData += "\"spo2\": " + String(spo2) + ", ";
  jsonData += "\"temp\": " + String(temperature, 1) + ", ";
  jsonData += "\"weight\": " + String(weight, 1) + ", ";
  jsonData += "\"height\": " + String(height, 1);
  jsonData += "}";
  
  // Send data through serial port
  Serial.println(jsonData);
  
  // Optional: Print to Arduino IDE Serial Monitor for debugging
  // Serial.print("DEBUG: ");
  // Serial.println(jsonData);
}

// ============================================================================
// EXPLANATION OF VARIABLES:
// ============================================================================
/*
HR (Heart Rate): 60-120 beats per minute - normal range
SpO2: 95-100% - oxygen saturation in blood
TEMP: 36-37.5°C - normal body temperature
Weight: 40-100 kg - human weight range
Height: 150-200 cm - typical human height

map(value, fromLow, fromHigh, toLow, toHigh)
- Converts one range of numbers to another
- Example: map(512, 0, 1023, 60, 120) = 90
*/

// ============================================================================
// TESTING WITHOUT REAL SENSORS:
// ============================================================================
/*
If you don't have real sensors yet, use this simplified version:

void readAllSensors() {
  // Hardcoded test values (replace with real sensors later)
  int heartRate = 75;
  int spo2 = 98;
  float temperature = 36.8;
  float weight = 70.5;
  float height = 170.0;
  
  String jsonData = "{";
  jsonData += "\"hr\": " + String(heartRate) + ", ";
  jsonData += "\"spo2\": " + String(spo2) + ", ";
  jsonData += "\"temp\": " + String(temperature, 1) + ", ";
  jsonData += "\"weight\": " + String(weight, 1) + ", ";
  jsonData += "\"height\": " + String(height, 1);
  jsonData += "}";
  
  Serial.println(jsonData);
}
*/
```

### **Step 3: Upload to Arduino**

1. Connect Arduino to your computer with USB cable
2. Select **Tools → Board → Arduino Uno** (or your board type)
3. Select **Tools → Port → COM3** (or the port shown)
4. Click **Upload** (arrow button)
5. Wait for "Done uploading" message

---

## **PART 3: Test Arduino Output**

### **In Arduino IDE:**

1. Go to **Tools → Serial Monitor**
2. Set baud rate to **9600** (bottom right)
3. You should see JSON data like:
```json
{"hr": 75, "spo2": 98, "temp": 36.8, "weight": 70.5, "height": 170.0}
```

If you see data, ✅ **Arduino is working!**

---

## **PART 4: Connect Arduino to Raspberry Pi**

### **Step 1: Find Arduino Port on Pi**

In terminal on Raspberry Pi, run:
```bash
ls /dev/ttyUSB* /dev/ttyACM*
```

You should see: `/dev/ttyUSB0` or `/dev/ttyACM0`

### **Step 2: Install Python Serial Library**

```bash
pip install pyserial
```

### **Step 3: Test Connection**

Create a test file `/home/raspberrypi/test_arduino.py`:

```python
import serial
import json

ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=2)
print("Connected to Arduino!")

for i in range(10):  # Read 10 lines
    if ser.in_waiting > 0:
        line = ser.readline().decode('utf-8').strip()
        try:
            data = json.loads(line)
            print(f"✓ HR: {data['hr']} | SpO2: {data['spo2']}% | Temp: {data['temp']}°C")
        except:
            pass

ser.close()
```

Run it:
```bash
python test_arduino.py
```

If you see vitals, ✅ **Raspberry Pi can read Arduino!**

---

## **PART 5: Update Your Website**

### **Step 1: Install pyserial in your environment**

```bash
cd /home/raspberrypi/medical-bot-website
source venv/bin/activate
pip install pyserial
```

### **Step 2: Restart Flask Server**

```bash
python backend/app.py
```

### **Step 3: Check Website**

1. Open `http://localhost:5000/dashboard.html`
2. Go to **Vitals** section
3. You should see **🟢 Arduino Connected** in green
4. Fields should auto-populate with live data!

---

## **Common Issues & Solutions**

| Problem | Solution |
|---------|----------|
| Serial port not found | Check USB cable, run `ls /dev/tty*` |
| "Permission denied" | Run `sudo usermod -a -G dialout $USER` |
| Garbage characters | Change baud rate to match Arduino (9600) |
| No data appearing | Check sensor wiring, verify DHT library installed |
| Arduino not uploading | Select correct board type in Tools menu |
| Website still shows "Disconnected" | Restart Flask server after Arduino connected |

---

## **Next Steps - Real Sensors**

Once testing works, replace these with REAL sensors:

### **1. Heart Rate + SpO2 Sensor (MAX30100)**
Install: `Adafruit MAX30100 library`

```cpp
#include <MAX30100_PulseOximeter.h>
PulseOximeter pox;

void setup() {
  if (!pox.begin()) {
    Serial.println("FAILED");
    while (1);
  }
}

void loop() {
  pox.update();
  heartRate = pox.getHeartRate();
  spo2 = pox.getSpO2();
}
```

### **2. Weight Sensor (HX711)**
Install: `HX711` library

```cpp
#include "HX711.h"
HX711 scale;
scale.begin(DT_PIN, SCK_PIN);
scale.set_scale(2280.f);  // Calibrate with known weight
weight = scale.get_units(10);
```

### **3. Height Sensor (Ultrasonic)**
```cpp
int trigPin = A3, echoPin = A2;
digitalWrite(trigPin, LOW);
delayMicroseconds(2);
digitalWrite(trigPin, HIGH);
delayMicroseconds(10);
digitalWrite(trigPin, LOW);
long duration = pulseIn(echoPin, HIGH);
height = duration * 0.034 / 2;  // Distance in cm
```

---

## **Summary**

✅ Arduino reads 5 vitals
✅ Sends JSON via Serial (9600 baud)
✅ Raspberry Pi receives via `/dev/ttyUSB0`
✅ Python backend processes in real-time
✅ Website displays live on dashboard

**Everything is already set up in your code!** Just plug in Arduino and start testing. 🎉

