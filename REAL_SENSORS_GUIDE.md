# Real Sensor Integration Guide

This guide helps you replace test data with actual sensor readings.

---

## **Sensor 1: Heart Rate + SpO2 (MAX30100 / MAX30102)**

### **Why This Sensor:**
- Single sensor reads BOTH heart rate AND SpO2
- I2C interface (simple 2 wires)
- Most medical-grade option

### **Hardware:**
- MAX30100 or MAX30102 module
- 4 wires: VCC, GND, SCL (A5), SDA (A4)

### **Arduino Code:**

```cpp
#include <MAX30100_PulseOximeter.h>

PulseOximeter pox;

void setup() {
  Serial.begin(9600);
  
  // Initialize MAX30100
  if (!pox.begin()) {
    Serial.println("FAILED to initialize MAX30100");
    while (1);
  }
  
  // Set LED brightness (optional)
  pox.setIRLedCurrentBlink(50);
}

void loop() {
  pox.update();  // Must call this frequently
  
  int heartRate = pox.getHeartRate();
  int spo2 = pox.getSpO2();
  
  // Send data (see main sketch)
  Serial.print("{\"hr\": ");
  Serial.print(heartRate);
  Serial.print(", \"spo2\": ");
  Serial.print(spo2);
  // ... rest of JSON ...
  Serial.println("}");
  
  delay(1000);
}
```

### **Installation:**
1. In Arduino IDE: **Sketch → Include Library → Manage Libraries**
2. Search: `MAX30100` → Install by omega682
3. Done!

---

## **Sensor 2: Temperature (DHT22)**

### **Why This Sensor:**
- Digital output (no calibration needed)
- Small and cheap
- Good accuracy ±0.5°C

### **Hardware:**
- DHT22 module or DHT22 sensor
- 3 wires: VCC (5V), GND, DATA (Pin 2)

### **Arduino Code:**

```cpp
#include <DHT.h>

#define DHT_PIN 2
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  // Read temperature (2-3 seconds)
  float temperature = dht.readTemperature();
  
  // Check if read failed
  if (isnan(temperature)) {
    temperature = 36.5;  // Default to normal body temp
  }
  
  // Send data
  Serial.print("{\"temp\": ");
  Serial.print(temperature, 1);  // 1 decimal place
  // ... rest of JSON ...
  Serial.println("}");
  
  delay(2000);  // DHT22 needs 2 seconds between readings
}
```

### **Installation:**
1. **Sketch → Include Library → Manage Libraries**
2. Search: `DHT sensor library` → Install by Adafruit
3. Done!

### **Troubleshooting:**
- If you see `-1.0°C`, sensor not responding → check wiring
- Add 10kΩ pull-up resistor to DATA pin if needed

---

## **Sensor 3: Weight (HX711 Load Cell)**

### **Why This Sensor:**
- Super accurate for weight
- Digital output via HX711 amplifier
- Commonly used in medical scales

### **Hardware:**
- Load cell (usually 5kg or 20kg capacity)
- HX711 module
- Wiring: 
  - HX711 VCC → 5V
  - HX711 GND → GND
  - HX711 DT → A1
  - HX711 SCK → A0

### **Arduino Code:**

```cpp
#include "HX711.h"

#define LOADCELL_DOUT_PIN A1
#define LOADCELL_SCK_PIN A0

HX711 scale;

void setup() {
  Serial.begin(9600);
  
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  
  // CALIBRATION: Measure the load cell output
  // Place a known weight (e.g., 1kg) and note the raw value
  // scale.set_scale(VALUE);  // Replace VALUE with raw output / 1000
  
  // Example: If output was 2280000 for 1kg
  scale.set_scale(2280000.0);
  
  // Reset the scale to 0
  scale.tare();
  
  delay(1000);
}

void loop() {
  // Get weight in kg (takes ~100ms)
  float weight = scale.get_units(10);  // Average of 10 readings
  
  // Send data
  Serial.print("{\"weight\": ");
  Serial.print(weight, 1);  // 1 decimal place
  // ... rest of JSON ...
  Serial.println("}");
  
  delay(1000);
}
```

### **Installation:**
1. **Sketch → Include Library → Manage Libraries**
2. Search: `HX711` → Install by bogde
3. Done!

### **Calibration (IMPORTANT):**
```cpp
// Step 1: Upload this code with debug
void loop() {
  Serial.println(scale.read());  // Print raw value
  delay(500);
}

// Step 2: Place known weight (e.g., 1kg) on scale
// Step 3: Note the average raw value
// Step 4: Calculate: set_scale(rawValue / knownWeight)
// Step 5: Update code with correct set_scale value

// Example: If raw output = 2280000 for 1kg
// set_scale(2280000 / 1) = 2280000
```

---

## **Sensor 4: Height (Ultrasonic HC-SR04)**

### **Why This Sensor:**
- Non-contact (good for medical)
- Simple to use
- No calibration needed

### **Hardware:**
- HC-SR04 ultrasonic module
- Wiring:
  - VCC → 5V
  - GND → GND
  - TRIG → A3
  - ECHO → A2

### **Arduino Code:**

```cpp
#define TRIG_PIN A3
#define ECHO_PIN A2

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

float readHeight() {
  // Send 10µs pulse to trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo time
  long duration = pulseIn(ECHO_PIN, HIGH, 23200);  // 23200µs = max 4m
  
  // Convert to distance in cm
  // Speed of sound = 34300 cm/s
  // Distance = (time / 2) * speed = (duration / 2) * 0.0343
  float heightCm = (duration / 2.0) * 0.0343;
  
  // Filter invalid readings
  if (heightCm < 50 || heightCm > 250) {
    return -1.0;  // Invalid
  }
  
  return heightCm;
}

void loop() {
  float height = readHeight();
  
  if (height > 0) {
    Serial.print("{\"height\": ");
    Serial.print(height, 1);
    // ... rest of JSON ...
    Serial.println("}");
  }
  
  delay(1000);
}
```

---

## **Complete Sensor Sketch (All 5 Sensors)**

Combine all sensors into one sketch:

```cpp
#include <DHT.h>
#include <HX711.h>
#include <MAX30100_PulseOximeter.h>
#include <Wire.h>

// ===== PIN DEFINITIONS =====
#define DHT_PIN 2
#define DHT_TYPE DHT22
#define LOADCELL_DT_PIN A1
#define LOADCELL_SCK_PIN A0
#define TRIG_PIN A3
#define ECHO_PIN A2

// ===== SENSOR SETUP =====
DHT dht(DHT_PIN, DHT_TYPE);
HX711 scale;
PulseOximeter pox;

unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL = 1000;

void setup() {
  Serial.begin(9600);
  
  // Initialize DHT22
  dht.begin();
  
  // Initialize HX711
  scale.begin(LOADCELL_DT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(2280000.0);  // CHANGE THIS TO YOUR VALUE
  scale.tare();
  
  // Initialize MAX30100
  if (!pox.begin()) {
    Serial.println("{\"error\": \"MAX30100 failed\"}");
  }
  
  // Initialize HC-SR04
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  delay(2000);
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = currentTime;
    
    // Update sensors
    pox.update();
    
    // Read all values
    int heartRate = pox.getHeartRate();
    int spo2 = pox.getSpO2();
    float temperature = dht.readTemperature();
    float weight = scale.get_units(10);
    float height = readHeight();
    
    // Validate temperature
    if (isnan(temperature)) {
      temperature = 36.5;
    }
    
    // Build and send JSON
    String jsonData = "{";
    jsonData += "\"hr\": " + String(heartRate) + ", ";
    jsonData += "\"spo2\": " + String(spo2) + ", ";
    jsonData += "\"temp\": " + String(temperature, 1) + ", ";
    jsonData += "\"weight\": " + String(weight, 1) + ", ";
    jsonData += "\"height\": " + String(height, 1);
    jsonData += "}";
    
    Serial.println(jsonData);
  }
}

float readHeight() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 23200);
  float heightCm = (duration / 2.0) * 0.0343;
  
  if (heightCm < 50 || heightCm > 250) {
    return 170.0;  // Return default if invalid
  }
  
  return heightCm;
}
```

---

## **Sensor Comparison Table**

| Sensor | Cost | Accuracy | Difficulty | Wire Count |
|--------|------|----------|------------|-----------|
| MAX30100 (HR+SpO2) | $15-25 | ★★★★★ | Medium | 4 (I2C) |
| DHT22 (Temp) | $3-5 | ★★★★ | Easy | 3 |
| HX711 (Weight) | $10-15 | ★★★★★ | Hard | 4 |
| HC-SR04 (Height) | $2-3 | ★★★ | Easy | 4 |

---

## **My Recommendation for Beginners**

**Start with this order:**

1. **First:** DHT22 (easiest) + HC-SR04 (simple) + test code
2. **Second:** Add HX711 (requires calibration)
3. **Third:** Add MAX30100 (I2C, most accurate)

This way you learn gradually and can test each component!

---

## **Troubleshooting Real Sensors**

| Problem | Solution |
|---------|----------|
| Sensor not detected | Check I2C address with I2C scanner sketch |
| Wrong values | Sensor might need calibration |
| Unstable readings | Add capacitor (100µF) to sensor power |
| Serial garbage | Check baud rate is 9600 |
| Sensor stops working after a while | Check power supply current |

