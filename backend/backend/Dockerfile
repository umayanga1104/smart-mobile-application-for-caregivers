# backend/Dockerfile

# ── Base image ──
FROM node:20-alpine

WORKDIR /app

# ── Install dependencies first (cached layer) ──
COPY package.json package-lock.json* ./
RUN npm install

# ── Copy source code ──
# In dev mode the volumes override this, but this makes the image
# self-contained for production builds too
COPY . .

EXPOSE 3000

# ── Health check ──
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# ── Start the server ──
CMD ["node", "src/server.js"]