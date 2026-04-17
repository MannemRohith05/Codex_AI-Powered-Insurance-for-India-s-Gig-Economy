# GigShield — Pitch Deck

> **TODO:** Replace this file with the final PDF/PPTX slide deck before submission.

## Slide Outline

### Slide 1 — Cover
- **Title:** GigShield — Parametric Insurance for India's Gig Economy
- **Tagline:** Instant income protection for 50 million delivery workers
- **Team:** [Team Name], [Institution], April 2026

### Slide 2 — Problem
- 50 million gig workers in India earn daily wages
- No safety net when weather disrupts work (floods, heatwaves, poor AQI)
- Traditional insurance: 30–60 day claim settlement, high documentation burden
- Gig workers lose ₹500–₹3,000 per disruption day and have no recourse

### Slide 3 — Solution
- **Parametric insurance**: payouts triggered automatically by weather data — no claim form needed
- Coverage costs ₹15–₹40/week (less than a meal)
- Auto-approval in under 60 seconds via AI fraud detection
- UPI payout sent instantly after claim approval

### Slide 4 — How It Works
1. Worker buys weekly coverage (Swiggy, Zomato, Zepto, etc.)
2. IoT/weather APIs monitor rainfall, AQI, temperature in real time
3. Threshold breached → parametric trigger fires
4. AI fraud engine validates claim (GPS spoofing, fake weather detection)
5. Claim approved → UPI payout sent in < 60 seconds

### Slide 5 — AI & Technology
- **ML Engine**: XGBoost risk scoring + LightGBM fraud classifier + Isolation Forest anomaly detection
- **Hyper-local zones**: 50+ 6-digit PIN-code zones across 10 cities
- **Actuarial sustainability**: IRDAI-standard loss ratio monitoring (GREEN/AMBER/RED)
- **Fraud detection**: GPS velocity analysis (Haversine), fake weather claim validation
- **Stack**: Node.js + MongoDB + React + Razorpay + OpenWeatherMap

### Slide 6 — Market Opportunity
- Total addressable market: 50M gig workers × ₹25/week = ₹1,300 Cr/year
- Serviceable market (delivery riders, 10 cities): ~8M workers = ₹200 Cr/year
- Year 1 target: 10,000 workers → ₹1.3 Cr premium revenue

### Slide 7 — Business Model
See `business_model.md` for full pricing and revenue details.

### Slide 8 — Actuarial Health
- Loss ratio target: < 0.70 (IRDAI standard)
- Reserve adequacy ratio: > 1.0 (3-month coverage)
- Premium stress loading applied automatically when loss ratio > 0.75

### Slide 9 — Demo
- Live demo: 6-step automated pipeline (coverage → disruption → fraud check → approve → payout)
- Completes in < 30 seconds

### Slide 10 — Team & Ask
- [Team members and roles]
- Ask: [Funding / Partnership / Mentorship request]
