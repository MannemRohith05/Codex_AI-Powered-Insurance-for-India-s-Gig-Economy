# 🛡️ GigShield — Income Protection for Gig Workers

> "What if a delivery partner could earn even when they can't work?"
> Protecting India's gig workers from income loss caused by weather, uncertainty, and real-world disruptions.

---

## 🚀 Quick Start (One-command setup)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd gigshield

# 2. Install ALL dependencies (root + client + server)
npm run install-all

# 3. Setup environment variables
cp .env.example .env
# → Edit .env and set your database connection

# 4. Seed the database with demo data
npm run seed

# 5. Start both servers
npm run dev
```

> **Frontend** runs at → `http://localhost:5173`
> **Backend API** runs at → `http://localhost:5000`

---

## Team Codex

**M Rohith** — Team Lead
**Srividya**
**Shruthi**
**Harsha**

---

## Problem Statement

India's gig economy is growing rapidly. Delivery partners working with platforms like Swiggy, Zomato, Zepto, Amazon, and others are essential to daily life. However, their income is highly unpredictable.

**External factors such as:**
- Heavy rainfall
- Extreme heat
- Pollution
- Floods

directly impact their ability to work. In many cases, workers lose around 20–30% of their income, and currently, there is no proper financial protection system available.

---

## User Persona & Scenario

**Persona: Ravi (Delivery Partner)**
- Ravi works full-time in Vijayawada.
- Daily earnings: ₹800–₹1000
- Income depends on completed deliveries
- During bad weather:
  - Works fewer hours
  - Gets fewer orders
  - Income drops significantly

*Even a few bad days affect his ability to manage rent, food, and fuel expenses.*

---

## Solution

We are building a web-based AI-powered insurance platform that provides weekly income protection for gig workers.

**The system:**
- Predicts risk using machine learning models
- Monitors real-world conditions via live weather APIs
- Provides fair, parametric compensation triggered automatically

---

## How It Works

**User Registration**
- Work zone (city + pin code)
- Delivery platform (Swiggy, Zomato, etc.)
- Average weekly income declared

**Risk Scoring**
- Weather conditions in declared zone
- Location vulnerability index (historical flood/heat frequency)
- Work activity patterns

**Premium Calculation**
- Low Risk → ₹15/week
- Medium Risk → ₹25/week
- High Risk → ₹40/week

**Claim Process**
1. Parametric trigger condition is met (weather threshold crossed)
2. System auto-evaluates eligibility
3. Fraud/anomaly model clears or flags the claim
4. Claim approved or escalated for manual review

---

## 🧠 AI/ML Strategy — Technical Depth

### Model 1: Risk Scoring — XGBoost Regressor

**Purpose:** Compute a continuous numeric risk score (0–100) per worker per week that determines their premium tier.

**Algorithm:** XGBoost Gradient Boosted Trees (regression mode)
**Why XGBoost:** Handles tabular data with mixed types (numeric + categorical), naturally captures non-linear feature interactions (e.g., high rainfall × coastal zone), supports sparse inputs when GPS or historical data is missing, and is production-ready with fast inference.

**Input Features (per worker, per week):**

| Feature | Source | Rationale |
|---|---|---|
| `avg_rainfall_7d_mm` | Weather API (zone-level) | Primary parametric trigger variable |
| `max_temp_7d_c` | Weather API | High heat reduces delivery capacity |
| `avg_aqi_7d` | CPCB / Open-Meteo API | High AQI causes health-related work stoppage |
| `city_flood_index` | Static lookup table (historical IMD data) | Zone-level historical disaster frequency |
| `platform_type` | User registration | Two-wheelers (Swiggy/Zomato) more exposed than 4W (Porter) |
| `declared_weekly_income_inr` | User registration | Higher income → higher claim payout → higher risk tier |
| `months_active_on_platform` | Platform partner data or self-declared | Newer workers → less history → higher uncertainty |
| `active_hours_last_4_weeks` | User activity logs | Low engagement = potential ghost account risk |

**Label Generation (Training):**
- *(Assumption for MVP)* Historical weather event data (IMD monthly bulletins 2018–2023) is cross-referenced with synthetic worker loss scenarios to generate ground-truth risk labels.
- Workers in zones with ≥3 qualifying weather events/month in historical data are labeled `High Risk`.
- Workers in zones with 1–2 events/month are `Medium`.
- Below that threshold = `Low`.

**Validation Targets:**
- R² > 0.85 on held-out validation set
- Mean Absolute Error (MAE) < 8 risk points on a 0–100 scale
- Confusion matrix threshold: <5% of `Low Risk` workers misclassified as `High Risk` (to avoid premium overcharging)

---

### Model 2: Fraud Detection — LightGBM Classifier

**Purpose:** Binary classification — `Legitimate Claim (0)` vs. `Fraudulent Claim (1)`.

**Algorithm:** LightGBM (Gradient Boosted Trees, optimized for speed and large datasets)
**Why LightGBM:** Faster training than XGBoost on large imbalanced datasets, native support for categorical features (city zone, platform ID), and better performance on imbalanced classes via `is_unbalance=True` parameter — critical since fraud is rare (<5% of claims).

**Input Features (per claim submission):**

| Feature | Source | Rationale |
|---|---|---|
| `device_id_seen_before` | Device fingerprint log | Same device used by multiple accounts = fraud signal |
| `claim_frequency_30d` | Claims table | > 3 claims/month without matching weather events is suspicious |
| `gps_zone_vs_registered_zone` | GPS ping at claim time | Worker submitting from a zone different from their declared zone |
| `weather_event_confirmed` | Parametric engine output | Was a qualifying weather event actually recorded for that zone? |
| `time_since_enrollment_days` | Policy table | Claims filed within the 7-day waiting period = auto-reject |
| `income_declared_vs_payout_ratio` | Policy + claims table | Payout > 100% of declared income for the week is a red flag |
| `claim_amount_inr` | Claim submission | Unusually high claims vs. peer group in same zone/tier |
| `photo_evidence_submitted` | Claim form | Boolean: whether supporting evidence was attached |

**Validation Targets:**
- Precision > 92% (minimize false positives — legitimate workers must not be wrongly flagged)
- Recall > 78% (catch most fraud cases)
- F1-Score > 0.84
- AUC-ROC > 0.91

---

### Model 3: Anomaly Detection — Isolation Forest

**Purpose:** Unsupervised detection of structurally unusual patterns that don't match known fraud signatures but deviate significantly from population norms.

**Algorithm:** Isolation Forest (anomaly score per sample)
**Why Isolation Forest:** No labels required — ideal for novel fraud vectors not yet seen in training data. Computationally efficient. Works well on high-dimensional behavioral data.

**Input Features:**

| Feature | Rationale |
|---|---|
| `premium_upgrades_per_month` | Sudden tier upgrades before a storm signal pre-knowledge of event |
| `claim_ratio_vs_peer_zone` | Claiming 4× more than peers in the same zone and tier |
| `login_device_count_7d` | Multiple new device logins preceding a claim |
| `working_hours_vs_claim_ratio` | Worker logs low activity but claims full-week income loss |
| `zone_switch_frequency` | Frequent zone changes across registrations |

**Output:** Anomaly score (continuous). Scores below threshold `−0.1` are flagged for human review queue. Not auto-rejected.

---

### Parametric Trigger Pipeline — End to End

```
Raw Weather API Data (OpenWeatherMap / Open-Meteo)
        │
        ▼
[Zone Aggregation Service]
  - Groups API response by registered user zones (city + pin code)
  - Computes rolling 24h rainfall, max temperature, AQI average
        │
        ▼
[Feature Extraction Layer]
  - Formats zone-level metrics into model-compatible feature vectors
  - Joins with user's registered zone and declared income
        │
        ▼
[Threshold Evaluation Engine]  ← Rule-based hard thresholds
  - Rainfall > 50mm/day        → Trigger eligible
  - Temperature > 40°C         → Trigger eligible
  - AQI > 300 (Hazardous)      → Trigger eligible
  - Active flood/cyclone alert  → Trigger eligible
  (At least ONE condition must be true for the zone on claim date)
        │
        ▼
[AI Eligibility Check]
  - XGBoost risk score confirms worker's tier matches payout level
  - LightGBM fraud score computed for this claim
  - Isolation Forest anomaly score computed
        │
        ▼
[Decision Gate]
  ├── All Clear (Fraud Score < 0.3 AND no anomaly flag)
  │       → Auto-Approve → Payout initiated via UPI/bank transfer
  │
  └── Flagged (Fraud Score > 0.3 OR anomaly flag OR missing evidence)
          → Escalate to human review queue → Manual decision within T+2 days
```

---

### Model Retraining Strategy

| Parameter | Policy |
|---|---|
| **Retraining Frequency** | Monthly (scheduled) |
| **Trigger for Early Retraining** | If live precision drops below 88% on the rolling 2-week window (monitored via Evidently AI or MLflow) |
| **Drift Detection Method** | Population Stability Index (PSI) on top-5 features. PSI > 0.25 on any feature = retraining triggered |
| **Label Source for Retraining** | Manually reviewed claims (approved/rejected by human agents) + confirmed fraud cases reported by partners |
| **Training Data Window** | Rolling 18-month window to handle seasonal patterns (monsoon, summer heat waves) |
| **Versioning** | Models versioned with date tags. Rollback to prior version if new model underperforms on A/B evaluation for >72 hours |

---

## 💰 Financial Viability & Premium Economics

> ⚠️ *All numbers in this section are illustrative assumptions for an MVP model. They do not represent audited actuarial data.*

### Actuarial Loss Ratio Model

**Scenario: 100 workers enrolled, ₹25/week premium (Medium Risk tier)**

| Item | Calculation | Value |
|---|---|---|
| **Gross Premium Pool (weekly)** | 100 workers × ₹25 | ₹2,500 |
| **Expected Claim Frequency** | *(Assumption)* 15% of workers file a claim in a given week | 15 claims |
| **Average Claim Payout** | *(Assumption)* Claims cover 40% of declared weekly income. Avg declared income = ₹5,000/week → ₹2,000 per claim | ₹2,000 |
| **Total Claims Outgo (weekly)** | 15 × ₹2,000 | ₹30,000 |
| **Loss Ratio** | Claims Outgo / Gross Premium | 1,200% ← unsustainable at 100 users |

**Break-Even Analysis:**

At ₹25/week per worker and 15% claim frequency with ₹2,000 avg payout, the minimum viable pool to sustain a 65% loss ratio is:

```
Required Pool = Claims Outgo / 0.65
             = 15% × N × ₹2,000 / 0.65
             → Solve for N such that Premium Pool ≥ Claim Outgo / 0.65

₹25 × N ≥ (0.15 × N × ₹2,000) / 0.65
₹25 × N ≥ ₹461.5 × N   ← This signals a structural premium gap
```

**Key Insight:** ₹25/week is insufficient against ₹2,000 payouts at 15% claim rate. Sustainable premium for this payout structure requires either:
- Raising premiums to ₹80–120/week for medium risk, OR
- Lowering payout caps (e.g., 20% of income, not 40%), OR
- Scaling to 10,000+ users so reinsurance kick-in above catastrophic thresholds reduces net exposure.

*(Assumption: Platform operational costs of ₹50,000/month = tech infra, salaries, regulatory compliance. At 10,000 workers paying ₹25/week → ₹10,00,000/month premium volume; operational expenses = 5% of pool, leaving room for sustainable 65% loss ratio.)*

### Loss Ratio Target

| Loss Ratio Range | Interpretation |
|---|---|
| < 50% | Over-priced; workers will churn |
| 60–70% | **Target zone — sustainable and fair** |
| > 85% | Under-priced; platform faces insolvency risk |

### Reinsurance Consideration

- **Self-Insurance (MVP Phase):** At <5,000 enrolled workers, GigShield self-insures using the premium pool. A capital reserve of 3× monthly expected claims outgo is maintained as a liquidity buffer.
- **Reinsurance Partner (Scale Phase):** For catastrophic events (e.g., cyclones affecting 10,000+ workers simultaneously), GigShield will explore a **quota-share reinsurance treaty** where a licensed reinsurer (e.g., GIC Re, Munich Re India) absorbs 60–70% of losses above a predefined retention limit (e.g., claims exceeding ₹5,00,000 in a single week).
- *(Assumption)* Reinsurance premium = 15–20% of gross premium ceded to reinsurer.

### IRDAI Capital Reserve Requirements

Under IRDAI's **IRDAI (Registration of Indian Insurance Companies) Regulations, 2022** and the Micro-Insurance framework:

- Minimum paid-up capital for a licensed insurer: **₹100 crore** (GigShield at MVP operates as a **tech intermediary/aggregator** under a licensed insurer partner, not as a standalone insurer).
- Solvency margin must be maintained at **150% of net premiums** or net incurred claims, whichever is higher.
- *(Strategy)* GigShield partners with an IRDAI-registered micro-insurance company (e.g., a Navi Technologies-type entity) as the underwriting entity, while GigShield operates as the *insurance technology platform* (InsurTech distribution partner under IRDAI's sandbox framework).

---

## 📋 Insurance Domain Fundamentals — Coverage Design

### Standard Exclusions (What Is NOT Covered)

The following events and circumstances are excluded from all GigShield policies:

| Exclusion Category | Description |
|---|---|
| **Pre-existing Health Conditions** | Inability to work due to a medical condition that predates enrollment |
| **Pandemic / Epidemic Events** | Income loss caused by officially declared pandemics (e.g., COVID-19) or epidemics |
| **Government-Imposed Lockdowns** | State or central government lockdowns not weather-related |
| **Strikes & Labour Disputes** | Platform-wide strikes, gig worker unions actions, or partner platform shutdowns |
| **War, Civil Unrest & Riots** | Any disruption attributable to armed conflict, riots, or acts of terrorism |
| **Willful Negligence** | Worker deliberately avoids working during an otherwise workable period |
| **Self-Caused Disruptions** | Accidents or equipment damage arising from reckless behavior |
| **Fraudulent Misrepresentation** | Claims where worker has provided false income, zone, or activity data at enrollment |
| **Platform-Specific Policy Changes** | If a gig platform lowers its commission rate or changes incentive policies |
| **Non-Parametric Income Loss** | Income drops that do NOT coincide with a validated weather event trigger |

### Waiting Period Policy

- **Duration:** 7 calendar days from the date of policy enrollment.
- **Effect:** No claim may be submitted or approved during the waiting period, even if a qualifying weather event occurs.
- **Rationale:** Prevents adverse selection (workers enrolling immediately before a known storm event).
- **Exception:** Waiting period waived for workers who are enrolled via a verified platform partner (e.g., Swiggy fleet partner onboarding).

### Claim Settlement Timeline

| Stage | Timeline |
|---|---|
| Claim submission | T+0 (real-time on app) |
| Parametric trigger verification | T+0 (automated, within minutes) |
| AI fraud/anomaly check | T+0 (automated) |
| Auto-approval + payout initiation | T+0 to T+1 (if all checks clear) |
| Manual review queue (flagged claims) | T+2 business days |
| UPI/bank transfer settlement | Within 24 hours of approval |

### Sub-Limits and Deductibles

- **Minimum Loss Threshold:** A claim is eligible only if the declared income loss exceeds **₹300 in a single claim event**. Claims below this threshold are automatically rejected to prevent micro-claims that are administratively unviable.
- **Maximum Payout Cap per Claim:** Limited to **40% of the worker's declared weekly income**, regardless of actual loss. *(Assumption)*
- **Weekly Claim Cap:** Maximum of **2 approved claims per worker per calendar month** to prevent abuse during extended weather events.
- **No Deductible (MVP):** Workers do not bear a co-pay or deductible in the current product version, keeping the product accessible to low-income workers.

### Policy Renewal & Lapse Policy

| Scenario | Outcome |
|---|---|
| **Auto-Renewal** | Policy auto-renews weekly. Premium is deducted from linked UPI or pre-authorized mandate. |
| **Payment Failure** | Grace period of 3 days. If premium not cleared within grace period, policy lapses. |
| **Policy Lapse** | All coverage stops immediately. Waiting period re-applies on re-enrollment (7 days). |
| **Voluntary Cancellation** | Worker may cancel anytime. Unused premium days are non-refundable (to cover administrative costs). |
| **Re-enrollment after Lapse** | Treated as new enrollment. New 7-day waiting period applies. Previous claim history retained for fraud scoring. |

---

## 📄 Technical Product Design

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  React.js SPA (Vite) — served via Vercel CDN                │
│  Portals: Worker | Admin | Platform Partner                  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  Node.js + Express.js — hosted on Render / AWS EC2          │
│  JWT Authentication Middleware                               │
│  Rate Limiter (100 req/min per IP)                          │
│  Request Validation (Joi Schemas)                           │
└────┬──────────────────┬──────────────────┬───────────────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────┐     ┌──────────────┐    ┌─────────────────┐
│  Auth   │     │ Policy/Claim │    │  AI Rules Engine │
│ Service │     │   Service    │    │  (Node.js Mocks) │
│ /auth/* │     │ /policies/*  │    │  /ai/risk-score  │
│         │     │ /claims/*    │    │  /ai/fraud-check │
└────┬────┘     └──────┬───────┘    └────────┬────────┘
     │                 │                      │
     └────────┬─────── ┴──────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  MongoDB Atlas (Primary DB)                                  │
│  Collections: users, policies, claims, weatherevents        │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                        │
│  OpenWeatherMap API     → Zone-level weather data           │
│  Open-Meteo API         → Historical weather (fallback)     │
│  Twilio                 → OTP-based worker authentication   │
│  UPI / Razorpay         → Premium collection & payouts      │
└──────────────────────────────────────────────────────────────┘
```

**Service Boundaries & API Contracts:**
- Auth Service owns identity. All other services validate JWT tokens; they do not handle authentication.
- Policy/Claim Service is the source of truth for financial records.
- AI Rules Engine is stateless — it receives feature vectors and returns scores. It does not write to the DB directly.
- Weather data is ingested by a scheduled cron job (every 3 hours) and stored in the `weatherevents` collection.

---

### Data Schema

#### `users` Collection

```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string (E.164 format, unique)",
  "platform_id": "string (e.g., SWIGGY, ZOMATO, ZEPTO)",
  "city": "string",
  "zone_pin_code": "string",
  "declared_weekly_income_inr": "number",
  "enrollment_date": "ISODate",
  "otp_verified": "boolean",
  "risk_tier": "enum: [LOW, MEDIUM, HIGH]",
  "risk_score": "number (0–100)",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

#### `policies` Collection

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "premium_amount_inr": "number",
  "risk_tier": "enum: [LOW, MEDIUM, HIGH]",
  "status": "enum: [ACTIVE, LAPSED, CANCELLED]",
  "coverage_start_date": "ISODate",
  "waiting_period_end_date": "ISODate (enrollment_date + 7 days)",
  "last_premium_paid_at": "ISODate",
  "auto_renew": "boolean",
  "created_at": "ISODate"
}
```

#### `claims` Collection

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "policy_id": "ObjectId (ref: policies)",
  "weather_event_id": "ObjectId (ref: weatherevents)",
  "claim_amount_inr": "number",
  "declared_income_loss_inr": "number",
  "ai_status": "enum: [AUTO_APPROVED, FLAGGED, REJECTED, MANUAL_REVIEW]",
  "fraud_score": "number (0.0–1.0)",
  "anomaly_score": "number",
  "photo_evidence_url": "string (optional)",
  "settlement_date": "ISODate (null if pending)",
  "rejection_reason": "string (null if approved)",
  "created_at": "ISODate"
}
```

#### `weatherevents` Collection

```json
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
  "data_source": "string (e.g., OpenWeatherMap)",
  "recorded_at": "ISODate"
}
```

---

### API Design

#### `POST /api/claims`
Submit a new disruption claim for AI validation.

**Request Headers:** `Authorization: Bearer <JWT>`

**Request Body:**
```json
{
  "policy_id": "string",
  "declared_income_loss_inr": 1500,
  "photo_evidence_url": "https://cdn.gigshield.in/evidence/abc123.jpg"
}
```

**Response — 201 Created (Auto-Approved):**
```json
{
  "claim_id": "64f2a...",
  "status": "AUTO_APPROVED",
  "claim_amount_inr": 1200,
  "settlement_eta": "2026-04-04T00:00:00Z",
  "ai_confidence": 0.94,
  "message": "Your claim has been approved. Payout will be credited within 24 hours."
}
```

**Response — 200 OK (Flagged for Review):**
```json
{
  "claim_id": "64f2b...",
  "status": "FLAGGED",
  "message": "Your claim has been flagged for manual review. Decision within 2 business days.",
  "fraud_score": 0.61,
  "reason_codes": ["HIGH_CLAIM_FREQUENCY", "GPS_ZONE_MISMATCH"]
}
```

**Response — 400 Bad Request (Waiting Period):**
```json
{
  "error": "WAITING_PERIOD_ACTIVE",
  "message": "Claims are not eligible during the 7-day waiting period.",
  "waiting_period_ends": "2026-04-07T00:00:00Z"
}
```

---

#### `GET /api/risk-score/:userId`
Fetch the computed risk tier and score for a worker.

**Request Headers:** `Authorization: Bearer <JWT>`

**Response — 200 OK:**
```json
{
  "user_id": "64e1a...",
  "risk_score": 72,
  "risk_tier": "HIGH",
  "premium_recommendation_inr": 40,
  "contributing_factors": [
    { "feature": "avg_rainfall_7d_mm", "value": 67.4, "impact": "HIGH" },
    { "feature": "city_flood_index", "value": 0.83, "impact": "MEDIUM" },
    { "feature": "active_hours_last_4_weeks", "value": 38, "impact": "LOW" }
  ],
  "last_computed_at": "2026-04-02T08:00:00Z"
}
```

---

#### `GET /api/policies/:userId/status`
Get current policy status and coverage details.

**Request Headers:** `Authorization: Bearer <JWT>`

**Response — 200 OK:**
```json
{
  "policy_id": "64e2c...",
  "status": "ACTIVE",
  "risk_tier": "MEDIUM",
  "premium_inr": 25,
  "coverage_start_date": "2026-03-26T00:00:00Z",
  "waiting_period_end_date": "2026-04-02T00:00:00Z",
  "claims_this_month": 1,
  "max_claims_allowed": 2,
  "next_renewal_date": "2026-04-09T00:00:00Z"
}
```

---

### Non-Functional Requirements

| Requirement | Target |
|---|---|
| **API Latency (P95)** | < 300ms for claim submission; < 100ms for risk-score fetch |
| **Uptime SLA** | 99.5% monthly availability (≤ 3.6 hours downtime/month) |
| **Concurrent Users** | Handle 1,000 simultaneous API requests without degradation |
| **AI Inference Latency** | < 50ms per model call (rule-based mock in MVP; model serving via ONNX runtime in v2) |
| **Data Retention Policy** | User PII retained for 7 years (IRDAI compliance); weather event data purged after 3 years |
| **Backup Policy** | MongoDB Atlas automated daily backups; point-in-time recovery enabled |
| **Authentication Token Expiry** | JWT access tokens expire in 15 minutes; refresh tokens in 7 days |
| **Rate Limiting** | 100 requests/minute per authenticated user; 20/minute for unauthenticated endpoints |
| **Encryption** | All data in transit via TLS 1.3; MongoDB Atlas encryption at rest enabled |

---

## Parametric Triggers

Claims are triggered automatically when **at least one** of the following conditions is confirmed in the worker's registered zone on the claim date:

| Trigger | Threshold | Data Source |
|---|---|---|
| Rainfall | > 50mm in 24 hours | OpenWeatherMap API |
| Temperature | > 40°C (max daily) | OpenWeatherMap API |
| Air Quality Index | > 300 (Hazardous) | CPCB / Open-Meteo |
| Flood Alert | Active state-level alert | India Disaster Resource Network (IDRN) API |
| Cyclone Alert | Active IMD bulletin within 200km radius | IMD public API |

---

## Coverage Exclusions

**What is NOT covered:**

| Exclusion | Details |
|---|---|
| Pre-existing health conditions | Medical conditions predating enrollment |
| Pandemics / Epidemics | Declared public health emergencies |
| Government lockdowns | Non-weather state/central lockdowns |
| Strikes & gig platform shutdowns | Labour disputes, app downtime, platform policy changes |
| War, civil unrest, terrorism | Any armed conflict or riots |
| Willful negligence | Deliberate avoidance of work without a valid reason |
| Self-caused accidents | Reckless behavior leading to inability to work |
| Non-parametric income loss | Loss not correlated with a weather trigger event |
| Fraudulent misrepresentation | False income, zone, or activity data at enrollment |

**Policy Terms:**
- **Waiting Period:** 7 calendar days from enrollment. No claims eligible during this window.
- **Claim Settlement Timeline:** Auto-approved claims settled within T+1 business day; flagged claims within T+2 business days.
- **Minimum Loss Threshold:** ₹300 minimum income loss required for claim eligibility.
- **Monthly Claim Cap:** Maximum 2 approved claims per worker per calendar month.

---

## Business Model

- Weekly premiums from workers (primary revenue)
- Commission or referral fees from partner gig platforms
- B2B data insights for logistics and platform companies
- Future: White-label insurance product for platform partners (Swiggy, Zomato onboarding their fleet)

---

## 💰 Premium Economics Summary

*(All values are illustrative assumptions for MVP planning)*

| Metric | Value (Assumption) |
|---|---|
| Example premium pool | 100 workers × ₹25/week = ₹2,500/week |
| Expected claim frequency | 15% of workers/week |
| Average payout per claim | ₹2,000 (40% of ₹5,000 declared weekly income) |
| Target loss ratio | 60–70% |
| Break-even user base | ~10,000 workers (at ₹25/week, 65% loss ratio, ₹50K/month opex) |
| Reinsurance strategy | Quota-share treaty above ₹5,00,000 weekly claims threshold |
| Capital structure (MVP) | Tech intermediary model under IRDAI-licensed partner insurer |

---

## ⚠️ Risk Register

| # | Risk | Type | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| 1 | **GPS spoofing at scale** | Technical | Medium | High | Geo-velocity checks + device ID binding + cross-referencing delivery platform GPS logs |
| 2 | **Weather API downtime** | Technical | Low | High | Primary API (OpenWeatherMap) + fallback (Open-Meteo historical averages) + 3-hour cache TTL |
| 3 | **Low user adoption / premium friction** | Business | High | High | Freemium first week; subsidized premiums via platform partner B2B deals; UPI mandate for frictionless auto-pay |
| 4 | **IRDAI regulatory changes to micro-insurance / InsurTech sandbox** | Regulatory | Medium | High | Operate under licensed insurer partner; monitor IRDAI circulars; legal counsel retained |
| 5 | **AI model drift (incorrect risk scoring post-monsoon season)** | Technical/ML | Medium | Medium | PSI drift detection on top features; monthly retraining; human review queue for edge cases |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT + Twilio OTP |
| AI Engine | Node.js mock rules engine (MVP); XGBoost / LightGBM / Isolation Forest (v2) |
| Weather APIs | OpenWeatherMap, Open-Meteo |
| Payments | Razorpay / UPI mandate |
| Hosting | Vercel (frontend), Render (backend) |
| DevOps | Docker, GitHub Actions CI/CD |
