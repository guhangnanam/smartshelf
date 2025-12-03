#include <WiFi.h>
#include <esp_now.h>
#include <ArduinoJson.h>
#include "HX711.h"
#include <Wire.h>
#include <WiFiClientSecure.h>
#include <LiquidCrystal_I2C.h>

// ---------------- CONFIG ----------------
const char* DEVICE_ID = "ShelfESP32_1";
uint8_t receiverMac[] = {0xAC, 0x15, 0x18, 0xF2, 0x7C, 0x70};

#define MAX_WEIGHT 10000
#define SDA_PIN 21
#define SCL_PIN 22
#define GRAMS_TO_OZ 28.35

bool grams = true;
bool isTransmiting = true;

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

// --------- ESP-NOW (DISABLED) ----------
void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
    // Optional: You can still access the destination MAC this way:
    // const uint8_t* mac = info->dest_addr;

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

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupScales();

  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  displayStartupMessage();

  // -------- WiFi + ESP-NOW DISABLED --------
   WiFi.mode(WIFI_STA);
   Serial.println("WiFi set to STA mode");
  
   if (esp_now_init() != ESP_OK) {
     Serial.println("Error initializing ESP-NOW");
     return;
   }

   esp_now_register_send_cb(onDataSent);

   esp_now_peer_info_t peerInfo = {};
   memcpy(peerInfo.peer_addr, receiverMac, 6);
   peerInfo.channel = 0;
   peerInfo.encrypt = false;

   if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
   return;
   }

  // Serial.println("ESP-NOW setup complete.");
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    updateGlobalWeight();
    float weight = GLOBAL_WEIGHT;


   // Serial.println("Calibrating");
   // calibrateScale(scale1, 50);


    Serial.print("Weight: ");
    Serial.print(weight, 2);
    Serial.println(" g");

    if (grams) {
      displayWeightWithLabelGrams("Weight (g)", weight);
    } else {
      displayWeightWithLabelOz("Weight (oz)", gramsToOz(weight));
    }
    
    if(weight < 4){
          Serial.println("Container Removed");
    }
    else{
      // Dont send if reading is below 4grams (Container was likely removed)
       sendWeightUpdate(weight);
    }
  
  }
}
