#!/usr/bin/env node

/**
 * Comprehensive Health Check Script for Hydraulic Network Web Application
 * 
 * This script performs comprehensive health checks for the application,
 * including service availability, performance metrics, and system health.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const config = {
  // Service endpoints to check
  endpoints: {
    webapp: {
      url: process.env.HEALTHCHECK_WEBAPP_URL || 'http://localhost:3000',
      path: '/health',
      timeout: 5000,
      expectedStatus: 200
    },
    api: {
      url: process.env.HEALTHCHECK_API_URL || 'http://localhost:8000',
      path: '/api/health',
      timeout: 5000,
      expectedStatus: 200
    },
    websocket: {
      url: process.env.HEALTHCHECK_WEBSOCKET_URL || 'ws://localhost:8000',
      path: '/ws',
      timeout: 5000
    }
  },
  
  // System thresholds
  thresholds: {
    memoryUsage: 80, // Percentage
    cpuUsage: 80, // Percentage
    diskUsage: 80, // Percentage
    responseTime: 3000 // Milliseconds
  },
  
  // Check intervals
  intervals: {
    quick: 30000, // 30 seconds
    detailed: 300000 // 5 minutes
  }
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  critical: (msg) => console.log(`${colors.red}${colors.bold}🚨${colors.reset} ${msg}`)
};

// Health check results
let results = {
  timestamp: new Date().toISOString(),
  overall: 'unknown',
  services: {},
  system: {},
  performance: {},
  alerts: []
};

/**
 * Make HTTP request to endpoint
 */
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path || '/', options.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: options.timeout || 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - req.startTime
        });
      });
    });
    
    req.startTime = Date.now();
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Check service availability
 */
async function checkService(name, config) {
  const startTime = Date.now();
  
  try {
    const result = await httpRequest(config);
    const responseTime = result.responseTime;
    
    const healthCheck = {
      name,
      status: 'healthy',
      responseTime,
      statusCode: result.status,
      message: 'Service is responding',
      timestamp: new Date().toISOString()
    };
    
    // Check if status code matches expected
    if (result.status !== config.expectedStatus) {
      healthCheck.status = 'unhealthy';
      healthCheck.message = `Unexpected status code: ${result.status}`;
      results.alerts.push({
        severity: 'warning',
        service: name,
        message: healthCheck.message
      });
    }
    
    // Check response time
    if (responseTime > config.thresholds?.responseTime) {
      healthCheck.status = 'degraded';
      healthCheck.message = `Slow response time: ${responseTime}ms`;
      results.alerts.push({
        severity: 'warning',
        service: name,
        message: healthCheck.message
      });
    }
    
    results.services[name] = healthCheck;
    return healthCheck;
    
  } catch (error) {
    const healthCheck = {
      name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      statusCode: null,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    results.services[name] = healthCheck;
    results.alerts.push({
      severity: 'critical',
      service: name,
      message: `Service unavailable: ${error.message}`
    });
    
    return healthCheck;
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  const system = {
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
    },
    cpu: {
      count: os.cpus().length,
      model: os.cpus()[0].model,
      speed: os.cpus()[0].speed
    },
    load: os.loadavg(),
    uptime: os.uptime()
  };
  
  // Calculate memory usage percentage
  const memoryUsagePercent = Math.round((system.memory.used / system.memory.total) * 100);
  
  // Calculate CPU usage (simplified)
  const cpuUsagePercent = system.load[0] / system.cpu.count * 100;
  
  system.memory.usagePercent = memoryUsagePercent;
  system.cpu.usagePercent = Math.min(cpuUsagePercent, 100);
  
  // Check thresholds
  const alerts = [];
  
  if (memoryUsagePercent > config.thresholds.memoryUsage) {
    alerts.push({
      severity: 'warning',
      component: 'memory',
      message: `High memory usage: ${memoryUsagePercent}%`
    });
  }
  
  if (cpuUsagePercent > config.thresholds.cpuUsage) {
    alerts.push({
      severity: 'warning',
      component: 'cpu',
      message: `High CPU usage: ${cpuUsagePercent.toFixed(1)}%`
    });
  }
  
  results.system = system;
  results.alerts.push(...alerts);
  
  return system;
}

/**
 * Check disk usage
 */
function checkDiskUsage() {
  try {
    const stats = fs.statSync(process.cwd());
    const disk = {
      path: process.cwd(),
      free: 0, // Would need platform-specific implementation
      total: 0, // Would need platform-specific implementation
      usagePercent: 0
    };
    
    results.system.disk = disk;
    return disk;
  } catch (error) {
    log.error(`Disk check failed: ${error.message}`);
    return null;
  }
}

/**
 * Check application specific metrics
 */
async function checkApplicationMetrics() {
  const performance = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  
  // Check Node.js memory usage
  const heapUsedPercent = Math.round((performance.memoryUsage.heapUsed / performance.memoryUsage.heapTotal) * 100);
  
  if (heapUsedPercent > 80) {
    results.alerts.push({
      severity: 'warning',
      component: 'nodejs',
      message: `High heap usage: ${heapUsedPercent}%`
    });
  }
  
  results.performance = performance;
  return performance;
}

/**
 * Generate health report
 */
function generateReport() {
  const report = {
    ...results,
    summary: {
      totalServices: Object.keys(results.services).length,
      healthyServices: Object.values(results.services).filter(s => s.status === 'healthy').length,
      degradedServices: Object.values(results.services).filter(s => s.status === 'degraded').length,
      unhealthyServices: Object.values(results.services).filter(s => s.status === 'unhealthy').length,
      totalAlerts: results.alerts.length,
      criticalAlerts: results.alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: results.alerts.filter(a => a.severity === 'warning').length
    }
  };
  
  // Determine overall status
  if (report.summary.unhealthyServices > 0) {
    report.overall = 'unhealthy';
  } else if (report.summary.degradedServices > 0 || report.summary.criticalAlerts > 0) {
    report.overall = 'degraded';
  } else {
    report.overall = 'healthy';
  }
  
  return report;
}

/**
 * Display health check results
 */
function displayResults(report) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}Hydraulic Network Web Application - Health Check${colors.reset}`);
  console.log('='.repeat(60));
  
  // Overall status
  const statusIcon = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌'
  };
  
  console.log(`\n${colors.bold}Overall Status: ${statusIcon[report.overall]} ${report.overall.toUpperCase()}${colors.reset}\n`);
  
  // Service status
  console.log(`${colors.bold}Services:${colors.reset}`);
  Object.entries(report.services).forEach(([name, service]) => {
    const icon = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌'
    };
    
    console.log(`  ${icon[service.status]} ${name}: ${service.status} (${service.responseTime}ms)`);
    if (service.message !== 'Service is responding') {
      console.log(`    ${colors.yellow}  ⚠️ ${service.message}${colors.reset}`);
    }
  });
  
  // System resources
  console.log(`\n${colors.bold}System Resources:${colors.reset}`);
  if (report.system.memory) {
    console.log(`  Memory: ${report.system.memory.used}MB / ${report.system.memory.total}MB (${report.system.memory.usagePercent}%)`);
  }
  if (report.system.cpu) {
    console.log(`  CPU: ${report.system.cpu.usagePercent.toFixed(1)}% (${report.system.cpu.count} cores)`);
  }
  console.log(`  Uptime: ${Math.floor(report.system.uptime / 3600)}h ${Math.floor((report.system.uptime % 3600) / 60)}m`);
  
  // Alerts
  if (report.alerts.length > 0) {
    console.log(`\n${colors.bold}Alerts:${colors.reset}`);
    report.alerts.forEach(alert => {
      const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.log(`  ${icon} [${alert.severity.toUpperCase()}] ${alert.service || alert.component}: ${alert.message}`);
    });
  } else {
    console.log(`\n${colors.green}✅ No alerts - all systems operating normally${colors.reset}`);
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Save health check report
 */
function saveReport(report) {
  try {
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `health-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    log.info(`Report saved to: ${filepath}`);
    
    // Keep only last 100 reports
    const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('health-report-'));
    if (files.length > 100) {
      const toDelete = files
        .map(f => ({ name: f, time: fs.statSync(path.join(reportsDir, f)).mtime }))
        .sort((a, b) => a.time - b.time)
        .slice(0, files.length - 100)
        .map(f => f.name);
      
      toDelete.forEach(file => {
        fs.unlinkSync(path.join(reportsDir, file));
        log.info(`Deleted old report: ${file}`);
      });
    }
  } catch (error) {
    log.error(`Failed to save report: ${error.message}`);
  }
}

/**
 * Export metrics in Prometheus format
 */
function exportPrometheusMetrics(report) {
  let metrics = '';
  
  // Overall status
  const statusValue = { healthy: 1, degraded: 0.5, unhealthy: 0 };
  metrics += `app_health_status ${statusValue[report.overall]}\n`;
  
  // Service metrics
  Object.entries(report.services).forEach(([name, service]) => {
    const statusValue = { healthy: 1, degraded: 0.5, unhealthy: 0 };
    metrics += `app_service_status{service="${name}"} ${statusValue[service.status]}\n`;
    metrics += `app_service_response_time_ms{service="${name}"} ${service.responseTime}\n`;
  });
  
  // System metrics
  if (report.system.memory) {
    metrics += `system_memory_usage_percent ${report.system.memory.usagePercent}\n`;
    metrics += `system_memory_total_mb ${report.system.memory.total}\n`;
    metrics += `system_memory_free_mb ${report.system.memory.free}\n`;
  }
  
  if (report.system.cpu) {
    metrics += `system_cpu_usage_percent ${report.system.cpu.usagePercent}\n`;
    metrics += `system_cpu_cores ${report.system.cpu.count}\n`;
  }
  
  // Performance metrics
  if (report.performance.memoryUsage) {
    metrics += `nodejs_heap_used_mb ${Math.round(report.performance.memoryUsage.heapUsed / 1024 / 1024)}\n`;
    metrics += `nodejs_heap_total_mb ${Math.round(report.performance.memoryUsage.heapTotal / 1024 / 1024)}\n`;
  }
  
  return metrics;
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  log.info('Starting health check...');
  
  try {
    // Check services
    log.info('Checking services...');
    const servicePromises = Object.entries(config.endpoints).map(([name, config]) => 
      checkService(name, config)
    );
    await Promise.allSettled(servicePromises);
    
    // Check system resources
    log.info('Checking system resources...');
    checkSystemResources();
    checkDiskUsage();
    
    // Check application metrics
    log.info('Checking application metrics...');
    await checkApplicationMetrics();
    
    // Generate and display report
    const report = generateReport();
    displayResults(report);
    
    // Save report
    saveReport(report);
    
    // Export metrics (if requested)
    if (process.argv.includes('--prometheus')) {
      const metrics = exportPrometheusMetrics(report);
      console.log('\nPrometheus Metrics:');
      console.log(metrics);
    }
    
    // Exit with appropriate code
    process.exit(report.overall === 'healthy' ? 0 : 1);
    
  } catch (error) {
    log.critical(`Health check failed: ${error.message}`);
    process.exit(2);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Hydraulic Network Web Application - Health Check Script

Usage: node healthcheck.js [options]

Options:
  --help, -h          Show this help message
  --prometheus        Export metrics in Prometheus format
  --json              Output results in JSON format
  --config <file>     Use custom configuration file

Environment Variables:
  HEALTHCHECK_WEBAPP_URL    Web application URL (default: http://localhost:3000)
  HEALTHCHECK_API_URL       API URL (default: http://localhost:8000)
  HEALTHCHECK_WEBSOCKET_URL WebSocket URL (default: ws://localhost:8000)

Examples:
  node healthcheck.js                    # Run health check
  node healthcheck.js --prometheus       # Export Prometheus metrics
  node healthcheck.js --json > report.json  # Save JSON report
`);
  process.exit(0);
}

// Run health check
if (require.main === module) {
  runHealthCheck().catch(error => {
    console.error('Fatal error:', error);
    process.exit(2);
  });
}

module.exports = { runHealthCheck, exportPrometheusMetrics, config };