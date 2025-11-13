#!/usr/bin/env node

/**
 * Metrics Collection Script for Hydraulic Network Web Application
 * 
 * This script collects various metrics from the application including
 * performance metrics, system metrics, and business metrics.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Metrics collection intervals
  intervals: {
    system: 60000,    // 1 minute
    performance: 30000, // 30 seconds
    business: 300000,  // 5 minutes
    custom: 120000     // 2 minutes
  },
  
  // Storage configuration
  storage: {
    directory: path.join(__dirname, 'data'),
    retentionDays: 30,
    maxSizeMB: 100
  },
  
  // Export formats
  formats: {
    json: true,
    csv: true,
    prometheus: true
  },
  
  // Metrics to collect
  metrics: {
    system: true,
    performance: true,
    business: true,
    custom: true
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
  metric: (msg) => console.log(`${colors.green}[METRIC]${colors.reset} ${msg}`)
};

// Metrics storage
class MetricsCollector {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      system: {},
      performance: {},
      business: {},
      custom: {}
    };
    
    this.initStorage();
  }
  
  initStorage() {
    if (!fs.existsSync(config.storage.directory)) {
      fs.mkdirSync(config.storage.directory, { recursive: true });
    }
  }
  
  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const system = {
      // Memory metrics
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      
      // CPU metrics
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0].model,
        speed: os.cpus()[0].speed,
        usage: this.getCPUUsage()
      },
      
      // Load average
      load: {
        load1: os.loadavg()[0],
        load5: os.loadavg()[1],
        load15: os.loadavg()[2],
        loadPercent: Math.round((os.loadavg()[0] / os.cpus().length) * 100)
      },
      
      // Uptime
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      
      // Platform info
      platform: {
        os: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname()
      }
    };
    
    this.metrics.system = system;
    return system;
  }
  
  /**
   * Get CPU usage (simplified implementation)
   */
  getCPUUsage() {
    const startUsage = process.cpuUsage();
    const startTime = process.hrtime.bigint();
    
    // Small delay to measure CPU usage
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const endTime = process.hrtime.bigint();
      
      const userDiff = endUsage.user - startUsage.user;
      const systemDiff = endUsage.system - startUsage.system;
      const totalDiff = userDiff + systemDiff;
      const timeDiff = Number(endTime - startTime) / 1000000; // Convert to microseconds
      
      const cpuUsage = {
        user: userDiff,
        system: systemDiff,
        percentage: Math.round((totalDiff / timeDiff) * 100)
      };
      
      return cpuUsage;
    }, 100);
    
    return { user: 0, system: 0, percentage: 0 };
  }
  
  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const performance = {
      // Node.js process metrics
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      },
      
      // V8 engine metrics
      v8: (() => {
        try {
          const v8 = require('v8');
          const heapStats = v8.getHeapStatistics();
          return {
            heap: {
              total: heapStats.total_heap_size,
              used: heapStats.used_heap_size,
              available: heapStats.total_available_size,
              usagePercent: Math.round((heapStats.used_heap_size / heapStats.total_heap_size) * 100)
            },
            code: {
              space: heapStats.code_space_size,
              committed: heapStats.committed_heap_size
            }
          };
        } catch (error) {
          return null;
        }
      })(),
      
      // Event loop metrics
      eventLoop: this.getEventLoopMetrics(),
      
      // Network metrics
      network: this.getNetworkMetrics()
    };
    
    this.metrics.performance = performance;
    return performance;
  }
  
  /**
   * Get event loop metrics
   */
  getEventLoopMetrics() {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      
      this.metrics.performance.eventLoop = {
        lag: Math.round(lag * 100) / 100, // Round to 2 decimal places
        timestamp: new Date().toISOString()
      };
    });
    
    return { lag: 0, timestamp: new Date().toISOString() };
  }
  
  /**
   * Get network interface metrics
   */
  getNetworkMetrics() {
    try {
      const networkInterfaces = os.networkInterfaces();
      const network = {};
      
      Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        network[interfaceName] = interfaces.map(iface => ({
          address: iface.address,
          family: iface.family,
          internal: iface.internal
        }));
      });
      
      return network;
    } catch (error) {
      return {};
    }
  }
  
  /**
   * Collect business metrics
   */
  collectBusinessMetrics() {
    const business = {
      // Application metrics
      application: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
      },
      
      // User activity (would need integration with actual application data)
      users: {
        active: this.getMockActiveUsers(),
        sessions: this.getMockSessions(),
        pageViews: this.getMockPageViews()
      },
      
      // Calculation metrics (mock data)
      calculations: {
        total: this.getMockCalculationCount(),
        successful: this.getMockSuccessfulCalculations(),
        failed: this.getMockFailedCalculations(),
        averageTime: this.getMockAverageCalculationTime()
      },
      
      // API metrics (mock data)
      api: {
        requests: this.getMockApiRequests(),
        errors: this.getMockApiErrors(),
        responseTime: this.getMockApiResponseTime()
      }
    };
    
    this.metrics.business = business;
    return business;
  }
  
  /**
   * Mock data methods (replace with actual data collection)
   */
  getMockActiveUsers() {
    return Math.floor(Math.random() * 100) + 10;
  }
  
  getMockSessions() {
    return Math.floor(Math.random() * 50) + 5;
  }
  
  getMockPageViews() {
    return Math.floor(Math.random() * 1000) + 100;
  }
  
  getMockCalculationCount() {
    return Math.floor(Math.random() * 1000) + 100;
  }
  
  getMockSuccessfulCalculations() {
    return Math.floor(Math.random() * 900) + 90;
  }
  
  getMockFailedCalculations() {
    return Math.floor(Math.random() * 50) + 1;
  }
  
  getMockAverageCalculationTime() {
    return Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
  }
  
  getMockApiRequests() {
    return Math.floor(Math.random() * 1000) + 100;
  }
  
  getMockApiErrors() {
    return Math.floor(Math.random() * 50) + 1;
  }
  
  getMockApiResponseTime() {
    return Math.floor(Math.random() * 1000) + 100; // 100ms-1.1s
  }
  
  /**
   * Collect custom metrics
   */
  collectCustomMetrics() {
    const custom = {
      // Application-specific metrics
      app: {
        config: {
          version: process.env.VITE_APP_VERSION || '1.0.0',
          environment: process.env.VITE_APP_ENVIRONMENT || 'development'
        },
        features: {
          realtime: process.env.VITE_ENABLE_REAL_TIME === 'true',
          analytics: process.env.VITE_ENABLE_ANALYTICS === 'true',
          offline: process.env.VITE_ENABLE_OFFLINE_MODE === 'true'
        }
      },
      
      // Docker container metrics (if running in Docker)
      docker: this.getDockerMetrics(),
      
      // Disk usage metrics
      disk: this.getDiskMetrics()
    };
    
    this.metrics.custom = custom;
    return custom;
  }
  
  /**
   * Get Docker container metrics
   */
  getDockerMetrics() {
    try {
      // Check if running in Docker
      if (fs.existsSync('/.dockerenv')) {
        const containerId = fs.readFileSync('/proc/self/cgroup', 'utf8')
          .split('\n')[0]
          .split('/')
          .pop();
          
        return {
          runningInDocker: true,
          containerId: containerId || 'unknown',
          cgroup: true
        };
      }
      
      return { runningInDocker: false };
    } catch (error) {
      return { runningInDocker: false, error: error.message };
    }
  }
  
  /**
   * Get disk usage metrics
   */
  getDiskMetrics() {
    try {
      const stats = fs.statSync(process.cwd());
      // This is a simplified implementation
      // In production, you'd use a library like 'node-df' or system commands
      return {
        path: process.cwd(),
        mounted: true,
        available: 'N/A' // Would need platform-specific implementation
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Collect all metrics
   */
  collectAll() {
    log.info('Collecting system metrics...');
    this.collectSystemMetrics();
    
    log.info('Collecting performance metrics...');
    this.collectPerformanceMetrics();
    
    log.info('Collecting business metrics...');
    this.collectBusinessMetrics();
    
    log.info('Collecting custom metrics...');
    this.collectCustomMetrics();
    
    return this.metrics;
  }
  
  /**
   * Export metrics in JSON format
   */
  exportJSON() {
    const filename = `metrics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(config.storage.directory, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.metrics, null, 2));
    log.success(`JSON metrics exported to: ${filepath}`);
    
    return filepath;
  }
  
  /**
   * Export metrics in CSV format
   */
  exportCSV() {
    const filename = `metrics-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filepath = path.join(config.storage.directory, filename);
    
    const csv = this.convertToCSV(this.metrics);
    fs.writeFileSync(filepath, csv);
    log.success(`CSV metrics exported to: ${filepath}`);
    
    return filepath;
  }
  
  /**
   * Convert metrics to CSV format
   */
  convertToCSV(metrics) {
    const lines = ['timestamp,type,metric,value\n'];
    
    const flattenMetrics = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenMetrics(value, fullKey);
        } else {
          lines.push(`${metrics.timestamp},${fullKey},${key},${value}\n`);
        }
      });
    };
    
    flattenMetrics(metrics);
    return lines.join('');
  }
  
  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus() {
    const filename = `metrics-${new Date().toISOString().replace(/[:.]/g, '-')}.prom`;
    const filepath = path.join(config.storage.directory, filename);
    
    const prometheus = this.convertToPrometheus(this.metrics);
    fs.writeFileSync(filepath, prometheus);
    log.success(`Prometheus metrics exported to: ${filepath}`);
    
    return filepath;
  }
  
  /**
   * Convert metrics to Prometheus format
   */
  convertToPrometheus(metrics) {
    const lines = [];
    
    // System metrics
    if (metrics.system.memory) {
      lines.push(`# HELP system_memory_usage_percent Memory usage percentage`);
      lines.push(`# TYPE system_memory_usage_percent gauge`);
      lines.push(`system_memory_usage_percent ${metrics.system.memory.usagePercent}`);
      
      lines.push(`# HELP system_memory_total_bytes Total system memory`);
      lines.push(`# TYPE system_memory_total_bytes gauge`);
      lines.push(`system_memory_total_bytes ${metrics.system.memory.total}`);
      
      lines.push(`# HELP system_memory_free_bytes Free system memory`);
      lines.push(`# TYPE system_memory_free_bytes gauge`);
      lines.push(`system_memory_free_bytes ${metrics.system.memory.free}`);
    }
    
    if (metrics.system.cpu) {
      lines.push(`# HELP system_cpu_usage_percent CPU usage percentage`);
      lines.push(`# TYPE system_cpu_usage_percent gauge`);
      lines.push(`system_cpu_usage_percent ${metrics.system.cpu.usage.percentage || 0}`);
      
      lines.push(`# HELP system_cpu_cores CPU core count`);
      lines.push(`# TYPE system_cpu_cores gauge`);
      lines.push(`system_cpu_cores ${metrics.system.cpu.count}`);
    }
    
    if (metrics.system.load) {
      lines.push(`# HELP system_load_average_1m System load average (1m)`);
      lines.push(`# TYPE system_load_average_1m gauge`);
      lines.push(`system_load_average_1m ${metrics.system.load.load1}`);
      
      lines.push(`# HELP system_load_average_5m System load average (5m)`);
      lines.push(`# TYPE system_load_average_5m gauge`);
      lines.push(`system_load_average_5m ${metrics.system.load.load5}`);
      
      lines.push(`# HELP system_load_average_15m System load average (15m)`);
      lines.push(`# TYPE system_load_average_15m gauge`);
      lines.push(`system_load_average_15m ${metrics.system.load.load15}`);
    }
    
    // Performance metrics
    if (metrics.performance.process.memory) {
      lines.push(`# HELP nodejs_heap_size_bytes Heap memory size`);
      lines.push(`# TYPE nodejs_heap_size_bytes gauge`);
      lines.push(`nodejs_heap_size_bytes{type="used"} ${metrics.performance.process.memory.heapUsed}`);
      lines.push(`nodejs_heap_size_bytes{type="total"} ${metrics.performance.process.memory.heapTotal}`);
      lines.push(`nodejs_heap_size_bytes{type="external"} ${metrics.performance.process.memory.external}`);
    }
    
    if (metrics.performance.eventLoop) {
      lines.push(`# HELP nodejs_eventloop_lag_seconds Event loop lag`);
      lines.push(`# TYPE nodejs_eventloop_lag_seconds gauge`);
      lines.push(`nodejs_eventloop_lag_seconds ${metrics.performance.eventloop.lag / 1000}`);
    }
    
    // Business metrics
    if (metrics.business.users) {
      lines.push(`# HELP app_active_users Number of active users`);
      lines.push(`# TYPE app_active_users gauge`);
      lines.push(`app_active_users ${metrics.business.users.active}`);
      
      lines.push(`# HELP app_active_sessions Number of active sessions`);
      lines.push(`# TYPE app_active_sessions gauge`);
      lines.push(`app_active_sessions ${metrics.business.users.sessions}`);
    }
    
    if (metrics.business.calculations) {
      lines.push(`# HELP app_calculations_total Total calculations`);
      lines.push(`# TYPE app_calculations_total counter`);
      lines.push(`app_calculations_total ${metrics.business.calculations.total}`);
      
      lines.push(`# HELP app_calculation_duration_seconds Average calculation time`);
      lines.push(`# TYPE app_calculation_duration_seconds gauge`);
      lines.push(`app_calculation_duration_seconds ${metrics.business.calculations.averageTime / 1000}`);
    }
    
    if (metrics.business.api) {
      lines.push(`# HELP app_api_requests_total Total API requests`);
      lines.push(`# TYPE app_api_requests_total counter`);
      lines.push(`app_api_requests_total ${metrics.business.api.requests}`);
      
      lines.push(`# HELP app_api_errors_total API errors`);
      lines.push(`# TYPE app_api_errors_total counter`);
      lines.push(`app_api_errors_total ${metrics.business.api.errors}`);
      
      lines.push(`# HELP app_api_response_time_seconds Average API response time`);
      lines.push(`# TYPE app_api_response_time_seconds gauge`);
      lines.push(`app_api_response_time_seconds ${metrics.business.api.responseTime / 1000}`);
    }
    
    return lines.join('\n') + '\n';
  }
  
  /**
   * Clean old metrics files
   */
  cleanOldFiles() {
    try {
      const files = fs.readdirSync(config.storage.directory);
      const now = Date.now();
      const maxAge = config.storage.retentionDays * 24 * 60 * 60 * 1000;
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filepath = path.join(config.storage.directory, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
          log.info(`Deleted old metrics file: ${file}`);
        }
      });
      
      if (deletedCount > 0) {
        log.success(`Cleaned up ${deletedCount} old metrics files`);
      }
    } catch (error) {
      log.error(`Failed to clean old files: ${error.message}`);
    }
  }
}

/**
 * Main function to run metrics collection
 */
async function runMetricsCollection() {
  const collector = new MetricsCollector();
  
  log.info('Starting metrics collection...');
  
  try {
    // Collect all metrics
    const metrics = collector.collectAll();
    
    // Display metrics summary
    log.success('Metrics collection completed:');
    log.metric(`System metrics: ${Object.keys(metrics.system).length} categories`);
    log.metric(`Performance metrics: ${Object.keys(metrics.performance).length} categories`);
    log.metric(`Business metrics: ${Object.keys(metrics.business).length} categories`);
    log.metric(`Custom metrics: ${Object.keys(metrics.custom).length} categories`);
    
    // Export metrics based on configuration
    if (config.formats.json) {
      collector.exportJSON();
    }
    
    if (config.formats.csv) {
      collector.exportCSV();
    }
    
    if (config.formats.prometheus) {
      collector.exportPrometheus();
    }
    
    // Clean old files
    collector.cleanOldFiles();
    
    log.success('Metrics collection and export completed successfully');
    
  } catch (error) {
    log.error(`Metrics collection failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Hydraulic Network Web Application - Metrics Collection Script

Usage: node metrics.js [options]

Options:
  --help, -h          Show this help message
  --json              Export only JSON format
  --csv               Export only CSV format
  --prometheus        Export only Prometheus format
  --interval <ms>     Set collection interval in milliseconds
  --retention <days>  Set file retention period in days

Environment Variables:
  METRICS_STORAGE_DIR     Storage directory (default: monitoring/data)
  METRICS_RETENTION_DAYS  File retention days (default: 30)

Examples:
  node metrics.js                    # Collect and export all formats
  node metrics.js --prometheus       # Export only Prometheus format
  node metrics.js --interval 60000   # Set 1-minute collection interval
`);
  process.exit(0);
}

// Determine export format from arguments
const exportFormats = {
  json: process.argv.includes('--json'),
  csv: process.argv.includes('--csv'),
  prometheus: process.argv.includes('--prometheus')
};

// Override config if specific format requested
if (exportFormats.json || exportFormats.csv || exportFormats.prometheus) {
  config.formats = exportFormats;
}

// Override interval if specified
const intervalIndex = process.argv.indexOf('--interval');
if (intervalIndex !== -1) {
  const interval = parseInt(process.argv[intervalIndex + 1]);
  if (interval && interval > 0) {
    config.intervals.system = interval;
    config.intervals.performance = interval;
    config.intervals.business = interval;
    config.intervals.custom = interval;
  }
}

// Override retention if specified
const retentionIndex = process.argv.indexOf('--retention');
if (retentionIndex !== -1) {
  const retention = parseInt(process.argv[retentionIndex + 1]);
  if (retention && retention > 0) {
    config.storage.retentionDays = retention;
  }
}

// Run metrics collection
if (require.main === module) {
  runMetricsCollection().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MetricsCollector, runMetricsCollection, config };