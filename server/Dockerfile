# 1. Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
# Copy package files first to cache dependencies
COPY package*.json ./
# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci
# Copy source code
COPY . .
# Build TypeScript
RUN npm run build

# 2. Production Stage
FROM node:22-alpine
WORKDIR /app
# Copy built assets and package files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# Install ONLY production dependencies
RUN npm ci --omit=dev
# Expose port and start
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server.js"]
