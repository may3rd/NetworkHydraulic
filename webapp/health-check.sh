#!/bin/bash
# Health check script for Hydraulic Network Web Application Docker container

# Configuration
TIMEOUT=10
HTTP_CODE=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Function to check if nginx process is running
check_nginx_process() {
    log "Checking nginx process..."
    
    if pgrep nginx > /dev/null; then
        log "✓ Nginx process is running"
        return 0
    else
        error "✗ Nginx process is not running"
        return 1
    fi
}

# Function to check nginx configuration
check_nginx_config() {
    log "Checking nginx configuration..."
    
    if nginx -t -q 2>/dev/null; then
        log "✓ Nginx configuration is valid"
        return 0
    else
        error "✗ Nginx configuration is invalid"
        return 1
    fi
}

# Function to check if main application is accessible
check_application() {
    log "Checking application accessibility..."
    
    # Check if index.html is accessible
    if curl -f -s --max-time $TIMEOUT http://localhost/ > /dev/null; then
        log "✓ Application main page is accessible"
        return 0
    else
        error "✗ Application main page is not accessible"
        return 1
    fi
}

# Function to check static assets
check_static_assets() {
    log "Checking static assets..."
    
    local assets=("favicon.ico" "manifest.json" "robots.txt")
    local failed=0
    
    for asset in "${assets[@]}"; do
        if curl -f -s --max-time $TIMEOUT http://localhost/$asset > /dev/null; then
            log "✓ $asset is accessible"
        else
            warn "⚠ $asset is not accessible (may be optional)"
        fi
    done
    
    return 0
}

# Function to check API connectivity (if configured)
check_api_connectivity() {
    log "Checking API connectivity..."
    
    # Check if API_BASE_URL is set
    if [ -z "$VITE_API_BASE_URL" ]; then
        log "⚠ No API_BASE_URL configured, skipping API check"
        return 0
    fi
    
    # Extract backend host from API URL
    backend_host=$(echo "$VITE_API_BASE_URL" | sed 's|http[s]*://||' | sed 's|/api.*||')
    
    if curl -f -s --max-time $TIMEOUT http://localhost/api/health > /dev/null 2>&1; then
        log "✓ API is accessible via nginx proxy"
        return 0
    else
        # Try direct backend connection
        if curl -f -s --max-time $TIMEOUT http://$backend_host/health > /dev/null 2>&1; then
            log "✓ Backend is accessible directly"
            warn "⚠ API proxy may not be configured correctly"
            return 1
        else
            error "✗ Backend is not accessible"
            return 1
        fi
    fi
}

# Function to check WebSocket connectivity (if configured)
check_websocket_connectivity() {
    log "Checking WebSocket connectivity..."
    
    if [ -z "$VITE_WEBSOCKET_URL" ]; then
        log "⚠ No WEBSOCKET_URL configured, skipping WebSocket check"
        return 0
    fi
    
    # Note: WebSocket health check is complex in bash
    # For now, we'll check if the WebSocket endpoint responds to HTTP
    ws_host=$(echo "$VITE_WEBSOCKET_URL" | sed 's|ws[s]*://||' | sed 's|/ws.*||')
    
    if curl -f -s --max-time $TIMEOUT http://$ws_host/ws > /dev/null 2>&1; then
        log "✓ WebSocket endpoint is accessible"
        return 0
    else
        warn "⚠ WebSocket endpoint may not be accessible"
        return 0  # Don't fail health check for WebSocket issues
    fi
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."
    
    # Check if we have enough disk space for logs and temporary files
    available_kb=$(df / | tail -1 | awk '{print $4}')
    available_mb=$((available_kb / 1024))
    
    if [ $available_mb -gt 100 ]; then
        log "✓ Sufficient disk space available ($available_mb MB)"
        return 0
    else
        warn "⚠ Low disk space ($available_mb MB)"
        return 0  # Don't fail health check for low disk space
    fi
}

# Function to check memory usage
check_memory_usage() {
    log "Checking memory usage..."
    
    # Check available memory
    if [ -f /proc/meminfo ]; then
        available_kb=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        available_mb=$((available_kb / 1024))
        
        if [ $available_mb -gt 50 ]; then
            log "✓ Sufficient memory available ($available_mb MB)"
            return 0
        else
            warn "⚠ Low memory available ($available_mb MB)"
            return 0  # Don't fail health check for low memory
        fi
    fi
    
    return 0
}

# Function to check nginx worker processes
check_nginx_workers() {
    log "Checking nginx worker processes..."
    
    worker_count=$(pgrep nginx | wc -l)
    
    if [ $worker_count -ge 2 ]; then
        log "✓ Nginx has $worker_count worker processes"
        return 0
    else
        error "✗ Nginx has insufficient worker processes ($worker_count)"
        return 1
    fi
}

# Function to check log files
check_log_files() {
    log "Checking log files..."
    
    # Check if log directory exists and is writable
    if [ -d "/var/log/nginx" ] && [ -w "/var/log/nginx" ]; then
        log "✓ Log directory is accessible"
        
        # Check for recent log entries
        if [ -f "/var/log/nginx/access.log" ]; then
            recent_entries=$(tail -10 /var/log/nginx/access.log | wc -l)
            if [ $recent_entries -gt 0 ]; then
                log "✓ Recent log entries found"
            else
                warn "⚠ No recent log entries found"
            fi
        fi
        
        return 0
    else
        error "✗ Log directory is not accessible"
        return 1
    fi
}

# Function to run all health checks
run_health_checks() {
    local failed_checks=0
    local total_checks=0
    
    log "Starting health checks for Hydraulic Network Web Application..."
    
    # Define all health check functions
    declare -a checks=(
        "check_nginx_process"
        "check_nginx_config"
        "check_application"
        "check_static_assets"
        "check_api_connectivity"
        "check_websocket_connectivity"
        "check_disk_space"
        "check_memory_usage"
        "check_nginx_workers"
        "check_log_files"
    )
    
    # Run each check
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        
        if $check; then
            log "✓ $check passed"
        else
            error "✗ $check failed"
            failed_checks=$((failed_checks + 1))
        fi
        
        echo  # Add spacing between checks
    done
    
    # Summary
    log "Health check summary: $((total_checks - failed_checks))/$total_checks checks passed"
    
    if [ $failed_checks -eq 0 ]; then
        log "✓ All health checks passed"
        return 0
    else
        error "✗ $failed_checks health check(s) failed"
        return 1
    fi
}

# Function to output JSON health status
output_json_status() {
    local status=$1
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local version=${APP_VERSION:-"unknown"}
    
    cat << EOF
{
  "status": "$([ $status -eq 0 ] && echo "healthy" || echo "unhealthy")",
  "timestamp": "$timestamp",
  "version": "$version",
  "checks": {
    "nginx_process": $([ "$(pgrep nginx)" ] && echo "true" || echo "false"),
    "nginx_config": $([ "$(nginx -t -q 2>/dev/null)" ] && echo "true" || echo "false"),
    "application": $([ "$(curl -f -s --max-time 5 http://localhost/ >/dev/null && echo "ok")" ] && echo "true" || echo "false")
  }
}
EOF
}

# Main execution
main() {
    # Parse command line arguments
    case "${1:-}" in
        --json)
            run_health_checks
            output_json_status $?
            ;;
        --verbose|-v)
            set -x
            run_health_checks
            ;;
        --help|-h)
            echo "Health check script for Hydraulic Network Web Application"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --json    Output health status in JSON format"
            echo "  --verbose Enable verbose output"
            echo "  --help    Show this help message"
            echo ""
            echo "Exit codes:"
            echo "  0   All health checks passed"
            echo "  1   One or more health checks failed"
            ;;
        *)
            run_health_checks
            ;;
    esac
    
    exit $?
}

# Handle signals gracefully
trap 'log "Health check interrupted"; exit 130' INT TERM

# Run main function with all arguments
main "$@"