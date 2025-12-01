# Smart Shelf – IoT Inventory & Nutrition Tracking System

Smart Shelf is an IoT-powered pantry monitoring system that tracks the weight of food containers in real time, logs inventory changes, and provides nutritional insights such as calorie consumption, macros, and restock alerts. The system integrates **ESP32 nodes**, **Firebase Realtime Database**, **Supabase (PostgreSQL)**, and a **React frontend** to deliver a seamless smart-kitchen experience.

---

## 🚀 Features

### **IoT Hardware (ESP32)**
- Reads container weight via load cells & HX711 modules  
- Pushes live data (weights, LED states, switch values, etc.) to Firebase RTDB  
- Supports multiple ESP32 nodes (one per shelf or group)  
- Remote control of LEDs, servos, and peripherals through the cloud  

### **Backend / Cloud**
- **Firebase Realtime Database** for live sensor streams  
- **Supabase PostgreSQL** for persistent container, shelf, and food metadata  
- Row Level Security (RLS) for user-scoped access  
- Insert/update APIs for adding and editing containers and foods  

### **Frontend (React + Supabase Auth)**
- Secure login & session handling  
- Dashboard showing:
  - Containers  
  - Associated shelf items  
  - Real-time weight updates  
- Add Food modal  
- Add Container modal  
- Edit Food modal  
- Feedback modal  
- Automatic linking of containers → devices  

### **Planned Features**
- Calorie tracking page  
- Macro tracking by day  
- Low-stock notifications  
- Mobile UX redesign  
- Container setup wizard  

---
## 🏗️ System Architecture


Two-database model:
- **Firebase RTDB:** real-time sensor events (weight, LED states, switch, servo angle)  
- **Supabase:** structured, persistent storage for foods & containers  

---

## 📦 Database Structure

### **Supabase Tables**

#### `containers`
| Column         | Type | Description |
|----------------|------|-------------|
| id             | uuid | Primary Key |
| name           | text | Label for the container |
| max_weight     | float | Weight when full |
| tare_weight    | float | Weight when empty |
| deviceId       | uuid | ESP32 device this container belongs to |
| user_id        | uuid | Foreign key → auth.users |

#### `shelf_items`
| Column               | Type | Description |
|----------------------|------|-------------|
| id                   | uuid | Primary Key |
| container_id         | uuid | Foreign key → containers |
| name                 | text | Food name |
| calories_per_serving | float | Calories per serving |
| protein              | float | Protein (g) |
| carbs                | float | Carbs (g) |
| fats                 | float | Fats (g) |
| serving_size         | float | Grams per serving |
| created_at           | timestamp | Insert timestamp |

---

## 🔌 Firebase RTDB Structure

/Sensor/
LED1: 0/1
LED2: 0/1
switch: true/false
currentWeight: float
voltage: float
angle: int


---

## 🛠️ Tech Stack

### **Frontend**
- React  
- Supabase Auth  
- Context API  
- Custom modal components  
- Tailored CSS  

### **Backend / Databases**
- Supabase (PostgreSQL)  
- Firebase Realtime Database  
- Row Level Security policies  

### **Hardware**
- ESP32  
- HX711 load cell amplifier  
- Load cells  
- Servo motors  
- LEDs, push buttons  

---

## ▶️ Running the Project Locally

### **1. Clone the repository**
```bash
git clone <your-repo-url>
cd smart-shelf

### **2. Install dependencies**
npm install

### **3. Add environment variables**
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key

REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_DATABASE_URL=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

### **4. Start Development server**
npm start

### **5. Connect your ESP32 Devices**
Flash each ESP32 with your firmware so it:

Connects to WiFi

Sends weight/LED/servo/switch data to Firebase

Listens for state updates

## 🧪 Testing Checklist

- [x] Add Container works  
- [x] Add Food works  
- [x] Edit Food works  
- [x] Real-time weight updates correctly  
- [x] Modals open/close and reset state properly  
- [x] RLS allows correct user-scoped inserts/updates  
- [x] Login/logout works as expected  
- [x] Firebase sensor updates appear in the dashboard  
- [x] No console or network errors during normal usage  

---

## 📝 Future Improvements

- Historical usage graphs for each container  
- Daily calorie and macro consumption tracking  
- Automatic grocery list generation based on weight trends  
- Predictive consumption estimation using ML  
- Native mobile app (iOS/Android)  
- OTA firmware updates for ESP32 devices  
- Additional UI/UX refinements for mobile and desktop  


