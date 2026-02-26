# Trade Tracker Web Dockerfile
# Multi-stage build for Angular application

# ── Stage 1: dev ──────────────────────────────────────────
FROM node:22-alpine AS dev

WORKDIR /app

# Support running Angular unit tests in Docker (ChromeHeadless via Chromium)
RUN apk add --no-cache \
	chromium \
	nss \
	freetype \
	harfbuzz \
	ttf-freefont

ENV CHROME_BIN=/usr/bin/chromium-browser

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies (use npm install for initial setup, npm ci for CI/CD)
RUN npm install

# Copy source code
COPY . .

EXPOSE 4200

# Dev server with polling for Docker volume mounts
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--poll", "500", "--disable-host-check"]

# ── Stage 2: builder ──────────────────────────────────────
FROM dev AS builder

# Build production bundle
RUN npm run build -- --configuration production

# ── Stage 3: prod (nginx) ─────────────────────────────────
FROM nginx:alpine AS prod

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist/trade-tracker-web/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
