#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// -------------------- USER CONFIG --------------------
const char* WIFI_SSID = "ufdevice";
const char* WIFI_PASSWORD = "gogators";

// Supabase REST endpoint (table: shelf_items)
const char* SUPABASE_URL = "https://rmrarbqpzpotdotpetrm.supabase.co/rest/v1/shelf_items";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcmFyYnFwenBvdGRvdHBldHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDcwNDgsImV4cCI6MjA3NTA4MzA0OH0.Fo_m3Ns_Br2hlqx6B7jFWwW1GCPZAYJ1FeLu0c9Szs4";

// Device to query in Supabase and to include in alerts
const char* DEVICE_ID = "ShelfESP32_1";

// Target ESP32 MAC for ESP-NOW alerts (replace with actual STA MAC of the peer)
uint8_t peerMac[] = {0xAC, 0x15, 0x18, 0xF2, 0x7C, 0x70};

// Alert threshold
const float ALERT_THRESHOLD = 20.0;

// Poll interval (ms)
const uint32_t POLL_INTERVAL_MS = 5000;
// ----------------------------------------------------


// -------------------- WIFI --------------------
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  uint32_t startMs = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
    if (millis() - startMs > 15000) {
      Serial.println("\nWiFi connect timeout. Retrying...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      startMs = millis();
    }
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP: "); Serial.println(WiFi.localIP());
  Serial.print("STA MAC: "); Serial.println(WiFi.macAddress());
}
// ------------------------------------------------


// -------------------- SUPABASE GET --------------------
float fetchWeightFromSupabase(const char* device_id) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return NAN;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "?device_id=eq." + device_id + "&select=current_weight";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  int code = http.GET();
  float weight = NAN;

  if (code > 0) {
    String response = http.getString();
    Serial.println("Supabase GET response: " + response);

    // Expecting an array of rows; take first row's current_weight
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, response);
    if (err) {
      Serial.print("JSON parse error: ");
      Serial.println(err.c_str());
    } else if (doc.size() == 0) {
      Serial.println("No rows found for device_id.");
    } else {
      // Handle both numeric and string types gracefully
      if (doc[0]["current_weight"].is<float>()) {
        weight = doc[0]["current_weight"].as<float>();
      } else if (doc[0]["current_weight"].is<const char*>()) {
        weight = String(doc[0]["current_weight"].as<const char*>()).toFloat();
      } else {
        Serial.println("current_weight type unsupported.");
      }
    }
  } else {
    Serial.print("HTTP GET error: ");
    Serial.println(code);
  }

  http.end();
  return weight;
}
// ------------------------------------------------------


// -------------------- ESP-NOW --------------------
void onDataSent(const wifi_tx_info_t* info, esp_now_send_status_t status) {
  Serial.print("ESP-NOW send status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");

  if (info != nullptr) {
    char macStr[18];
    snprintf(macStr, sizeof(macStr),
             "%02X:%02X:%02X:%02X:%02X:%02X",
             info->des_addr[0], info->des_addr[1], info->des_addr[2],
             info->des_addr[3], info->des_addr[4], info->des_addr[5]);
    Serial.print("Destination: ");
    Serial.println(macStr);
  }
}

bool setupEspNowPeer(const uint8_t mac[6]) {
  // Remove existing peer if present
  esp_now_del_peer(mac);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, mac, 6);
  peer.channel = 0;       // 0 means current channel; ensure both are same WiFi channel if needed
  peer.encrypt = false;   // no encryption for simplicity; must match on receiver

  esp_err_t addRes = esp_now_add_peer(&peer);
  if (addRes != ESP_OK) {
    Serial.print("Failed to add peer, err=");
    Serial.println(addRes);
    return false;
  }
  return true;
}

bool sendAlert(const char* device_id, float weight) {
  StaticJsonDocument<128> doc;
  doc["device_id"] = device_id;
  doc["alert_weight"] = weight;

  char buffer[128];
  size_t len = serializeJson(doc, buffer);

  esp_err_t res = esp_now_send(peerMac, reinterpret_cast<const uint8_t*>(buffer), len);
  if (res != ESP_OK) {
    Serial.print("esp_now_send error: ");
    Serial.println(res);
    return false;
  }
  Serial.print("Alert payload sent: ");
  Serial.println(buffer);
  return true;
}
// ------------------------------------------------------


// -------------------- SETUP & LOOP --------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  connectWiFi();

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_send_cb(onDataSent);

  // Add peer
  if (!setupEspNowPeer(peerMac)) {
    Serial.println("Peer setup failed. Check MAC and channel alignment.");
  }

  Serial.println("Ready: polling Supabase and sending ESP-NOW alerts when weight < threshold.");
}

void loop() {
  static uint32_t lastPoll = 0;
  uint32_t now = millis();

  if (now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;

    float weight = fetchWeightFromSupabase(DEVICE_ID);
    if (!isnan(weight)) {
      Serial.print("Fetched weight: ");
      Serial.println(weight, 2);

      if (weight < ALERT_THRESHOLD) {
        Serial.println("Weight below threshold; sending alert via ESP-NOW...");
        sendAlert(DEVICE_ID, weight);
      } else {
        Serial.println("Weight above threshold; no alert.");
      }
    }
  }
}
