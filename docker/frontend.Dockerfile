# ====================================================================
# Production Multi-Stage Dockerfile for Matzevet Frontend (React 19 + Vite)
# Produces an ultra-lightweight Nginx container (~25MB) for GCP Cloud Run
# ====================================================================

# --- Stage 1: Build the Vite production assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API URL build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package descriptors first to leverage Docker layer caching
COPY ["frontend - NEW/package*.json", "./"]

RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy frontend source code
COPY ["frontend - NEW/", "./"]

# Build production bundle
RUN npm run build

# --- Stage 2: Serve with lightweight Nginx web server ---
FROM nginx:alpine-slim

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard Cloud Run port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
