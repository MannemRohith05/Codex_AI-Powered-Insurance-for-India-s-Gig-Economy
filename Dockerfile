# ── GigShield Root Dockerfile (Optimized for Backend Deployment) ────────────
FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install server dependencies only
RUN cd server && npm install

# Expose backend port
EXPOSE 10000

# Start only the backend server
CMD ["node", "server/server.js"]
