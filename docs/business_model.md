# GigShield — Business Model & Pricing

> **TODO:** Validate pricing with actuarial data and finalize before submission.

## Premium Tiers (Weekly)

| Tier   | Weekly Premium | Max Coverage/Event | Target Worker Type        |
|--------|---------------|-------------------|---------------------------|
| LOW    | ₹15/week      | ₹3,000            | Street vendors, domestic  |
| MEDIUM | ₹25/week      | ₹7,500            | Delivery riders (Swiggy)  |
| HIGH   | ₹40/week      | ₹15,000           | Construction, factory     |

**Monthly equivalents:** ₹60 / ₹100 / ₹160 (billed weekly via UPI AutoPay)

## Payouts by Disruption Type

| Disruption | LOW Tier | MEDIUM Tier | HIGH Tier |
|------------|----------|-------------|-----------|
| Heavy Rain | ₹500     | ₹1,500      | ₹3,000    |
| Heatwave   | ₹750     | ₹2,000      | ₹4,000    |
| Flood      | ₹1,000   | ₹3,000      | ₹6,000    |
| Poor AQI   | ₹500     | ₹1,000      | ₹2,000    |

Maximum 2 payouts per month per worker.

## Revenue Model

### Premium Revenue
- Commission: 100% of premium collected (GigShield acts as the insurer/underwriter)
- Distribution channel: embedded in platform app (Swiggy, Zomato) → platform partner takes 10% referral fee

### Platform Partner Revenue
- Platform SaaS fee: ₹2,000/month flat per platform for dashboard access + API
- Per-worker analytics fee: ₹5/worker/month

### Unit Economics (MEDIUM tier, 1,000 workers)

| Metric                        | Value            |
|-------------------------------|------------------|
| Gross Premium Revenue/month   | ₹1,00,000        |
| Expected Claim Rate           | 3 claims/month   |
| Expected Payout/month         | ₹4,500           |
| **Loss Ratio**                | **0.045** ✅     |
| Reserve Contribution (15%)    | ₹15,000          |
| Operating Costs               | ₹20,000          |
| **Net Margin/month**          | **₹60,500**      |

> **Note:** Loss ratio of 0.045 is based on 3 qualifying weather events per month in test city. 
> Real loss ratio expected: **0.30–0.55** depending on monsoon season intensity.
> IRDAI ceiling: **0.70** — GigShield has healthy headroom.

## Actuarial Sustainability

- **GREEN** (loss ratio < 0.70): No premium adjustment needed
- **AMBER** (loss ratio 0.70–0.90): +10% stress loading applied to new policies
- **RED** (loss ratio > 0.90): +25% emergency surcharge, new policy issuance paused

## Go-To-Market

### Phase 1 (Months 1–6): Pilot
- City: Mumbai, Hyderabad
- Target: 500 workers via Swiggy partnership
- Revenue: ₹75,000/month

### Phase 2 (Months 7–12): Scale
- Cities: + Chennai, Bangalore, Delhi
- Target: 5,000 workers
- Revenue: ₹7,50,000/month

### Phase 3 (Year 2): Expansion
- All Tier-1 cities + entry into Tier-2
- Target: 50,000 workers
- Revenue: ₹7.5 Cr/month

## Regulatory

- IRDAI sandbox applicant (InsurTech innovation license)
- Compliant with IRDAI micro-insurance regulations (2005 amendment)
- KYC via Aadhaar OTP (DigiLocker integration planned)
