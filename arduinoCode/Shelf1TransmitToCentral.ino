#include <WiFi.h>
#include <esp_now.h>
#include <ArduinoJson.h>

// Device id for this specific shelf`
const char* DEVICE_ID = "ShelfESP32_1"; 

// change later temp!!!!
float currentWeight = 0.0;               

// Central ESP32 MAC Address (Receiver)
uint8_t receiverMac[] = {0xAC, 0x15, 0x18, 0xF2, 0x7C, 0x70};
// ----------------------------------------


// Callback when data is sent
void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}



float getSensorWeight() {
  // Fill in with Gabriels code
}


// Send JSON message via ESP-NOW
void sendWeightUpdate() {
  currentWeight = getSensorWeight();

  // Create JSON object
  StaticJsonDocument<128> doc;
  doc["device_id"] = DEVICE_ID;
  doc["current_weight"] = currentWeight;

  char jsonBuffer[128];
  size_t len = serializeJson(doc, jsonBuffer);

  // Send packet
  esp_err_t result = esp_now_send(receiverMac, (uint8_t *)jsonBuffer, len);

  if (result == ESP_OK) {
    Serial.print("Sent data: ");
    Serial.println(jsonBuffer);
  } else {
    Serial.print("Error sending data: ");
    Serial.println(result);
  }
}


// Setup function
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize Wi-Fi in Station mode
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

  Serial.println("ESP-NOW setup complete. Starting transmission...");
}


// Main loop
void loop() {
  sendWeightUpdate();
  delay(2000); // Send every 2 seconds
}

