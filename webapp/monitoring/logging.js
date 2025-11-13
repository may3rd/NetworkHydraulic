#!/usr/bin/env node

/**
 * Structured Logging Configuration for Hydraulic Network Web Application
 * 
 * This module provides comprehensive logging capabilities with structured
 * logging, log rotation, and multiple output formats.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { Transform } = require('stream');

// Configuration
const config = {
  // Log levels
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    HTTP: 3,
    DEBUG: 4,
    TRACE: 5
  },
  
  // Log format
  format: {
    json: true,
    timestamp: true,
    includeStackTrace: true,
    includeProcessInfo: true,
    includeSystemInfo: false
  },
  
  // Output configuration
  output: {
    console: {
      enabled: true,
      level: 'INFO',
      colorize: true
    },
    file: {
      enabled: true,
      level: 'DEBUG',
      directory: path.join(__dirname, 'logs'),
      filename: 'application.log',
      maxFiles: 10,
      maxSize: '100MB'
    },
    http: {
      enabled: false,
      level: 'WARN',
      endpoint: process.env.LOG_HTTP_ENDPOINT,
      apiKey: process.env.LOG_HTTP_API_KEY
    }
  },
  
  // Log categories
  categories: {
    APP: 'application',
    API: 'api',
    CALCULATION: 'calculation',
    AUTH: 'authentication',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    SYSTEM: 'system',
    ERROR: 'error'
  }
};

// Colors for console output
const colors = {
  ERROR: '\x1b[31m',    // Red
  WARN: '\x1b[33m',     // Yellow
  INFO: '\x1b[36m',     // Cyan
  HTTP: '\x1b[35m',     // Magenta
  DEBUG: '\x1b[37m',    // White
  TRACE: '\x1b[90m',    // Gray
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

/**
 * Logger class for structured logging
 */
class Logger {
  constructor(category = 'APP', level = 'INFO') {
    this.category = category;
    this.level = config.levels[level] || config.levels.INFO;
    this.hostname = os.hostname();
    this.pid = process.pid;
    
    this.init();
  }
  
  init() {
    // Create log directory if it doesn't exist
    if (config.output.file.enabled && !fs.existsSync(config.output.file.directory)) {
      fs.mkdirSync(config.output.file.directory, { recursive: true });
    }
  }
  
  /**
   * Check if logging is enabled for the given level
   */
  isEnabled(level) {
    return config.levels[level] <= this.level;
  }
  
  /**
   * Format log message
   */
  formatMessage(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      category: this.category,
      hostname: this.hostname,
      pid: this.pid,
      ...metadata
    };
    
    // Add stack trace for error level
    if (level === 'ERROR' && config.format.includeStackTrace) {
      const stack = new Error().stack;
      logEntry.stack = stack.split('\n').slice(1).map(line => line.trim());
    }
    
    // Add process information
    if (config.format.includeProcessInfo) {
      logEntry.process = {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      };
    }
    
    // Add system information (for system logs)
    if (this.category === config.categories.SYSTEM && config.format.includeSystemInfo) {
      logEntry.system = {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        loadavg: os.loadavg(),
        freemem: os.freemem(),
        totalmem: os.totalmem()
      };
    }
    
    return logEntry;
  }
  
  /**
   * Serialize log entry
   */
  serialize(logEntry) {
    if (config.format.json) {
      return JSON.stringify(logEntry);
    } else {
      return this.formatText(logEntry);
    }
  }
  
  /**
   * Format log entry as text
   */
  formatText(logEntry) {
    const timestamp = logEntry.timestamp;
    const level = logEntry.level;
    const category = logEntry.category;
    const message = logEntry.message;
    
    return `${timestamp} [${level}] [${category}] ${message}`;
  }
  
  /**
   * Colorize console output
   */
  colorize(level, text) {
    if (!config.output.console.colorize) {
      return text;
    }
    
    const color = colors[level] || colors.RESET;
    return `${color}${text}${colors.RESET}`;
  }
  
  /**
   * Write log entry to outputs
   */
  write(logEntry) {
    const serialized = this.serialize(logEntry);
    
    // Console output
    if (config.output.console.enabled) {
      const consoleLevel = config.levels[config.output.console.level];
      if (config.levels[logEntry.level] <= consoleLevel) {
        const coloredOutput = this.colorize(logEntry.level, serialized);
        if (logEntry.level === 'ERROR') {
          console.error(coloredOutput);
        } else {
          console.log(coloredOutput);
        }
      }
    }
    
    // File output
    if (config.output.file.enabled) {
      const fileLevel = config.levels[config.output.file.level];
      if (config.levels[logEntry.level] <= fileLevel) {
        this.writeToFile(serialized);
      }
    }
    
    // HTTP output
    if (config.output.http.enabled && logEntry.level !== 'DEBUG' && logEntry.level !== 'TRACE') {
      const httpLevel = config.levels[config.output.http.level];
      if (config.levels[logEntry.level] <= httpLevel) {
        this.writeToHTTP(logEntry);
      }
    }
  }
  
  /**
   * Write log entry to file
   */
  writeToFile(message) {
    try {
      const logFile = path.join(config.output.file.directory, config.output.file.filename);
      fs.appendFileSync(logFile, message + '\n');
      
      // Check file size and rotate if necessary
      this.checkAndRotate();
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  /**
   * Write log entry to HTTP endpoint
   */
  async writeToHTTP(logEntry) {
    try {
      if (!config.output.http.endpoint) {
        return;
      }
      
      const response = await fetch(config.output.http.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.output.http.apiKey}`
        },
        body: JSON.stringify(logEntry)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP logging failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send log to HTTP endpoint:', error);
    }
  }
  
  /**
   * Check file size and rotate logs if necessary
   */
  checkAndRotate() {
    const logFile = path.join(config.output.file.directory, config.output.file.filename);
    
    try {
      const stats = fs.statSync(logFile);
      const maxSizeBytes = this.parseSize(config.output.file.maxSize);
      
      if (stats.size > maxSizeBytes) {
        this.rotateLogs();
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
    }
  }
  
  /**
   * Rotate log files
   */
  rotateLogs() {
    const logFile = path.join(config.output.file.directory, config.output.file.filename);
    const rotatedFile = `${logFile}.${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    try {
      // Move current log file to rotated name
      fs.renameSync(logFile, rotatedFile);
      
      // Clean up old rotated files
      this.cleanupRotatedFiles();
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }
  
  /**
   * Clean up old rotated log files
   */
  cleanupRotatedFiles() {
    try {
      const files = fs.readdirSync(config.output.file.directory);
      const logFiles = files
        .filter(file => file.startsWith(config.output.file.filename))
        .sort()
        .reverse();
      
      // Remove old files, keeping only the configured number
      const filesToDelete = logFiles.slice(config.output.file.maxFiles);
      
      filesToDelete.forEach(file => {
        const filePath = path.join(config.output.file.directory, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      });
    } catch (error) {
      console.error('Failed to cleanup rotated log files:', error);
    }
  }
  
  /**
   * Parse size string (e.g., "100MB") to bytes
   */
  parseSize(sizeStr) {
    const units = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024
    };
    
    const match = sizeStr.match(/^(\d+)([BKMG])B?$/);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }
    
    const [, size, unit] = match;
    return parseInt(size) * units[unit];
  }
  
  /**
   * Log message at specified level
   */
  log(level, message, metadata = {}) {
    if (!this.isEnabled(level)) {
      return;
    }
    
    const logEntry = this.formatMessage(level, message, metadata);
    this.write(logEntry);
  }
  
  /**
   * Log error messages
   */
  error(message, error = null) {
    const metadata = {};
    if (error) {
      metadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    this.log('ERROR', message, metadata);
  }
  
  /**
   * Log warning messages
   */
  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }
  
  /**
   * Log info messages
   */
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }
  
  /**
   * Log HTTP requests
   */
  http(message, metadata = {}) {
    this.log('HTTP', message, metadata);
  }
  
  /**
   * Log debug messages
   */
  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }
  
  /**
   * Log trace messages
   */
  trace(message, metadata = {}) {
    this.log('TRACE', message, metadata);
  }
  
  /**
   * Log performance metrics
   */
  performance(operation, duration, metadata = {}) {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...metadata
    });
  }
  
  /**
   * Log API requests
   */
  api(method, url, status, duration, metadata = {}) {
    this.http(`${method} ${url} ${status} ${duration}ms`, {
      type: 'api',
      method,
      url,
      status,
      duration,
      ...metadata
    });
  }
  
  /**
   * Log calculation events
   */
  calculation(event, calculationId, metadata = {}) {
    this.info(`Calculation: ${event} (${calculationId})`, {
      type: 'calculation',
      calculationId,
      event,
      ...metadata
    });
  }
  
  /**
   * Log authentication events
   */
  auth(event, userId, metadata = {}) {
    this.info(`Auth: ${event} (${userId})`, {
      type: 'auth',
      userId,
      event,
      ...metadata
    });
  }
  
  /**
   * Log security events
   */
  security(event, severity, metadata = {}) {
    const level = severity === 'HIGH' ? 'ERROR' : 'WARN';
    this.log(level, `Security: ${event}`, {
      type: 'security',
      event,
      severity,
      ...metadata
    });
  }
  
  /**
   * Create child logger with specific category
   */
  child(category) {
    return new Logger(category, this.getLevelName());
  }
  
  /**
   * Get current log level name
   */
  getLevelName() {
    return Object.keys(config.levels).find(key => config.levels[key] === this.level);
  }
  
  /**
   * Set log level
   */
  setLevel(level) {
    this.level = config.levels[level] || config.levels.INFO;
  }
}

/**
 * Create logger instance
 */
function createLogger(category = 'APP') {
  return new Logger(category);
}

/**
 * Create specialized loggers
 */
const loggers = {
  app: createLogger('APP'),
  api: createLogger('API'),
  calculation: createLogger('CALCULATION'),
  auth: createLogger('AUTH'),
  security: createLogger('SECURITY'),
  performance: createLogger('PERFORMANCE'),
  system: createLogger('SYSTEM'),
  error: createLogger('ERROR')
};

/**
 * Middleware for Express.js applications
 */
function expressLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    loggers.api.api(method, url, statusCode, duration, {
      ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
}

/**
 * Error handler middleware for Express.js
 */
function errorHandler(err, req, res, next) {
  loggers.error.error(`Request error: ${err.message}`, err);
  
  // Don't send error details in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  res.status(err.status || 500).json({
    error: {
      message,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Request logger for client-side applications
 */
class ClientLogger {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  async log(level, message, metadata = {}) {
    if (!this.baseUrl) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    try {
      await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send client log:', error);
    }
  }
  
  error(message, error = null) {
    const metadata = error ? { error: error.message, stack: error.stack } : {};
    return this.log('ERROR', message, metadata);
  }
  
  warn(message, metadata = {}) {
    return this.log('WARN', message, metadata);
  }
  
  info(message, metadata = {}) {
    return this.log('INFO', message, metadata);
  }
  
  debug(message, metadata = {}) {
    return this.log('DEBUG', message, metadata);
  }
}

/**
 * Export configuration and utilities
 */
module.exports = {
  Logger,
  createLogger,
  loggers,
  expressLogger,
  errorHandler,
  ClientLogger,
  config,
  colors
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Structured Logging for Hydraulic Network Web Application

Usage: node logging.js [command] [options]

Commands:
  test    Test logging functionality
  config  Show current configuration

Options:
  --level <level>    Set log level (ERROR, WARN, INFO, DEBUG, TRACE)
  --category <cat>   Set log category
  --message <msg>    Log message

Examples:
  node logging.js test --level INFO --message "Test message"
  node logging.js config
`);
    process.exit(0);
  }
  
  const command = args[0];
  
  if (command === 'test') {
    const levelIndex = args.indexOf('--level');
    const level = levelIndex !== -1 ? args[levelIndex + 1] : 'INFO';
    
    const messageIndex = args.indexOf('--message');
    const message = messageIndex !== -1 ? args[messageIndex + 1] : 'Test log message';
    
    const categoryIndex = args.indexOf('--category');
    const category = categoryIndex !== -1 ? args[categoryIndex + 1] : 'APP';
    
    const logger = createLogger(category);
    logger.log(level, message, { test: true, timestamp: new Date().toISOString() });
    
    console.log('Test log message sent successfully');
  } else if (command === 'config') {
    console.log('Current logging configuration:');
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log('Unknown command. Use --help for usage information.');
    process.exit(1);
  }
}