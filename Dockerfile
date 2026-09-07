# ==============================================================================
# Automated Document Digitizer - Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build Frontend Assets & Backend Bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build Vite client assets (dist/client) and bundle Express server (dist/server.cjs)
RUN npm run build

# Remove development dependencies to keep final image minimal
RUN npm prune --omit=dev

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Install curl/wget for health checking (busybox wget is built into alpine)
RUN apk --no-cache add wget ca-certificates

# Copy package info and production node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy optional offline OCR language model if present
COPY --from=builder /app/eng.traineddata* ./

# Expose standard container ingress port
EXPOSE 3000

# Health check verification
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Launch the compiled CommonJS server bundle
CMD ["node", "dist/server.cjs"]
