#!/bin/bash
# Docker entrypoint script for Hydraulic Network Web Application

set -e

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a /var/log/nginx/docker-entrypoint.log
}

# Function to wait for backend service
wait_for_backend() {
    local max_attempts=30
    local attempt=1
    
    log "Waiting for backend service at ${VITE_API_BASE_URL}..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${VITE_API_BASE_URL}/health" > /dev/null 2>&1; then
            log "Backend service is ready"
            return 0
        fi
        
        log "Backend not ready, attempt $attempt/$max_attempts"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "ERROR: Backend service failed to respond after $max_attempts attempts"
    return 1
}

# Function to configure nginx dynamically
configure_nginx() {
    log "Configuring nginx with environment variables..."
    
    # Replace placeholders in nginx config with environment variables
    if [ -n "$VITE_API_BASE_URL" ]; then
        backend_host=$(echo "$VITE_API_BASE_URL" | sed 's|http[s]*://||' | sed 's|/api.*||')
        sed -i "s/backend:8000/$backend_host/g" /etc/nginx/conf.d/default.conf
        log "Configured backend proxy to $backend_host"
    fi
    
    # Configure SSL if certificates are available
    if [ -f "/etc/nginx/ssl/cert.pem" ] && [ -f "/etc/nginx/ssl/key.pem" ]; then
        log "SSL certificates found, enabling HTTPS"
        sed -i 's/listen 80;/listen 443 ssl;\n    ssl_certificate \/etc\/nginx\/ssl\/cert.pem;\n    ssl_certificate_key \/etc\/nginx\/ssl\/key.pem;\n    ssl_protocols TLSv1.2 TLSv1.3;\n    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;\n    ssl_prefer_server_ciphers off;/' /etc/nginx/conf.d/default.conf
        sed -i 's/listen 80;/listen 80;\n    return 301 https:\/\/$host$request_uri;/' /etc/nginx/conf.d/default.conf
    fi
}

# Function to setup logging
setup_logging() {
    log "Setting up logging directories..."
    
    mkdir -p /var/log/nginx
    touch /var/log/nginx/docker-entrypoint.log
    
    # Ensure proper permissions
    chown -R nginx-app:nginx-app /var/log/nginx
    chmod 755 /var/log/nginx
    chmod 644 /var/log/nginx/docker-entrypoint.log
}

# Function to validate configuration
validate_config() {
    log "Validating nginx configuration..."
    
    if nginx -t; then
        log "Nginx configuration is valid"
    else
        log "ERROR: Nginx configuration is invalid"
        exit 1
    fi
}

# Function to setup health check
setup_health_check() {
    log "Setting up health check..."
    
    cat > /health-check.sh << 'EOF'
#!/bin/bash
# Health check script for the web application

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if the main application is accessible
if ! curl -f -s http://localhost/ > /dev/null; then
    echo "Application is not responding"
    exit 1
fi

# Check if API proxy is working (if backend is configured)
if [ -n "$VITE_API_BASE_URL" ]; then
    backend_host=$(echo "$VITE_API_BASE_URL" | sed 's|http[s]*://||' | sed 's|/api.*||')
    if ! curl -f -s "http://localhost/api/health" > /dev/null; then
        echo "Backend API is not accessible"
        exit 1
    fi
fi

echo "Health check passed"
exit 0
EOF
    
    chmod +x /health-check.sh
    log "Health check script created"
}

# Function to optimize for production
optimize_production() {
    log "Optimizing for production environment..."
    
    # Set appropriate file permissions
    chown -R nginx-app:nginx-app /usr/share/nginx/html
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;
    find /usr/share/nginx/html -type d -exec chmod 755 {} \;
    
    # Optimize nginx worker processes for container
    if [ -n "$NGINX_WORKER_PROCESSES" ]; then
        sed -i "s/worker_processes auto;/worker_processes $NGINX_WORKER_PROCESSES;/" /etc/nginx/nginx.conf
    fi
    
    # Optimize worker connections for container
    if [ -n "$NGINX_WORKER_CONNECTIONS" ]; then
        sed -i "s/worker_connections 1024;/worker_connections $NGINX_WORKER_CONNECTIONS;/" /etc/nginx/nginx.conf
    fi
}

# Function to setup monitoring
setup_monitoring() {
    if [ "$ENABLE_MONITORING" = "true" ]; then
        log "Setting up monitoring endpoints..."
        
        # Add monitoring endpoints to nginx config
        cat >> /etc/nginx/conf.d/default.conf << 'EOF'

    # Prometheus metrics endpoint
    location /metrics {
        access_log off;
        return 200 "nginx_up 1\n";
        add_header Content-Type text/plain;
    }
    
    # Application metrics
    location /app-stats {
        access_log off;
        add_header Content-Type application/json;
        return 200 '{"status": "healthy", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "version": "${APP_VERSION:-unknown}"}';
    }
EOF
    fi
}

# Main execution
main() {
    log "Starting Docker entrypoint..."
    
    # Setup logging
    setup_logging
    
    # Configure nginx
    configure_nginx
    
    # Setup health check
    setup_health_check
    
    # Validate configuration
    validate_config
    
    # Wait for backend (optional)
    if [ "$WAIT_FOR_BACKEND" = "true" ]; then
        wait_for_backend
    fi
    
    # Optimize for production
    optimize_production
    
    # Setup monitoring
    setup_monitoring
    
    log "Entrypoint setup completed successfully"
    
    # Execute the main command
    exec "$@"
}

# Handle signals gracefully
trap 'log "Received SIGTERM, shutting down gracefully..."; nginx -s quit; exit 0' TERM
trap 'log "Received SIGINT, shutting down gracefully..."; nginx -s quit; exit 0' INT

# Run main function
main "$@"