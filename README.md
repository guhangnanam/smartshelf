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


## 🏗️ System Architecture

