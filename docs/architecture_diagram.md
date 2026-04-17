# GigShield — Architecture Diagram

> **TODO:** Export this Mermaid diagram as a PDF/PNG and include in the final submission package.

## System Architecture

```mermaid
graph TB
    subgraph Workers["🚴 Gig Workers (Mobile / Web)"]
        WApp["React Frontend\n(Vite, Vercel)"]
    end

    subgraph AdminPanel["🛡️ Admin / Insurer Panel"]
        Admin["Admin Dashboard\n(React)"]
        DemoMode["🎬 Demo Mode Panel\n(SSE Live Flow)"]
    end

    subgraph API["🖥️ GigShield API (Node.js / Express)"]
        direction TB
        AuthMW["Auth Middleware\n(JWT)"]
        ClaimCtrl["Claim Controller"]
        AdminCtrl["Admin Controller"]
        DemoCtrl["Demo Controller"]
        PolicyCtrl["Policy Controller"]
        WorkerCtrl["Worker Controller"]
        MLRoutes["ML /predict Stub"]
    end

    subgraph AILayer["🤖 AI Engine Layer"]
        FraudDet["fraudDetection.js\n(GPS Spoof + Weather Validation)"]
        AIEngine["aiEngine.js\n(XGBoost + LightGBM + IsoForest)"]
        ZoneData["zoneData.js\n(50+ 6-digit PIN zones)"]
        Actuarial["actuarialHealth.js\n(Loss Ratio + Reserve)"]
    end

    subgraph Services["⚙️ External Services"]
        OWM["OpenWeatherMap API\n(Weather Data)"]
        Razorpay["Razorpay\n(Premium Orders + UPI Payout)"]
        Twilio["Twilio\n(OTP SMS)"]
    end

    subgraph DB["🗄️ MongoDB Atlas"]
        Workers_["Workers"]
        Policies["Policies"]
        Claims["Claims"]
        WeatherEvents["WeatherEvents"]
        FraudLogs["FraudLogs"]
        DisruptionEvents["DisruptionEvents"]
    end

    subgraph Cron["⏰ Background Jobs"]
        WeatherPoller["Weather Poller\n(every 30 min)"]
    end

    WApp --> AuthMW
    Admin --> AuthMW
    DemoMode --> DemoCtrl

    AuthMW --> ClaimCtrl
    AuthMW --> AdminCtrl
    AuthMW --> PolicyCtrl
    AuthMW --> WorkerCtrl

    ClaimCtrl --> FraudDet
    ClaimCtrl --> AIEngine
    ClaimCtrl --> ZoneData
    ClaimCtrl --> Razorpay
    ClaimCtrl --> Claims

    AdminCtrl --> Actuarial
    AdminCtrl --> ZoneData
    AdminCtrl --> Claims
    AdminCtrl --> Policies

    DemoCtrl --> FraudDet
    DemoCtrl --> AIEngine
    DemoCtrl --> Razorpay

    MLRoutes --> AIEngine

    AIEngine --> ZoneData
    Actuarial --> Claims
    Actuarial --> Policies

    WeatherPoller --> OWM
    WeatherPoller --> WeatherEvents
    WeatherPoller --> DisruptionEvents

    WorkerCtrl --> Twilio

    Claims --- DB
    Policies --- DB
    Workers_ --- DB
    WeatherEvents --- DB
    FraudLogs --- DB
    DisruptionEvents --- DB
```

## Data Flow — Claim Pipeline

```mermaid
sequenceDiagram
    participant W as Worker App
    participant API as GigShield API
    participant FD as fraudDetection.js
    participant AI as aiEngine.js
    participant DB as MongoDB
    participant RZP as Razorpay

    W->>API: POST /api/claim/submit
    API->>DB: Fetch Policy (active?)
    API->>DB: Fetch WeatherEvent (zone, 6h window)
    API->>FD: runFullFraudCheck(gps, weather, worker)
    FD-->>API: { fraud_score, gps_result, weather_result }
    API->>AI: computeFraudScore() + computeAnomalyScore()
    AI-->>API: { fraud_score, anomaly_score }
    API->>AI: makeClaimDecision()
    AI-->>API: AUTO_APPROVED | FLAGGED | REJECTED
    API->>DB: Claim.create({ status: 'approved' })
    API->>RZP: processPayout(upi_id, amount)
    RZP-->>API: { id: 'pout_xxx', status: 'processed' }
    API->>DB: Claim.update({ status: 'paid', razorpay_payout_id })
    API-->>W: { claim_id, status: 'AUTO_APPROVED', payout_amount }
```

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend  | Vercel   | https://gig-shield-ten.vercel.app |
| Backend   | Render   | https://gigshield.onrender.com |
| Database  | MongoDB Atlas | (private) |
