# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────
#  GENYSIS  —  Node.js API Server Dockerfile
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy application source
COPY . .

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
