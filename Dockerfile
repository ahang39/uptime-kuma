# ============================================
# Stage 1: Build frontend (Vite)
# ============================================
FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1

# Install build tools for native modules (sqlite3)
RUN apt update && \
    apt install --yes --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Install all dependencies (including dev dependencies for Vite build)
COPY uptime-kuma/package.json uptime-kuma/package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set node_sqlite3_binary_host_mirror https://npmmirror.com/mirrors/node-sqlite3 && \
    npm ci --legacy-peer-deps || \
    npm ci --legacy-peer-deps || \
    npm ci --legacy-peer-deps

# Copy source code for building
COPY uptime-kuma/ .

# Build frontend -> dist/
RUN npm run build

# ============================================
# Stage 2: Final image based on official image
# ============================================
FROM louislam/uptime-kuma:2

# Replace built frontend with our modified version
COPY --from=build /app/dist ./dist

# Replace modified backend files
COPY uptime-kuma/server/docker.js /app/server/docker.js
COPY uptime-kuma/server/socket-handlers/docker-socket-handler.js /app/server/socket-handlers/docker-socket-handler.js
