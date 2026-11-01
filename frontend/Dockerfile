# =======================================================
# Stage 1: Build the Vite React Application
# =======================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install exact dependencies
RUN npm ci

# Copy full frontend source code
COPY . .

# Build production assets (Vite produces /app/dist)
RUN npm run build

# =======================================================
# Stage 2: Serve Production Assets with Nginx Alpine
# =======================================================
FROM nginx:alpine AS runner

# Remove default nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom high-performance Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
