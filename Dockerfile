# ── GigShield Root Dockerfile ─────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Build frontend
RUN cd client && npm run build

# Expose ports
EXPOSE 5173
EXPOSE 5000

# Start both servers
CMD ["npm", "start"]
