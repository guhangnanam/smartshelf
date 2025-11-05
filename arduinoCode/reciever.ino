#include <WiFi.h>
#include <esp_now.h>

// New callback signature
void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  char msg[250];
  memcpy(msg, incomingData, len);
  msg[len] = '\0'; // Null-terminate

  // Extract sender MAC from info
  char macStr[18];
  snprintf(macStr, sizeof(macStr),
           "%02X:%02X:%02X:%02X:%02X:%02X",
           info->src_addr[0], info->src_addr[1], info->src_addr[2],
           info->src_addr[3], info->src_addr[4], info->src_addr[5]);

  Serial.print("Received from ");
  Serial.print(macStr);
  Serial.print(": ");
  Serial.println(msg);
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register receive callback with new signature
  esp_now_register_recv_cb(onDataRecv);
}

void loop() {
  // Nothing needed, callback handles messages
}
