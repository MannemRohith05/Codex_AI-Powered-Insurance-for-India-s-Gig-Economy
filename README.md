# 🛡️ GigShield — Income Protection for Gig Workers

GigShield is a full-stack insurance platform that protects delivery workers (Swiggy, Zomato, Zepto, Dunzo etc.) against income loss due to weather disruptions like heavy rain, floods, heatwaves, and poor AQI.

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
# → Edit .env and set your MONGO_URI (at minimum)

# 4. Seed the database with demo data
npm run seed

# 5. Start both servers
npm run dev
```

> **Frontend** runs at → `http://localhost:5173`
> **Backend API** runs at → `http://localhost:5000`

---

## 🔑 Demo Credentials (after seeding)

| Portal | URL | Email / Phone | Password |
|--------|-----|---------------|----------|
| Worker | `/worker/login` | `+919000000001` | `Worker@123` |
| Admin | `/admin/login` | `admin@gigshield.in` | `Admin@123` |
| Platform Partner | `/platform/login` | `partner@swiggy.com` | `Partner@123` |

---

## 📋 Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | ≥ 18.x | ✅ Yes |
| MongoDB | Local or Atlas | ✅ Yes |
| npm | ≥ 9.x | ✅ Yes |
| Redis | Local or skip | ⚠️ Optional |

> MongoDB is required. You can use:
> - **Local**: Install MongoDB Community from [mongodb.com](https://www.mongodb.com/try/download/community)
> - **Cloud (free)**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas) and paste the URI in `.env`

---

## 📁 Project Structure

```
gigshield/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/   # Worker, Admin, Platform pages
│       ├── components/
│       └── utils/   # Axios API client
├── server/          # Node.js + Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/      # Mongoose schemas
│   ├── seeds/       # Demo data seeder
│   └── server.js
├── .env.example     # Environment variable template
└── package.json     # Root scripts (dev, install-all, seed)
```

---

## ⚙️ Available Scripts

Run from the **root** directory:

| Command | Description |
|---------|-------------|
| `npm run install-all` | Install deps for root + client + server |
| `npm run dev` | Start both frontend and backend |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run seed` | Seed database with demo data |

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/devtrails   # or Atlas URI
JWT_SECRET=your_long_random_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Optional** (app works in dev mode without these):
- `TWILIO_*` — OTP is logged to console in dev mode
- `RAZORPAY_*` — Payments use mock mode if not set
- `OPENWEATHERMAP_API_KEY` — Weather poller skips if not set

---

## 🧪 Tech Stack

**Frontend**: React 19, Vite, TailwindCSS v4, Recharts, React Router v7
**Backend**: Node.js, Express 5, MongoDB, Mongoose, JWT, Razorpay, Twilio
**Dev Tools**: Nodemon, Concurrently, ESLint

---

## 👥 Portals

- **Worker Portal** — Register, KYC, buy insurance, file claims, track status
- **Admin Portal** — Review/approve claims, fraud panel, disruption management
- **Platform Portal** — Swiggy/Zomato view of their workers and claims
