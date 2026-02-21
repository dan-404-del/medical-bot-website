// ============================================================================
// BEGINNER TEST ARDUINO SKETCH - Copy and paste into Arduino IDE
// ============================================================================
// This is a SIMPLIFIED version that doesn't need any libraries
// Use this to test if your Arduino→Pi connection works
// Once this works, upgrade to real sensors
// ============================================================================

// PIN CONFIGURATION (change if using different pins)
#define DHT_PIN 2

// Timing
unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL = 1000;  // Send data every 1 second

// ============================================================================
// SETUP - Runs once when Arduino starts
// ============================================================================
void setup() {
  Serial.begin(9600);  // Start serial at 9600 baud (IMPORTANT!)
  delay(2000);         // Wait for Arduino to initialize
  Serial.println("{\"status\": \"Arduino started\"}");
}

// ============================================================================
// MAIN LOOP - Runs over and over
// ============================================================================
void loop() {
  unsigned long currentTime = millis();
  
  // Check if 1 second has passed
  if (currentTime - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = currentTime;
    
    // Read sensors (or use fake data for testing)
    readAndSendSensorData();
  }
}

// ============================================================================
// FUNCTION: Read all sensors and send as JSON
// ============================================================================
void readAndSendSensorData() {
  
  // ========== FOR TESTING: Use fake data ==========
  // Replace these with real sensor readings when you have them
  int heartRate = 72;           // Replace with: readHeartRate()
  int spo2 = 98;                // Replace with: readSpO2()
  float temperature = 36.8;     // Replace with: readTemperature()
  float weight = 70.5;          // Replace with: readWeight()
  float height = 170.0;         // Replace with: readHeight()
  
  // ========== REAL SENSOR EXAMPLES (uncomment when ready) ==========
  
  // Example 1: Read analog sensor (0-1023) and convert
  // int rawValue = analogRead(A0);
  // int heartRate = map(rawValue, 0, 1023, 60, 120);
  
  // Example 2: Read DHT22 temperature
  // #include <DHT.h>
  // DHT dht(DHT_PIN, DHT22);
  // float temperature = dht.readTemperature();
  
  // ========== BUILD JSON STRING ==========
  // Format MUST match what Python backend expects:
  // {"hr": X, "spo2": Y, "temp": Z, "weight": W, "height": H}
  
  String jsonData = "{";
  jsonData += "\"hr\": " + String(heartRate);
  jsonData += ", \"spo2\": " + String(spo2);
  jsonData += ", \"temp\": " + String(temperature, 1);  // 1 decimal place
  jsonData += ", \"weight\": " + String(weight, 1);
  jsonData += ", \"height\": " + String(height, 1);
  jsonData += "}";
  
  // ========== SEND DATA ==========
  Serial.println(jsonData);
  
  // Optional: Also print for debugging in Serial Monitor
  // Serial.print("DEBUG: ");
  // Serial.println(jsonData);
}

// ============================================================================
// HELPER FUNCTIONS - Add these as you add sensors
// ============================================================================

/*
// Example: Read Heart Rate from MAX30100
int readHeartRate() {
  // Code to read MAX30100 sensor
  int rawValue = analogRead(A0);
  return map(rawValue, 0, 1023, 60, 120);
}

// Example: Read SpO2 from MAX30100
int readSpO2() {
  // Code to read MAX30100 sensor
  int rawValue = analogRead(A1);
  return map(rawValue, 0, 1023, 95, 100);
}

// Example: Read Temperature from DHT22
#include <DHT.h>
DHT dht(2, DHT22);
float readTemperature() {
  return dht.readTemperature();
}

// Example: Read Weight from HX711
#include "HX711.h"
HX711 scale;
float readWeight() {
  return scale.get_units(10);
}

// Example: Read Height from Ultrasonic
float readHeight() {
  int trigPin = A3, echoPin = A2;
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration * 0.034 / 2;  // Convert to cm
}
*/

// ============================================================================
// TESTING CHECKLIST
// ============================================================================
/*
BEFORE UPLOADING:
1. ✅ Connect Arduino to computer with USB cable
2. ✅ Select Tools → Board → Arduino Uno (or your board)
3. ✅ Select Tools → Port → COM3 (or the port shown)
4. ✅ Click Upload button

AFTER UPLOADING:
1. ✅ Open Tools → Serial Monitor
2. ✅ Set baud rate to 9600 (bottom right corner)
3. ✅ You should see JSON data like:
      {"hr": 72, "spo2": 98, "temp": 36.8, "weight": 70.5, "height": 170.0}

IF YOU DON'T SEE DATA:
- Check USB cable is connected
- Check you selected the right port
- Try a different COM port
- Open Arduino IDE → Tools → Serial Monitor and look for error messages

IF IT WORKS:
- Connect Arduino to Raspberry Pi with USB cable
- The website will automatically detect it!
*/
