# Monitoring and Observability Configuration

This directory contains comprehensive monitoring and observability configurations for the Hydraulic Network Web Application, enabling proactive system management, performance optimization, and rapid issue resolution.

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Configuration Files](#configuration-files)
- [Metrics Collection](#metrics-collection)
- [Alerting Configuration](#alerting-configuration)
- [Log Management](#log-management)
- [Performance Monitoring](#performance-monitoring)
- [Health Checks](#health-checks)
- [Dashboard Configuration](#dashboard-configuration)
- [Usage Instructions](#usage-instructions)

## Overview

The monitoring and observability setup provides comprehensive insights into the application's health, performance, and user experience. It includes:

- **Application Performance Monitoring (APM)**: Track application performance and user experience
- **Infrastructure Monitoring**: Monitor server resources and container health
- **Log Aggregation**: Centralized logging for debugging and analysis
- **Alerting**: Proactive notifications for issues and anomalies
- **Dashboards**: Visual representation of key metrics and trends

## Monitoring Stack

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │     Grafana     │    │   AlertManager  │
│                 │    │                 │    │                 │
│ • Metrics DB    │    │ • Dashboards    │    │ • Alert Routing │
│ • Data Collection│    │ • Visualization │    │ • Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Loki        │
                    │                 │
                    │ • Log Aggregation│
                    │ • Log Storage   │
                    └─────────────────┘
```

### Additional Tools

- **Node Exporter**: System metrics collection
- **cAdvisor**: Container metrics collection
- **Blackbox Exporter**: External endpoint monitoring
- **Pushgateway**: Metrics aggregation
- **Jaeger**: Distributed tracing
- **Elasticsearch**: Log storage and search
- **Kibana**: Log visualization

## Configuration Files

### Prometheus Configuration

**File**: `prometheus.yml`
- Metrics scraping configuration
- Alert rules definition
- Recording rules setup
- Target discovery configuration

### Grafana Configuration

**Files**: 
- `grafana/dashboards/`: Pre-built dashboards
- `grafana/datasources/`: Data source configurations
- `grafana/alerts/`: Alert panel configurations

### AlertManager Configuration

**File**: `alertmanager.yml`
- Alert routing rules
- Notification channels
- Escalation policies
- Silence configurations

### Log Management

**Files**:
- `loki-config.yaml`: Loki configuration
- `promtail-config.yaml`: Log collector configuration
- `elasticsearch-config.yaml`: Elasticsearch settings

## Metrics Collection

### Application Metrics

#### Business Metrics
```yaml
# User Activity
user_sessions_total: "Total number of user sessions"
active_users_count: "Current active users"
user_engagement_score: "User interaction metrics"

# Application Usage
calculations_started_total: "Total calculations started"
calculations_completed_total: "Total calculations completed"
calculations_failed_total: "Total calculations failed"
average_calculation_time: "Average calculation duration"

# Feature Usage
configurations_created_total: "Configurations created"
results_exported_total: "Results exported"
charts_generated_total: "Charts generated"
```

#### Technical Metrics
```yaml
# Performance Metrics
response_time_p95: "95th percentile response time"
response_time_p99: "99th percentile response time"
throughput_requests_per_second: "Request rate"

# Error Metrics
error_rate_percentage: "Error rate as percentage"
error_count_by_type: "Error count by error type"
failed_requests_total: "Total failed requests"

# Resource Metrics
memory_usage_percentage: "Memory usage percentage"
cpu_usage_percentage: "CPU usage percentage"
disk_usage_percentage: "Disk usage percentage"
```

### Infrastructure Metrics

#### System Metrics
```yaml
# Hardware
system_cpu_usage: "System CPU usage"
system_memory_usage: "System memory usage"
system_disk_usage: "System disk usage"
system_network_io: "System network I/O"

# Container Metrics
container_cpu_usage: "Container CPU usage"
container_memory_usage: "Container memory usage"
container_network_io: "Container network I/O"
container_disk_io: "Container disk I/O"
```

#### Service Metrics
```yaml
# Web Server
nginx_requests_total: "Total nginx requests"
nginx_request_duration: "Nginx request duration"
nginx_upstream_response_time: "Upstream response time"

# API Server
api_requests_total: "Total API requests"
api_response_time: "API response time"
api_error_rate: "API error rate"

# Database
db_connections_active: "Active database connections"
db_query_duration: "Database query duration"
db_connection_pool: "Connection pool metrics"
```

## Alerting Configuration

### Alert Categories

#### Critical Alerts (P0)
```yaml
# System Down
service_down: "Service is not responding"
database_down: "Database is not accessible"
high_error_rate: "Error rate above 5%"
response_time_critical: "Response time above 30 seconds"

# Resource Exhaustion
disk_space_critical: "Disk space below 10%"
memory_critical: "Memory usage above 95%"
cpu_critical: "CPU usage above 95%"
```

#### Warning Alerts (P1)
```yaml
# Performance Degradation
response_time_warning: "Response time above 10 seconds"
error_rate_warning: "Error rate above 1%"
high_latency: "Network latency above threshold"

# Resource Usage
disk_space_warning: "Disk space below 25%"
memory_warning: "Memory usage above 80%"
cpu_warning: "CPU usage above 80%"
```

#### Informational Alerts (P2)
```yaml
# Capacity Planning
storage_trend: "Storage growth trend"
user_growth: "User growth trend"
feature_usage: "Feature usage trends"

# Maintenance
certificate_expiry: "SSL certificate expiry"
backup_status: "Backup status"
dependency_updates: "Dependency update notifications"
```

### Notification Channels

#### Email Notifications
```yaml
email_configs:
  - to: 'devops@company.com'
    subject: '[{{ .Status }}] {{ .GroupLabels.alertname }}'
    body: |
      Alert: {{ .GroupLabels.alertname }}
      Status: {{ .Status }}
      Description: {{ .CommonAnnotations.description }}
      Details: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}
```

#### Slack Notifications
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/...'
    channel: '#alerts'
    title: '{{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

#### PagerDuty Integration
```yaml
pagerduty_configs:
  - routing_key: 'your-routing-key'
    description: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'
```

## Log Management

### Log Levels and Categories

```yaml
# Application Logs
DEBUG: "Detailed debugging information"
INFO: "General information"
WARN: "Warning messages"
ERROR: "Error conditions"
FATAL: "Fatal error conditions"

# System Logs
ACCESS_LOGS: "HTTP access logs"
ERROR_LOGS: "Application error logs"
SECURITY_LOGS: "Security-related logs"
PERFORMANCE_LOGS: "Performance metrics logs"
```

### Log Format

```json
{
  "timestamp": "2023-12-07T10:30:00Z",
  "level": "INFO",
  "service": "webapp",
  "component": "calculation",
  "message": "Calculation completed successfully",
  "user_id": "user-123",
  "session_id": "session-456",
  "duration": 2.5,
  "metadata": {
    "calculation_id": "calc-789",
    "network_size": 15,
    "convergence_iterations": 45
  }
}
```

### Log Aggregation

#### Loki Configuration
```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

# By default, Loki will send anonymous, but uniquely-identifiable usage and configuration
# analytics to Grafana Labs. These statistics are sent to https://stats.grafana.org/
#
# Statistics help us better understand how Loki is used, and they inform product decisions.
# No IP addresses or request values are recorded.
# Only the total number of requests per endpoint, and the configuration settings are recorded.
# To disable reporting, uncomment the following line:
#analytics:
#  reporting_enabled: false
```

## Performance Monitoring

### Key Performance Indicators (KPIs)

#### User Experience Metrics
```yaml
# Page Performance
page_load_time: "Time to load main application"
time_to_first_byte: "Time to first byte from server"
time_to_interactive: "Time to interactive state"
largest_contentful_paint: "LCP metric for user experience"
cumulative_layout_shift: "CLS metric for visual stability"

# Application Performance
calculation_completion_rate: "Percentage of successful calculations"
calculation_response_time: "Time from request to results"
api_response_time: "API endpoint response times"
error_free_user_journey: "Percentage of error-free user sessions"
```

#### System Performance Metrics
```yaml
# Backend Performance
api_throughput: "API requests per second"
database_query_time: "Average database query duration"
cache_hit_ratio: "Cache effectiveness"
memory_utilization: "Application memory usage"
cpu_utilization: "Application CPU usage"

# Frontend Performance
bundle_size: "JavaScript bundle size"
resource_load_time: "Static resource loading time"
render_blocking_time: "Time blocking page rendering"
client_side_errors: "JavaScript errors in browser"
```

### Performance Budgets

```yaml
# Page Load Budget
max_page_load_time: "3 seconds"
max_bundle_size: "2MB"
max_api_response_time: "500ms"
min_cache_hit_ratio: "90%"

# User Experience Budget
max_calculation_time: "30 seconds"
max_error_rate: "1%"
min_uptime: "99.9%"
max_time_to_first_calculation: "10 seconds"
```

## Health Checks

### Application Health Checks

#### Liveness Probe
```yaml
liveness_probe:
  endpoint: "/health"
  interval: 30s
  timeout: 10s
  threshold: 3
  success_criteria:
    - status_code: 200
    - response_body: "healthy"
    - response_time: < 5s
```

#### Readiness Probe
```yaml
readiness_probe:
  endpoint: "/ready"
  interval: 10s
  timeout: 5s
  threshold: 2
  success_criteria:
    - status_code: 200
    - all_dependencies_healthy: true
    - configuration_valid: true
```

### Infrastructure Health Checks

#### Database Connectivity
```yaml
database_health:
  check_interval: 30s
  timeout: 5s
  query: "SELECT 1"
  expected_result: 1
  max_connection_age: "1h"
```

#### External Service Connectivity
```yaml
external_services:
  api_backend:
    url: "http://backend:8000/health"
    interval: 60s
    timeout: 10s
  file_storage:
    url: "http://minio:9000/minio/health/live"
    interval: 30s
    timeout: 5s
  message_queue:
    url: "http://redis:6379"
    interval: 30s
    timeout: 5s
```

## Dashboard Configuration

### Pre-built Dashboards

#### Application Overview Dashboard
```yaml
dashboard_id: app-overview
panels:
  - title: "Application Health"
    type: "stat"
    targets:
      - expr: up{job="webapp"}
  - title: "Request Rate"
    type: "graph"
    targets:
      - expr: rate(http_requests_total[5m])
  - title: "Error Rate"
    type: "graph"
    targets:
      - expr: rate(http_requests_total{status=~"5.."}[5m])
  - title: "Response Time"
    type: "graph"
    targets:
      - expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### Performance Dashboard
```yaml
dashboard_id: performance
panels:
  - title: "Page Load Times"
    type: "graph"
    targets:
      - expr: histogram_quantile(0.95, rate(page_load_duration_bucket[5m]))
  - title: "API Response Times"
    type: "graph"
    targets:
      - expr: histogram_quantile(0.95, rate(api_response_duration_bucket[5m]))
  - title: "Calculation Performance"
    type: "graph"
    targets:
      - expr: histogram_quantile(0.95, rate(calculation_duration_bucket[5m]))
```

#### Infrastructure Dashboard
```yaml
dashboard_id: infrastructure
panels:
  - title: "CPU Usage"
    type: "graph"
    targets:
      - expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
  - title: "Memory Usage"
    type: "graph"
    targets:
      - expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
  - title: "Disk Usage"
    type: "graph"
    targets:
      - expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

## Usage Instructions

### Local Development

1. **Start monitoring stack**:
   ```bash
   docker-compose -f monitoring/docker-compose.monitoring.yml up -d
   ```

2. **Access services**:
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090
   - AlertManager: http://localhost:9093
   - Loki: http://localhost:3100

3. **Import dashboards**:
   - Navigate to Grafana
   - Import dashboards from `monitoring/grafana/dashboards/`

### Production Deployment

1. **Configure monitoring stack**:
   ```bash
   cp monitoring/prometheus.yml.prod monitoring/prometheus.yml
   cp monitoring/grafana-config.yml.prod monitoring/grafana-config.yml
   ```

2. **Deploy with application**:
   ```bash
   docker-compose -f docker-compose.prod.yml -f monitoring/docker-compose.monitoring.yml up -d
   ```

3. **Configure alerts**:
   - Update notification channels in `alertmanager.yml`
   - Test alert routing
   - Set up escalation policies

### Customization

1. **Add custom metrics**:
   - Update application code to expose metrics
   - Add Prometheus scrape targets
   - Create Grafana panels

2. **Create custom alerts**:
   - Add alert rules to `prometheus.yml`
   - Configure notification channels
   - Test alert firing

3. **Build custom dashboards**:
   - Use Grafana web interface
   - Import/export dashboard JSON
   - Share with team

## Best Practices

### Monitoring Strategy
- Monitor business-critical functionality first
- Set appropriate alert thresholds
- Use SLIs and SLOs for measurement
- Regularly review and update monitoring

### Alert Management
- Avoid alert fatigue with appropriate thresholds
- Use clear, actionable alert messages
- Implement proper escalation procedures
- Regularly test alert effectiveness

### Performance Optimization
- Set performance budgets and monitor adherence
- Use real user monitoring (RUM)
- Track key user journeys
- Optimize based on actual usage patterns

### Log Management
- Use structured logging format
- Implement proper log rotation
- Avoid logging sensitive information
- Use log levels appropriately

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Analyze application memory
kubectl top pods (for Kubernetes)

# Check for memory leaks
# Monitor memory trends in Grafana
```

#### High Error Rate
```bash
# Check error logs
docker logs <container_name>

# Analyze error patterns
# Use Loki/Grafana for log analysis

# Check application metrics
# Monitor error rates in dashboards
```

#### Slow Response Times
```bash
# Check performance metrics
# Analyze response time percentiles

# Identify bottlenecks
# Monitor database query times
# Check external service response times
```

### Debug Mode
Enable debug mode for detailed monitoring:
```bash
# Set environment variable
DEBUG=monitoring npm run dev

# Check debug logs
docker logs <monitoring_container> --tail 100
```

## Support

For monitoring-related issues:

1. Check Grafana dashboards for current status
2. Review Prometheus alerts and firing rules
3. Check application and system logs
4. Contact DevOps team for infrastructure issues

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Application Performance Monitoring Best Practices](https://example.com/apm-best-practices)