#include <WiFi.h>
#include <esp_now.h>
#include <ArduinoJson.h>
#include "HX711.h"

// ---------------- CONFIG ----------------
const char* DEVICE_ID = "ShelfESP32_1";   // Must match the device_id in Supabase
uint8_t receiverMac[] = {0xAC, 0x15, 0x18, 0xF2, 0x7C, 0x70};  // Central ESP32 MAC

#define MAX_WEIGHT 10000
#define DOUT_1 4
#define CLK_1 5
#define DOUT_2 26
#define CLK_2 27

// Calibration values
float calibration_factor_1 = 426;
float calibration_factor_2 = 330.0;
long zero_offset_1 = 86255;
long zero_offset_2 = 85000;

// HX711 scale objects
HX711 scale_1, scale_2;

// Global weight variable
float GLOBAL_WEIGHT = 0.0;

// Transmission interval (ms)
unsigned long previousMillis = 0;
const long interval = 2000;  // every 2 seconds
// ----------------------------------------


// ---------- Scale Functions -------------
void setupScales() {
  scale_1.begin(DOUT_1, CLK_1);
  scale_2.begin(DOUT_2, CLK_2);
}

void updateWeight(float scale_weight_1, float scale_weight_2) {
  if (scale_weight_1 > MAX_WEIGHT && scale_weight_2 > MAX_WEIGHT) {
    GLOBAL_WEIGHT = 0;
    return;
  }
  if (scale_weight_1 > MAX_WEIGHT) {
    GLOBAL_WEIGHT = scale_weight_2;
    return;
  }
  if (scale_weight_2 > MAX_WEIGHT) {
    GLOBAL_WEIGHT = scale_weight_1;
    return;
  }
  // Average the two scales (negated if required by your wiring)
  GLOBAL_WEIGHT = -((scale_weight_1 + scale_weight_2) / 2);
}

void updateWeightOne(float scale_weight_1) {
  GLOBAL_WEIGHT = -scale_weight_1;
}

float getCombinedWeight() {
  long reading_1 = scale_1.read_average(10);
  float weight_1 = (reading_1 + zero_offset_1) / calibration_factor_1;

  // Optional second scale
  // long reading_2 = scale_2.read_average(10);
  // float weight_2 = (reading_2 - zero_offset_2) / calibration_factor_2;
  // updateWeight(weight_1, weight_2);

  updateWeightOne(weight_1);
  return GLOBAL_WEIGHT;
}
// ----------------------------------------


// ---------- ESP-NOW Functions ------------
void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}

void sendWeightUpdate(float currentWeight) {
  // Build JSON payload
  StaticJsonDocument<128> doc;
  doc["device_id"] = DEVICE_ID;
  doc["current_weight"] = currentWeight;

  char jsonBuffer[128];
  size_t len = serializeJson(doc, jsonBuffer);

  // Send data
  esp_err_t result = esp_now_send(receiverMac, (uint8_t *)jsonBuffer, len);

  if (result == ESP_OK) {
    Serial.print("Sent data: ");
    Serial.println(jsonBuffer);
  } else {
    Serial.print("Error sending data: ");
    Serial.println(result);
  }
}
// ----------------------------------------


// ---------- Setup & Loop ------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  setupScales();

  // Initialize Wi-Fi in station mode
  WiFi.mode(WIFI_STA);
  Serial.println("WiFi set to STA mode");

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register send callback
  esp_now_register_send_cb(onDataSent);

  // Add receiver as peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, receiverMac, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  Serial.println("ESP-NOW setup complete. Starting weight transmission...");
}


void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float weight = getCombinedWeight();

    Serial.print("Weight: ");
    Serial.print(weight, 2);
    Serial.println(" g");

    sendWeightUpdate(weight);
  }
}
