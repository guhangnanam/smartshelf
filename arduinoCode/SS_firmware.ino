#include "HX711.h"

#define MAX_WEIGHT 10000

#define DOUT_1 4
#define CLK_1 5

#define DOUT_2 26
#define CLK_2 27


// Global Weight Val
float GLOBAL_WEIGHT = 0;
// Scale objects 
HX711 scale_1, scale_2;

//calibrations for scales 1&2
float calibration_factor_1 = 426;
float calibration_factor_2 = 330.0;
//Raw reading with no weight for scales 1&2
long zero_offset_1 = 86255;
long zero_offset_2 = 85000;

// For non-blocking look
long interval = 500;  // Value for interval : 1x every 2 seconds 
long previousMillis = 0;


void updateWeight(float scale_weight_1, float scale_weight_2){
  //check for extreme values
  if(scale_weight_1 > MAX_WEIGHT){
    if(scale_weight_2 > MAX_WEIGHT){
      GLOBAL_WEIGHT = 0;
      return;
    }
    GLOBAL_WEIGHT = scale_weight_2;
    return;
  }
  if(scale_weight_2 > MAX_WEIGHT){
    if(scale_weight_1 > MAX_WEIGHT){
      GLOBAL_WEIGHT = 0;
      return;
    }
    GLOBAL_WEIGHT = scale_weight_1;
    return;
  }
  //average of two values
  GLOBAL_WEIGHT = -((scale_weight_1 + scale_weight_2) / 2);
}
void updateWeightone(float scale_weight_1){
  
  //average of two values
  GLOBAL_WEIGHT = -scale_weight_1;
}

void setupScales(){
  scale_1.begin(DOUT_1, CLK_1);
  scale_2.begin(DOUT_2, CLK_2);
}

void setup() {
  Serial.begin(115200);
  setupScales();
  
}

void loop() {

  unsigned long currentMillis = millis();
  // This block only runs if the interval has passed
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis; 
    //read sensors 1 and 2
    long reading_1 = scale_1.read_average(10);
    //long reading_2 = scale_2.read_average(10);
    //update undividual weight
    //Serial.println(reading_1);
    float weight_1 = (reading_1 + zero_offset_1) / calibration_factor_1;  // in grams
    Serial.println(reading_1 + zero_offset_1);
    //float weight_2 = (reading_2 - zero_offset_2) / calibration_factor_2;  // in grams
    //update gloabl weight 
    //updateWeight(weight_1, weight_2);
    updateWeightone(weight_1);
    Serial.print("Weight: ");
    Serial.print(GLOBAL_WEIGHT, 2);
    Serial.println(" g");
    //do stuff 1 per 2 seconds
  }



  
  
}
