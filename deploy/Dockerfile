# ============================================
# Stage 1: Build frontend (Vite)
# ============================================
FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1

# Install all dependencies (including dev dependencies for Vite build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code for building
COPY . .

# Build frontend -> dist/
RUN npm run build

# ============================================
# Stage 2: Final image based on official image
# ============================================
FROM louislam/uptime-kuma:2

# Replace built frontend with our modified version
COPY --from=build /app/dist ./dist

# Replace modified backend files
COPY server/docker.js /app/server/docker.js
COPY server/socket-handlers/docker-socket-handler.js /app/server/socket-handlers/docker-socket-handler.js
