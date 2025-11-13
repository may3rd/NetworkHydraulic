# Multi-stage Docker build for Hydraulic Network Web Application
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:1.24-alpine AS production

# Install required packages
RUN apk add --no-cache \
    nginx-mod-http-headers-more \
    curl \
    tini

# Create nginx user and directories
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app && \
    mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run /var/cache/nginx

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create health check script
COPY health-check.sh /health-check.sh
RUN chmod +x /health-check.sh

# Switch to non-root user
USER nginx-app

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /health-check.sh

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development stage (optional)
FROM node:18-alpine AS development

# Install development tools
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]