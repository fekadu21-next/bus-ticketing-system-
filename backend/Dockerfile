# =======================================================
# Stage 1: Build Dependencies & Prisma Client
# =======================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies & OpenSSL for Prisma engines
RUN apk add --no-cache openssl dumb-init

# Copy package manifests & prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for building/generating prisma)
RUN npm ci

# Generate Prisma Client for alpine architecture
RUN npx prisma generate

# Remove devDependencies to minimize layer size
RUN npm prune --production

# =======================================================
# Stage 2: Production Runtime
# =======================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime OpenSSL and dumb-init
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules from deps stage (includes pruned prod deps + generated prisma client)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /usr/bin/dumb-init /usr/bin/dumb-init

# Copy application source code
COPY . .

# Run as non-root user for container security
USER node

# Expose API and WebSocket port
EXPOSE 5000

# Health Check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Use dumb-init for graceful signal handling (SIGINT/SIGTERM)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
