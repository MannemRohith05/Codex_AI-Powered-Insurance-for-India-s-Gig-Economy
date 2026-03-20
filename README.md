AI-Powered Insurance for India’s Gig Economy
Team Codex

Mannem Rohith — Team Lead

Lanka Srividya

Gundlapalli Sri Harsha Reddy

Narahari Shruthi

Problem Statement

India’s rapidly growing gig economy relies heavily on delivery partners associated with platforms such as Swiggy, Zomato, Zepto, and Amazon. Despite their critical role, these workers face highly volatile and unpredictable incomes.

Environmental factors such as heavy rainfall, extreme heat, air pollution, and floods significantly reduce their ability to work. As a result, delivery partners often experience income losses of 20–30%, with no structured financial protection mechanism currently in place.

User Persona:
Persona: Ravi — Delivery Partner

Ravi is a full-time delivery partner based in Vijayawada. His daily income depends entirely on completed deliveries.

Average daily earnings: ₹800–₹1000

Challenge: Earnings drop significantly during adverse weather conditions

Impact: Difficulty managing essential expenses such as rent, fuel, and food

Scenario:

During a typical workday:

Ravi begins deliveries in his assigned zone

Heavy rainfall starts unexpectedly

Order volume declines and working conditions become unsafe

His income drops drastically

 In such cases, our system automatically detects the disruption and initiates compensation through insurance.

Proposed Solution:

We propose a web-based, AI-powered parametric insurance platform that provides weekly income protection to gig workers.

The platform ensures that workers are financially supported when external conditions prevent them from working.

Key Capabilities

Risk-based premium pricing

Real-time environmental data integration

Automated claim validation and processing

System Workflow:

User registers with personal and work-related details

System calculates a dynamic risk score

Weekly insurance premium is assigned

Environmental disruption is detected

Claim is automatically triggered and processed

Parametric Triggers:

Claims are activated automatically when predefined thresholds are met:

Rainfall exceeds 50 mm/day

Temperature exceeds 40°C

Air Quality Index (AQI) reaches hazardous levels

Official flood alerts are issued

If these conditions occur within the user’s operational zone, claim eligibility is instantly triggered.

AI Architecture:
Inputs

Weather data (real-time APIs)

User activity and delivery patterns

Location and geo-spatial data

Processing

Risk scoring models

Fraud detection algorithms

Behavioral pattern analysis

Outputs

Personalized premium calculation

Automated claim decisions

Fraud alerts and risk flags

Fraud Detection & Security:

To ensure system integrity, we implement advanced fraud prevention mechanisms:

Risks Addressed

GPS spoofing

Multiple account misuse

Organized fraud rings

Fake activity generation

Approach

Geo-fencing and location validation

Multi-source verification (GPS + device signals)

Device fingerprinting and identity tracking

AI-based anomaly detection

Our system goes beyond basic validation by combining behavioral analytics with multi-layer verification.

Scalability & Risk Management:

The platform is designed to handle large-scale misuse scenarios:

Detection of coordinated fraud attempts

Identification of linked or suspicious accounts

Proactive prevention of financial losses

Fairness & Reliability:

Multi-step claim verification

No instant rejection without evaluation

Robust handling of edge cases

Transparent and unbiased decision-making

Platform Choice: Web Application

Cross-device accessibility

No installation required

Faster deployment and iteration

Efficient dashboard-based monitoring

Development Roadmap
Phase 1: Ideation & Planning

Problem definition using real-world personas

System workflow design

Prototype demonstration video

Initial project documentation (README)

Phase 2: Core Development

User registration and onboarding

Insurance policy management system

Dynamic premium calculation engine

Claim management module

API-based parametric trigger integration

Initial AI-based pricing model

Phase 3: Scaling & Optimization

Advanced fraud detection (GPS spoofing, fraud rings)

Enhanced AI anomaly detection models

Simulated instant payout system (Razorpay/UPI test mode)

Dashboards

Worker Dashboard: Earnings protection insights

Admin Dashboard: Analytics, monitoring, and predictions

Final Demonstration Includes

Disruption simulation

Automated claim approval

Instant payout workflow

Tech Stack:

Frontend: React.js, Tailwind CSS

Backend: Node.js, Express.js

Database: MySQL

AI/ML: Python

Maps & Geo Services: Google Maps API

Key Features
Delivery Partner

Policy overview

Claims tracking

Real-time alerts

Risk score visibility

Admin Panel:

User and policy management

Claim monitoring and approvals

Fraud detection dashboard

Partner Platforms:

Worker insights

Operational impact analysis

Impact:

Reduces financial instability for gig workers

Introduces trust in insurance systems

Minimizes fraud through AI-driven validation

Scalable across multiple cities and platforms

Core Vision

To build a resilient, intelligent insurance system that protects gig workers from income shocks while maintaining fairness, transparency, and fraud resistance.


📽️ Demo Video

https://drive.google.com/file/d/11_6QZlPkTYYbGQ3o38s3T2ROJOUkrxny/view?usp=drivesdk
