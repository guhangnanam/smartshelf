#include <WiFi.h>
#include <esp_now.h>
#include <ArduinoJson.h>
#include "HX711.h"
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <LiquidCrystal_I2C.h>
#include <esp_wifi.h>


// ---------------- CONFIG ----------------
const char* DEVICE_ID = "ShelfESP32_1";
uint8_t receiverMac[] = {0x04, 0x83, 0x08, 0x76, 0x75, 0x00};

#define MAX_WEIGHT 10000
#define SDA_PIN 21
#define SCL_PIN 22
#define GRAMS_TO_OZ 28.35

bool grams = true;
bool isTransmiting = false;

// -------- BUTTON (PIN 13) ----------
const int buttonPin = 13;
bool lastButtonState = HIGH;  // HIGH = not pressed (INPUT_PULLUP)
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 200;  // 200ms debounce

// Scale struct definition
struct Scale {
  HX711 ADC;
  float calibration_factor;
  long zero_offset;
  float current_weight;
  int DOUT;
  int CLK;
};

Scale scale1 = {HX711(), 426, 86255, 0.0, 4, 5};
//Scale scale2 = {HX711(), 330.0, 85000, 0.0, 26, 27};
//Scale scale3 = {HX711(), 330.0, 85000, 0.0, 14, 12}; 

LiquidCrystal_I2C lcd(0x27, 16, 2);

float GLOBAL_WEIGHT = 0.0;
unsigned long previousMillis = 0;
const long interval = 1000;

float gramsToOz(float grams) {
  return grams / GRAMS_TO_OZ;
}

void initScale(Scale &scale) {
  scale.ADC.begin(scale.DOUT, scale.CLK);
  scale.ADC.set_scale(scale.calibration_factor);
  scale.ADC.set_offset(scale.zero_offset);
  Serial.print("Scale initialized on DOUT:");
  Serial.print(scale.DOUT);
  Serial.print(" CLK:");
  Serial.println(scale.CLK);
}

void setupScales() {
  initScale(scale1);
  //initScale(scale2);
  // initScale(scale3);
  Serial.println("All scales initialized");
}

float readScale(Scale &scale) {
  if (scale.ADC.is_ready()) {
    float reading = scale.ADC.get_units(5);
    scale.current_weight = -reading;
    if (scale.current_weight < 0) scale.current_weight = 0;
  }
  return scale.current_weight;
}

void tareScale(Scale &scale) {
  Serial.println("Taring scale...");
  scale.ADC.tare(10);
  scale.zero_offset = scale.ADC.get_offset();
  Serial.print("New zero offset: ");
  Serial.println(scale.zero_offset);
}

void calibrateScale(Scale &scale, float known_weight) {
  Serial.println("Place known weight and wait...");
  delay(3000);

  long reading = scale.ADC.get_units(10);
  scale.calibration_factor = reading / known_weight;
  scale.ADC.set_scale(scale.calibration_factor);

  Serial.print("New calibration factor: ");
  Serial.println(scale.calibration_factor);
}

float getTotalWeight() {
  float total = 0.0;
  total += readScale(scale1);
  // total += readScale(scale2);
  // total += readScale(scale3);
  return total;
}

void updateGlobalWeight() {
  GLOBAL_WEIGHT = getTotalWeight();
  if (GLOBAL_WEIGHT < 0) {
    GLOBAL_WEIGHT = 0;
  }
}

// --------- ESP-NOW ----------
void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
    if (status == ESP_NOW_SEND_SUCCESS) {
        Serial.println("Delivery success");
    } else {
        Serial.println("Delivery failed");
    }
}

void sendWeightUpdate(float currentWeight) {
   if (!isTransmiting) return;

   StaticJsonDocument<128> doc;
   doc["device_id"] = DEVICE_ID;
   doc["current_weight"] = currentWeight;

   char jsonBuffer[128];
   size_t len = serializeJson(doc, jsonBuffer);

   esp_err_t result = esp_now_send(receiverMac, (uint8_t *)jsonBuffer, len);

   if (result == ESP_OK) {
     Serial.print("Sent data: ");
     Serial.println(jsonBuffer);
   } else {
     Serial.print("Error sending data: ");
     Serial.println(result);
   }
}

void displayStartupMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Weight Scale");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);
  lcd.clear();
}

void displayWeightWithLabelGrams(String label, float grams) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(label);
  lcd.setCursor(0, 1);
  lcd.print(grams, 1);
  lcd.print(" g");
}

void displayWeightWithLabelOz(String label, float oz) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(label);
  lcd.setCursor(0, 1);
  lcd.print(oz, 1);
  lcd.print(" oz");
}

void onDataFromGateway(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  char msg[128];
  if (len >= (int)sizeof(msg)) return;
  memcpy(msg, incomingData, len);
  msg[len] = '\0';

  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, msg) != DeserializationError::Ok) {
    Serial.println("[NODE] JSON parse failed");
    return;
  }

  const char* mode = doc["unit_mode"] | "g";
  Serial.print("[NODE] Got unit_mode from gateway: ");
  Serial.println(mode);

  // Update the display mode based on received command
  if (strcmp(mode, "g") == 0) {
    grams = true;
  } else if (strcmp(mode, "oz") == 0) {
    grams = false;
  }
  
  // Immediately update the display with current weight
  if (grams) {
    displayWeightWithLabelGrams("Weight (g)", GLOBAL_WEIGHT);
  } else {
    displayWeightWithLabelOz("Weight (oz)", gramsToOz(GLOBAL_WEIGHT));
  }
}

// -------- IMPROVED BUTTON FUNCTION --------
void checkButton() {
  //Serial.println("Checking Button");
  int currentReading = digitalRead(buttonPin);

  // If button is pressed (HIGH with INPUT_PULLUP means pressed)
  if (currentReading == HIGH) {
    Serial.println("Button Pressed!");

    // Toggle transmission state
    isTransmiting = !isTransmiting;

    Serial.print("Transmission: ");
    Serial.println(isTransmiting ? "ON" : "OFF");

    // Show status on LCD temporarily
    //lcd.clear();
    //lcd.setCursor(0, 0);
    //lcd.print("Transmit:");
    //lcd.setCursor(0, 1);
    //lcd.print(isTransmiting ? "ON" : "OFF");
    delay(1000);

    // Force display update after button press
    if (grams) {
      displayWeightWithLabelGrams("Weight (g)", GLOBAL_WEIGHT);
    } else {
      displayWeightWithLabelOz("Weight (oz)", gramsToOz(GLOBAL_WEIGHT));
    }
  }
 
}


void setup() {
  Serial.begin(115200);
  delay(1000);

  setupScales();

  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  displayStartupMessage();
  tareScale(scale1);

  // ------- BUTTON SETUP -------
  pinMode(buttonPin, INPUT_PULLUP);
  Serial.println("Button initialized on PIN 13");
  
  // -------- WiFi + ESP-NOW --------
  WiFi.mode(WIFI_STA);   // required before changing channel
  const uint8_t WIFI_CHANNEL = 11;  // <-- MUST match gateway WiFi.channel()
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
  Serial.println("WiFi set to STA mode");
  
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  esp_now_register_send_cb(onDataSent);
  esp_now_register_recv_cb(onDataFromGateway);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, receiverMac, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  Serial.println("Setup complete!");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check button every loop iteration
  checkButton();
  
  // Update weight display every second
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    updateGlobalWeight();
    float weight = GLOBAL_WEIGHT;

    Serial.print("Weight: ");
    Serial.print(weight, 2);
    Serial.println(" g");

    // Update display
    if (grams) {
      displayWeightWithLabelGrams("Weight (g)", weight);
    } else {
      displayWeightWithLabelOz("Weight (oz)", gramsToOz(weight));
    }
    
    // Send weight update if container is on scale
    if (weight < 4) {
      Serial.println("Container Removed");
    } else {
      // Only send if transmission is enabled
      if(isTransmiting){
        Serial.println("Transmiting");
        sendWeightUpdate(weight);
      }
      else{
        Serial.println("Not Transmiting");
      }
      
  
    }
  }
}