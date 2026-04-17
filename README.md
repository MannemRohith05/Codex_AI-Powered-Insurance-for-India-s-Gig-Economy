# 🛡️ GigShield — Parametric Income Protection for India's Gig Economy

> *"What if a delivery partner could earn even when they can't work?"*

GigShield is an AI-powered parametric insurance platform that protects India's gig workers — delivery riders, street vendors, and daily-wage earners — from income loss triggered by weather disruptions like heavy rain, floods, heatwaves, and hazardous air quality.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://gig-shield-ten.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://gigshield.onrender.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-ISC-blue)](./package.json)

---

## 🔗 Live Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| 🌐 Frontend | Vercel | [gig-shield-ten.vercel.app](https://gig-shield-ten.vercel.app) |
| 🖥️ Backend API | Render | [gigshield.onrender.com](https://gigshield.onrender.com) |
| 🗄️ Database | MongoDB Atlas | (private) |

---

## 👥 Team Codex

| Name | Role |
|------|------|
| **M Rohith** | Team Lead & Full-Stack Architect |
| **Srividya** | Backend & AI Engine |
| **Shruthi** | Frontend & UX |
| **Harsha** | Data, Business Model & DevOps |

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [AI/ML Architecture](#-aiml-architecture)
- [System Architecture](#-system-architecture)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
- [Parametric Triggers](#-parametric-triggers)
- [Insurance Coverage Design](#-insurance-coverage-design)
- [Financial Viability](#-financial-viability)
- [Environment Variables](#️-environment-variables)
- [Risk Register](#️-risk-register)

---

## 🎯 Problem Statement

India's gig economy employs over **15 crore workers** — delivery riders on Swiggy, Zomato, Zepto, Amazon, and informal daily-wage earners. Their income is highly unpredictable.

**External disruptions such as:**
- ⛈️ Heavy rainfall and cyclones
- 🌡️ Extreme heat waves (>40°C)
- 🌫️ Hazardous air quality (AQI > 300)
- 🌊 Urban flooding

...directly prevent workers from completing their shifts, causing **20–30% monthly income loss** with zero financial safety net available today.

### Persona: Ravi (Delivery Partner, Vijayawada)
- Daily earnings: ₹800–₹1,000
- Income entirely depends on completed deliveries + order incentives
- During a 3-day rain event: loses ₹2,500–₹3,000 with no recourse
- Cannot cover rent, fuel, or food during extended disruptions

---

## 💡 Solution Overview

GigShield provides **weekly parametric insurance** — no paperwork, no subjective claim assessment, no waiting. When a qualifying weather condition is detected in a worker's registered zone, the claim is **automatically evaluated and paid out within 24 hours**.

```
Worker registers → Risk is scored by AI → Premium assigned (₹15–₹40/week)
       ↓
Disruption occurs → Weather API detects trigger → Claim auto-evaluated
       ↓
Fraud/Anomaly models check the claim → AUTO_APPROVE or MANUAL_REVIEW
       ↓
UPI payout credited within T+1 business day
```

---

## ✨ Features

### 👷 Worker Portal
- **Registration & KYC** — Phone OTP (Twilio) + Aadhaar verification (Sandbox API)
- **AI Risk Scoring** — XGBoost-simulated risk score computed at registration and updated weekly
- **Policy Purchase** — Buy weekly coverage in one click; UPI mandate for auto-renewal
- **Submit Claims** — Real-time claim form with GPS location, photo evidence upload
- **Zero-Touch Claims** — SSE-streamed live pipeline showing fraud → AI → payout steps
- **Dynamic Premium Dashboard** — Live risk score, weather conditions, claim history
- **Activity Log** — Full audit trail of policy events and payouts

### 🛡️ Admin Dashboard
- **Live Platform Overview** — Total enrolled workers, active policies, pending claims, revenue
- **Claims Management Table** — Approve, reject, or escalate claims with audit trails
- **Fraud Detection Panel** — Real-time fraud risk heatmap and anomaly logs
- **Worker Management** — Search, filter, view worker profiles and claim history
- **Disruption Event Manager** — Create and manage weather disruption events per pin zone
- **Actuarial Health Monitor** — Live loss ratio gauges, reserve status, and sustainability alerts
- **Demo Panel** — Trigger full claim pipeline in seconds for hackathon demos

### 🤖 AI Engine
- **XGBoost-simulated Risk Scoring** — 8-feature risk model per worker per week
- **LightGBM-simulated Fraud Classification** — Binary fraud/legitimate claim classifier
- **Isolation Forest Anomaly Detection** — Unsupervised detection of novel fraud patterns
- **Parametric Trigger Engine** — Automated zone-level weather correlation
- **Actuarial Sustainability Engine** — Real-time loss ratio and reserve monitoring

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/gigshield.git
cd gigshield
```

### 2. Install all dependencies

```bash
npm run install-all
```

This installs dependencies for the root workspace, `/client`, and `/server` in one command.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials. See [Environment Variables](#️-environment-variables) for details.

> **🚨 Hackathon Judges:** Download the pre-configured `.env` with all live API keys from  
> 👉 [Google Drive](https://drive.google.com/file/d/1nUZw3ACYa2UoLba6hwHUTHAn3AAzMAcH/view?usp=sharing)  
> Place it in the project root as `gigshield/.env` before running.

### 4. Seed the database

```bash
npm run seed
```

This creates demo worker accounts, admin accounts, sample policies, claims, and weather events.

**Default seeded accounts:**

| Role | Phone / Email | Password |
|------|---------------|----------|
| Admin | `admin@gigshield.in` | `admin123` |
| Worker | `+91 9999999901` | (OTP: `123456` in dev mode) |

### 5. Start the development servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| 🖥️ Backend API | http://localhost:5000 |

---

## 📁 Project Structure

```
gigshield/
├── client/                     # React frontend (Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth context (JWT management)
│   │   ├── layouts/            # Page layout wrappers
│   │   ├── pages/
│   │   │   ├── admin/          # Admin portal pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── ClaimsTable.jsx
│   │   │   │   ├── DemoPanel.jsx
│   │   │   │   ├── DisruptionForm.jsx
│   │   │   │   ├── FraudPanel.jsx
│   │   │   │   └── WorkerManagement.jsx
│   │   │   ├── worker/         # Worker portal pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── BuyPolicy.jsx
│   │   │   │   ├── SubmitClaim.jsx
│   │   │   │   ├── ZeroTouchClaims.jsx
│   │   │   │   ├── DynamicPremium.jsx
│   │   │   │   ├── ClaimHistory.jsx
│   │   │   │   ├── ActivityLog.jsx
│   │   │   │   ├── KYC.jsx
│   │   │   │   └── VerifyOTP.jsx
│   │   │   └── platform/       # Platform partner portal
│   │   └── utils/              # Axios instance, helper functions
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # Node.js + Express backend
│   ├── config/                 # Database & app config
│   ├── controllers/            # Route handler logic
│   │   ├── adminController.js
│   │   ├── claimController.js
│   │   ├── demoController.js
│   │   ├── platformController.js
│   │   ├── policyController.js
│   │   ├── weatherController.js
│   │   └── workerController.js
│   ├── cron/                   # Scheduled background jobs (weather poller)
│   ├── middleware/             # Auth (JWT), rate limiter, error handler
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── seeds/                  # Database seed script
│   ├── services/               # Business logic & external integrations
│   │   ├── aiEngine.js         # XGBoost + LightGBM + IsoForest simulation
│   │   ├── fraudDetection.js   # GPS spoof + weather validation
│   │   ├── actuarialHealth.js  # Loss ratio & reserve monitoring
│   │   ├── zoneData.js         # 50+ 6-digit PIN zone risk data
│   │   ├── weather.js          # OpenWeatherMap integration
│   │   ├── razorpay.js         # Payment & payout integration
│   │   ├── twilio.js           # OTP SMS service
│   │   └── sandbox.js          # Aadhaar KYC service
│   └── server.js               # Express app entry point
│
├── docs/                       # Project documentation
│   ├── architecture_diagram.md
│   ├── business_model.md
│   └── pitch_deck.md
│
├── docker-compose.yml          # Docker setup
├── Dockerfile
├── render.yaml                 # Render deployment config
├── package.json                # Root workspace scripts
└── .env.example                # Environment variables template
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite | SPA framework |
| **Styling** | TailwindCSS 4 | Utility-first CSS |
| **Charts** | Recharts | Dashboard analytics |
| **Maps** | @react-google-maps/api | Location display |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MongoDB Atlas + Mongoose | Document store |
| **Auth** | JWT + bcryptjs | Stateless auth |
| **OTP** | Twilio SMS | Phone verification |
| **KYC** | Sandbox.co.in | Aadhaar verification |
| **Payments** | Razorpay | Premium orders + UPI payouts |
| **Weather** | OpenWeatherMap API | Live zone weather data |
| **AI Engine** | Node.js (ML simulation) | XGBoost / LightGBM / IsoForest |
| **Scheduling** | node-cron | Automated weather polling |
| **Security** | Helmet + express-rate-limit | HTTP hardening |
| **Hosting (FE)** | Vercel | CDN-hosted React SPA |
| **Hosting (BE)** | Render | Managed Node.js server |
| **DevOps** | Docker + GitHub Actions | Containerization + CI/CD |

---

## 🧠 AI/ML Architecture

GigShield's intelligence layer runs three complementary models for risk assessment, fraud detection, and anomaly detection. In this MVP, all models are implemented as **high-fidelity Node.js simulations** using the exact feature vectors, scoring logic, and decision thresholds that the production XGBoost / LightGBM / Isolation Forest models would compute.

### Model 1 — Risk Scoring (XGBoost Regressor)

**Purpose:** Compute a continuous risk score (0–100) per worker per week to determine their premium tier.

| Feature | Source | Rationale |
|---------|--------|-----------|
| `avg_rainfall_7d_mm` | Weather API | Primary parametric trigger variable |
| `max_temp_7d_c` | Weather API | High heat reduces delivery capacity |
| `avg_aqi_7d` | CPCB / Open-Meteo | High AQI causes work stoppage |
| `city_flood_index` | Static lookup (IMD data) | Zone historical disaster frequency |
| `platform_type` | User registration | 2-wheelers more exposed than 4W vehicles |
| `declared_weekly_income_inr` | User registration | Higher income → higher payout exposure |
| `months_active_on_platform` | Self-declared | Newer workers = higher uncertainty |
| `active_hours_last_4_weeks` | Activity logs | Low engagement = ghost account risk |

**Output → Premium Tier:**

| Score | Tier | Weekly Premium | Max Coverage |
|-------|------|---------------|--------------|
| 0–40 | LOW | ₹15/week | ₹3,000 |
| 41–70 | MEDIUM | ₹25/week | ₹7,500 |
| 71–100 | HIGH | ₹40/week | ₹15,000 |

---

### Model 2 — Fraud Detection (LightGBM Classifier)

**Purpose:** Binary classification — `Legitimate Claim (0)` vs. `Fraudulent Claim (1)`.

| Feature | Fraud Signal |
|---------|-------------|
| `device_id_seen_before` | Same device used across multiple accounts |
| `claim_frequency_30d` | >3 claims/month without weather events |
| `gps_zone_vs_registered_zone` | Submitting from a different zone |
| `weather_event_confirmed` | No qualifying weather event in zone |
| `time_since_enrollment_days` | Claims within 7-day waiting period |
| `income_declared_vs_payout_ratio` | Payout > 100% of declared income |
| `photo_evidence_submitted` | No supporting photo attached |

**Decision Gate:**

```
Fraud Score < 0.3  AND  No Anomaly Flag  →  AUTO_APPROVE → UPI Payout
Fraud Score > 0.3  OR   Anomaly Flagged  →  MANUAL_REVIEW (T+2 days)
```

---

### Model 3 — Anomaly Detection (Isolation Forest)

**Purpose:** Detect structurally unusual patterns not matching known fraud signatures.

| Feature | Anomaly Signal |
|---------|---------------|
| `premium_upgrades_per_month` | Sudden tier upgrades before a storm |
| `claim_ratio_vs_peer_zone` | Claiming 4× more than same-zone peers |
| `login_device_count_7d` | Multiple new device logins before claim |
| `working_hours_vs_claim_ratio` | Low activity but claims full-week loss |
| `zone_switch_frequency` | Frequent zone changes across policies |

---

### Claim Pipeline (End-to-End)

```
Worker submits claim
        │
        ▼
[Parametric Trigger Check]  ← Was a qualifying weather event active in zone?
  Rainfall > 50mm/day  |  Temp > 40°C  |  AQI > 300  |  Flood/Cyclone alert
        │
        ▼
[Fraud Detection Service]   ← GPS validation, claim frequency, evidence check
        │
        ▼
[AI Eligibility Engine]     ← XGBoost risk tier + LightGBM fraud score + IsoForest
        │
        ├── All Clear  →  AUTO_APPROVED  →  Razorpay UPI Payout (T+1)
        │
        └── Flagged    →  MANUAL_REVIEW queue  →  Admin decision (T+2)
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│               CLIENT LAYER                  │
│  React SPA (Vite) — Vercel CDN             │
│  Portals: Worker | Admin | Platform         │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / REST
                   ▼
┌─────────────────────────────────────────────┐
│            API GATEWAY (Express.js)         │
│  JWT Auth Middleware                        │
│  Rate Limiter (100 req/min/IP)             │
│  Helmet Security Headers                   │
└──────┬───────────────────────────┬──────────┘
       │                           │
       ▼                           ▼
┌─────────────┐           ┌────────────────────┐
│ Auth Service│           │  AI Rules Engine   │
│ /auth/*     │           │  /ai/risk-score    │
│ JWT + OTP   │           │  /ai/fraud-check   │
└──────┬──────┘           └────────┬───────────┘
       │                           │
       └──────────┬────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│              DATA LAYER                     │
│  MongoDB Atlas                              │
│  Collections: workers, policies, claims,    │
│  weatherevents, fraudlogs, disruptions      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          EXTERNAL INTEGRATIONS              │
│  OpenWeatherMap  →  Zone weather data       │
│  Twilio          →  OTP authentication      │
│  Razorpay        →  Premiums & UPI payouts  │
│  Sandbox.co.in   →  Aadhaar KYC            │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Data Models

### `workers` Collection

```jsonc
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string (E.164, unique)",
  "email": "string",
  "platform_id": "enum: [SWIGGY, ZOMATO, ZEPTO, AMAZON, PORTER, OTHER]",
  "city": "string",
  "zone_pin_code": "string (6-digit)",
  "declared_weekly_income_inr": "number",
  "risk_tier": "enum: [LOW, MEDIUM, HIGH]",
  "risk_score": "number (0–100)",
  "otp_verified": "boolean",
  "kyc_status": "enum: [PENDING, VERIFIED, FAILED]",
  "enrollment_date": "ISODate",
  "created_at": "ISODate"
}
```

### `policies` Collection

```jsonc
{
  "_id": "ObjectId",
  "worker_id": "ObjectId (ref: workers)",
  "premium_amount_inr": "number",
  "risk_tier": "enum: [LOW, MEDIUM, HIGH]",
  "status": "enum: [ACTIVE, LAPSED, CANCELLED]",
  "coverage_start_date": "ISODate",
  "waiting_period_end_date": "ISODate (start + 7 days)",
  "last_premium_paid_at": "ISODate",
  "auto_renew": "boolean",
  "razorpay_subscription_id": "string"
}
```

### `claims` Collection

```jsonc
{
  "_id": "ObjectId",
  "worker_id": "ObjectId (ref: workers)",
  "policy_id": "ObjectId (ref: policies)",
  "weather_event_id": "ObjectId (ref: weatherevents)",
  "claim_amount_inr": "number",
  "declared_income_loss_inr": "number",
  "ai_status": "enum: [AUTO_APPROVED, FLAGGED, REJECTED, MANUAL_REVIEW]",
  "fraud_score": "number (0.0–1.0)",
  "anomaly_score": "number",
  "gps_coordinates": "{ lat, lng }",
  "photo_evidence_url": "string",
  "razorpay_payout_id": "string",
  "settlement_date": "ISODate",
  "rejection_reason": "string"
}
```

### `weatherevents` Collection

```jsonc
{
  "_id": "ObjectId",
  "zone_pin_code": "string",
  "city": "string",
  "rainfall_mm_24h": "number",
  "temperature_c": "number",
  "aqi": "number",
  "flood_alert_active": "boolean",
  "cyclone_alert_active": "boolean",
  "parametric_trigger_met": "boolean",
  "data_source": "string",
  "recorded_at": "ISODate"
}
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/worker/register` | Register a new worker |
| `POST` | `/api/worker/send-otp` | Send OTP to phone |
| `POST` | `/api/worker/verify-otp` | Verify OTP + receive JWT |
| `POST` | `/api/admin/login` | Admin login (email + password) |

### Worker

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/worker/profile` | Get worker profile & risk score |
| `PUT` | `/api/worker/profile` | Update profile details |
| `GET` | `/api/worker/activity-log` | Get activity history |

### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/policy/buy` | Purchase a new policy |
| `GET` | `/api/policy/status` | Get active policy & coverage details |
| `POST` | `/api/policy/renew` | Manually renew a lapsed policy |

### Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/claim/submit` | Submit a disruption claim |
| `GET` | `/api/claim/history` | List claim history (worker) |
| `GET` | `/api/claim/stream/:claimId` | SSE stream of live claim pipeline |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/dashboard` | Platform-level analytics |
| `GET` | `/api/admin/claims` | All claims with filter/sort |
| `POST` | `/api/admin/claims/:id/approve` | Manually approve a claim |
| `POST` | `/api/admin/claims/:id/reject` | Manually reject a claim |
| `GET` | `/api/admin/workers` | Worker list with search |
| `GET` | `/api/admin/fraud-logs` | Fraud and anomaly event log |
| `GET` | `/api/admin/actuarial` | Actuarial health metrics |

### Demo

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/demo/trigger-claim` | Trigger a full demo claim flow |
| `GET` | `/api/demo/stream` | SSE stream of demo pipeline steps |

---

## 🌦️ Parametric Triggers

A claim is **auto-eligible** when at least one of the following conditions is confirmed in the worker's registered 6-digit PIN zone on the claim date:

| Trigger | Threshold | Data Source |
|---------|-----------|-------------|
| Heavy Rainfall | > 50mm in 24 hours | OpenWeatherMap API |
| Extreme Heat | > 40°C (daily maximum) | OpenWeatherMap API |
| Hazardous AQI | > 300 | CPCB / Open-Meteo API |
| Flood Alert | Active state-level NDRF/IDRN alert | India Disaster Resource Network |
| Cyclone Alert | Active IMD bulletin within 200km | IMD Public API |

The Weather Poller cron job fetches data every 30 minutes and writes events to the `weatherevents` collection.

---

## 📋 Insurance Coverage Design

### Premium Tiers (Weekly)

| Tier | Weekly Premium | Max Payout/Event | Cover Disruption |
|------|---------------|-----------------|-----------------|
| LOW | ₹15 | ₹3,000 | Street vendors, domestic workers |
| MEDIUM | ₹25 | ₹7,500 | Delivery riders (Swiggy/Zomato) |
| HIGH | ₹40 | ₹15,000 | Construction, cold chain logistics |

### Payout by Event Type

| Disruption | LOW Tier | MEDIUM Tier | HIGH Tier |
|------------|----------|-------------|-----------|
| Heavy Rain | ₹500 | ₹1,500 | ₹3,000 |
| Heatwave | ₹750 | ₹2,000 | ₹4,000 |
| Flood | ₹1,000 | ₹3,000 | ₹6,000 |
| Poor AQI | ₹500 | ₹1,000 | ₹2,000 |

### Policy Terms

| Term | Detail |
|------|--------|
| **Waiting Period** | 7 calendar days from enrollment. No claims during this window. |
| **Monthly Claim Cap** | Maximum 2 approved claims per worker per calendar month. |
| **Minimum Loss Threshold** | ₹300 minimum income loss to be eligible. |
| **Auto-Renewal** | Policy auto-renews weekly via UPI AutoPay mandate. |
| **Grace Period** | 3 days after failed premium payment before policy lapses. |
| **Settlement SLA** | Auto-approved: T+1 business day. Flagged: T+2 business days. |

### Standard Exclusions

| Exclusion | Description |
|-----------|-------------|
| Pre-existing conditions | Medical issues predating enrollment |
| Pandemics & epidemics | Officially declared public health emergencies |
| Government lockdowns | Non-weather state or central lockdowns |
| Strikes & platform shutdowns | Labour disputes, app downtime, policy changes |
| War & civil unrest | Armed conflict, riots, terrorism |
| Willful negligence | Deliberate avoidance of work |
| Platform commission changes | Revenue drops due to platform policy changes |
| Non-parametric loss | Income drops without a confirmed weather trigger |
| Fraudulent misrepresentation | False income, zone, or activity data at enrollment |

---

## 💰 Financial Viability

> ⚠️ *All values are illustrative assumptions for the MVP model and do not represent audited actuarial data.*

### Actuarial Sustainability Model

| Metric | Value |
|--------|-------|
| Gross premium (1,000 workers × ₹25/week) | ₹1,00,000/month |
| Expected claim rate | 3 events/month |
| Average payout | ₹1,500/claim |
| **Projected loss ratio** | **~0.045** |
| IRDAI maximum loss ratio | 0.70 |
| Reserve contribution (15%) | ₹15,000/month |
| Breakeven user base | ~10,000 workers |

### Actuarial Health Zones

| Status | Loss Ratio | Action |
|--------|-----------|--------|
| 🟢 GREEN | < 0.70 | No adjustment needed |
| 🟡 AMBER | 0.70 – 0.90 | +10% stress loading on new policies |
| 🔴 RED | > 0.90 | +25% emergency surcharge; pause new issuance |

### Revenue Streams

1. **Weekly premiums** — Primary revenue from enrolled workers
2. **Platform SaaS fee** — ₹2,000/month per partner platform
3. **Per-worker analytics** — ₹5/worker/month to platform companies
4. **Reinsurance (scale)** — Quota-share treaty with GIC Re / Munich Re India above catastrophic thresholds

### Regulatory Strategy

- MVP operates as an **InsurTech distribution partner** under an IRDAI-registered micro-insurance company
- Compliant with IRDAI Micro-Insurance Regulations (2005)
- IRDAI Sandbox applicant (InsurTech Innovation License)
- KYC via Aadhaar OTP (Sandbox.co.in); DigiLocker integration planned

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/gigshield

# JWT
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173

# Twilio (OTP — logs to console in dev if not set)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenWeatherMap (weather poller)
OPENWEATHERMAP_API_KEY=your_owm_api_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Aadhaar KYC (Sandbox.co.in)
SANDBOX_API_KEY=your_sandbox_key
SANDBOX_API_SECRET=your_sandbox_secret

# Razorpay (mock mode if not set)
RAZORPAY_KEY_ID=your_rzp_key_id
RAZORPAY_KEY_SECRET=your_rzp_key_secret
RAZORPAY_PAYOUT_ACCOUNT=your_rzp_account_number

# Redis (optional — app works without it)
REDIS_URL=redis://localhost:6379
```

> The app starts successfully in development mode **without** Twilio, Razorpay, or Sandbox keys. OTPs are logged to the console, and payments are mocked.

---

## 🐳 Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d
```

The `docker-compose.yml` starts the backend API. Set your environment variables in `.env` before running.

---

## ⚠️ Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| 1 | GPS spoofing at scale | Medium | High | Geo-velocity checks + device ID binding + partner GPS cross-ref |
| 2 | Weather API downtime | Low | High | Fallback to Open-Meteo historical averages + 3h cache TTL |
| 3 | Low user adoption / premium friction | High | High | Freemium first week; platform-subsidized premiums; UPI AutoPay |
| 4 | IRDAI regulatory changes | Medium | High | Licensed insurer partner model; IRDAI sandbox application |
| 5 | AI model drift post-monsoon | Medium | Medium | PSI drift detection; monthly retraining; human review queue |
| 6 | Razorpay payout failures | Low | High | Retry logic with exponential backoff; manual admin override |

---

## 📚 Documentation

Additional technical documentation is available in the `/docs` directory:

- [`docs/architecture_diagram.md`](./docs/architecture_diagram.md) — Full system and data flow Mermaid diagrams
- [`docs/business_model.md`](./docs/business_model.md) — Premium economics and go-to-market strategy
- [`docs/pitch_deck.md`](./docs/pitch_deck.md) — Hackathon pitch deck content

---

## 📄 License

ISC License — see [package.json](./package.json).

---

<div align="center">

**Built with ❤️ for India's gig workers — Team Codex**

*GigShield — Protecting the people who keep India moving.*

</div>
