# Root Dockerfile: build and run backend (server/) only. Railway detects this at repo root.
# 1. Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
# Copy ONLY the server package files
COPY server/package*.json ./
# Install server dependencies (including dev for tsc)
RUN npm ci
# Copy the rest of the server source code
COPY server/ .
# Build the backend
RUN npm run build

# 2. Production Stage
FROM node:22-alpine
WORKDIR /app
# Copy built assets and package files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# Install production dependencies only
RUN npm ci --omit=dev
# Define environment
ENV PORT=8080
EXPOSE 8080
# Start the server
CMD ["node", "dist/server.js"]
