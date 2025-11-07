#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>   // For JSON parsing

// ----------- USER CONFIG ------------
const char* WIFI_SSID = "ufdevice";
const char* WIFI_PASSWORD = "gogators";

const char* SUPABASE_URL = "https://rmrarbqpzpotdotpetrm.supabase.co/rest/v1/shelf_items";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcmFyYnFwenBvdGRvdHBldHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDcwNDgsImV4cCI6MjA3NTA4MzA0OH0.Fo_m3Ns_Br2hlqx6B7jFWwW1GCPZAYJ1FeLu0c9Szs4";
// ------------------------------------


// Connect to WiFi
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}


// Send PATCH request to Supabase to update shelf item weight
void updateSupabase(const char* device_id, float weight) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }

  HTTPClient http;

  // Create endpoint for specific device_id
  String url = String(SUPABASE_URL) + "?device_id=eq." + device_id;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  // Payload: only update current_weight
  String payload = "{\"current_weight\": " + String(weight, 2) + "}";

  Serial.println("\nSending PATCH to Supabase...");
  Serial.println(url);
  Serial.println(payload);

  int httpResponseCode = http.PATCH(payload);

  if (httpResponseCode > 0) {
    Serial.print("Supabase response: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
  } else {
    Serial.print("HTTP error: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}


// ESP-NOW receive callback
void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  char msg[250];
  memcpy(msg, incomingData, len);
  msg[len] = '\0'; // Null-terminate the message

  // Display sender MAC
  char macStr[18];
  snprintf(macStr, sizeof(macStr),
           "%02X:%02X:%02X:%02X:%02X:%02X",
           info->src_addr[0], info->src_addr[1], info->src_addr[2],
           info->src_addr[3], info->src_addr[4], info->src_addr[5]);

  Serial.print("\n📡 Received from ");
  Serial.print(macStr);
  Serial.print(": ");
  Serial.println(msg);

  // Parse JSON payload
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, msg);
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Expect only these two keys
  const char* device_id = doc["device_id"];
  float current_weight = doc["current_weight"];

  if (!device_id || isnan(current_weight)) {
    Serial.println("Invalid payload: missing device_id or weight");
    return;
  }

  Serial.print("Parsed device_id: ");
  Serial.println(device_id);
  Serial.print("Parsed current_weight: ");
  Serial.println(current_weight);

  // Update Supabase
  updateSupabase(device_id, current_weight);
}


void setup() {
  Serial.begin(115200);
  delay(1000);

  connectWiFi();

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  esp_now_register_recv_cb(onDataRecv);
  Serial.println("Ready to receive ESP-NOW data and update Supabase!");
}


void loop() {
  // Nothing to do — callback handles everything
}
