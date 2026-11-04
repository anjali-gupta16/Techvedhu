# SmartWatt AI ⚡
### Full-Stack AI Smart Home Energy Monitoring & Prediction System

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.5+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

SmartWatt AI is an end-to-end full-stack smart home energy monitoring, anomaly detection, and machine learning prediction platform.

> **IMPORTANT PROJECT CONSTRAINT / NOTICE:**
> **No physical IoT hardware (ESP32, Arduino, CT clamps) is required.**
> The system features a built-in Python-powered **Virtual Smart Meter Simulation Engine** that models realistic 8-appliance wattage curves, ambient weather patterns, and time-of-day peak/off-peak consumption. All readings are clearly identified as simulated data throughout the UI and database.

---

## Architecture Monorepo Overview

```
SmartWatt-AI/
│
├── frontend/                     # Next.js 15 + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── app/                  # 9 App Router pages (Dashboard, Live, Appliances, etc.)
│   │   ├── components/           # Reusable metric cards, gauges, charts, sidebars
│   │   ├── services/             # Axios API client with JWT interceptor
│   │   └── types/                # TypeScript interfaces
│   └── package.json
│
├── backend/                      # Python FastAPI + SQLAlchemy + Scikit-Learn
│   ├── app/
│   │   ├── api/                  # REST endpoints (auth, dashboard, simulation, etc.)
│   │   ├── core/                 # App configuration & JWT security
│   │   ├── database/             # SQLAlchemy connection, models & seeder
│   │   ├── models/               # Database tables (Users, Homes, Appliances, Readings...)
│   │   ├── schemas/              # Pydantic request/response validators
│   │   ├── simulation/           # Virtual smart meter engine & 8 appliance profiles
│   │   ├── ml/                   # Random Forest regressor & Isolation Forest anomaly detector
│   │   └── main.py               # Main application entry point & WebSocket server
│   ├── datasets/                 # 180-day simulated historical smart meter dataset
│   ├── trained_models/           # Serialized Joblib model artifact & metrics JSON
│   ├── requirements.txt
│   └── train_model.py            # ML pipeline training script
│
├── start.bat                     # One-click Windows runner
├── README.md
└── .gitignore
```

---

## Monitored Appliances

1. **Air Conditioner** (1,800W) - Diurnal heat curve and peak evening profile
2. **Refrigerator** (180W) - Compressor cycling duty cycle (~35% of time)
3. **Television** (120W) - Morning news and evening prime-time entertainment
4. **Washing Machine** (850W) - Motor and heating load cycles
5. **Lights** (90W) - Ambient sunrise/sunset lighting schedule
6. **Water Heater** (2,200W) - Morning bathing peak (6-9 AM)
7. **Microwave** (1,100W) - Meal preparation power bursts
8. **Computer** (240W) - Day-long workstation active load and standby

---

## Machine Learning & AI Pipeline

- **Forecasting Algorithm:** `RandomForestRegressor(n_estimators=100)`
- **Feature Engineering:** Cyclical time (sin/cos of hour and month), temperature profile, lag features (1h, 24h, 168h), and 24-hour rolling window statistics.
- **Evaluation Metrics:**
  - Mean Absolute Error (MAE): `0.9547 kWh`
  - Root Mean Squared Error (RMSE): `1.1640 kWh`
  - R² Score: `0.1642`
- **Empirical Confidence Bounds:** Derived from inter-tree prediction standard error ($\sigma$) across all 100 decision trees in the ensemble ($\hat{y} \pm 1.645\sigma$).
- **Anomaly Detection:** `IsolationForest(contamination=0.04)` flags unexpected night draws, dangerous over-capacity loads, and phantom standby leaks.

---

## Quick Start (Windows)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup

```powershell
# Open terminal in backend
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Re-train the Random Forest model
python train_model.py

# Seed database with demo user, 8 appliances, and historical readings
python -m app.database.seed

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The Swagger Interactive Documentation will be available at: **`http://localhost:8000/docs`**

### 3. Frontend Setup

```powershell
# Open terminal in frontend
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open your browser to: **`http://localhost:3000`**

### 4. Default Demo Credentials
- **Email:** `demo@smartwatt.ai`
- **Password:** `password123`
*(Or click "Create an Account" to register a new user profile)*

---

## Features Walkthrough

1. **Overview Dashboard (`/dashboard`)**: 6 KPI cards (Today's kWh, Monthly kWh, AI Forecast, Estimated Bill, Efficiency Score, Active Devices), Recharts power curve, appliance distribution pie, and environmental impact.
2. **Live Monitoring (`/monitoring`)**: Real-time virtual smart meter telemetry hub streaming instantaneous power (Watts) and temperature over WebSockets with 1x-10x speed controls.
3. **Appliance Management (`/appliances`)**: Full CRUD to add, edit rated power, delete, and toggle simulated states of appliances.
4. **AI Predictions (`/predictions`)**: Next-day 24h hourly forecast with empirical error bands, 7-day forecast bars, and ML evaluation metrics.
5. **Energy Analytics (`/analytics`)**: Multi-horizon historical trends (24h, 7d, 30d), peak vs off-peak disaggregation.
6. **Smart Recommendations (`/recommendations`)**: Prioritized suggestions with calculated ₹ and kWh savings based on configured tariff.
7. **Reports & Exports (`/reports`)**: Daily, weekly, and monthly audited line-item breakdowns with one-click **CSV** and **PDF** downloads.
8. **Settings (`/settings`)**: Configurable electricity tariff (default: ₹8/kWh) and grid emission factor (0.82 kg CO₂/kWh).

