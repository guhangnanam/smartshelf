#include <WiFi.h>
#include <esp_now.h>

// Target MAC address (Arduino/ESP32 you want to send to) Jason's ESP32 gets the message. Upload this to Guhan's ESP32
uint8_t targetMac[] = {0xAC, 0x15, 0x18, 0xF2, 0x7C, 0x70}; 

// Callback when data is sent
void onDataSent(const wifi_tx_info_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}

// Function to send a message to a specific MAC
void sendMessageToMac(const uint8_t *mac, const char *message) {
  esp_err_t result = esp_now_send(mac, (uint8_t *)message, strlen(message));
  if (result == ESP_OK) {
    Serial.println("Message queued for sending");
  } else {
    Serial.print("Error sending message: ");
    Serial.println(result);
  }
}

void setup() {
  Serial.begin(115200);

  // Set device as Wi-Fi Station
  WiFi.mode(WIFI_STA);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register send callback
  esp_now_register_send_cb(onDataSent);

  // Add peer (the Arduino/ESP32 with your MAC)
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, targetMac, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  // Send a test message
  sendMessageToMac(targetMac, "Hello Arduino ESP32!");
}

void loop() {
  delay(1000);
  sendMessageToMac(targetMac, "Ping from ESP32");
}
