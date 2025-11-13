# Security Configuration

This directory contains comprehensive security configurations and policies for the Hydraulic Network Web Application, ensuring robust protection against various security threats and compliance with industry standards.

## Table of Contents

- [Security Overview](#security-overview)
- [Security Headers](#security-headers)
- [Content Security Policy](#content-security-policy)
- [Authentication and Authorization](#authentication-and-authorization)
- [Data Protection](#data-protection)
- [Network Security](#network-security)
- [Application Security](#application-security)
- [Security Monitoring](#security-monitoring)
- [Compliance](#compliance)
- [Security Best Practices](#security-best-practices)
- [Incident Response](#incident-response)

## Security Overview

The Hydraulic Network Web Application implements a multi-layered security approach designed to protect:

- **User Data**: Personal information, calculations, and configurations
- **System Integrity**: Application and infrastructure security
- **Data Confidentiality**: Sensitive hydraulic analysis data
- **System Availability**: Ensuring service uptime and reliability

### Security Principles

1. **Defense in Depth**: Multiple security layers
2. **Least Privilege**: Minimal necessary access rights
3. **Secure by Default**: Security enabled out-of-the-box
4. **Privacy by Design**: Data protection built-in
5. **Continuous Monitoring**: Real-time security oversight

## Security Headers

### HTTP Security Headers

The application implements comprehensive security headers to protect against common web vulnerabilities:

```nginx
# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.googleapis.com; font-src 'self' *.googleapis.com; connect-src 'self' wss: ws: *.googleapis.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Content Type Options
add_header X-Content-Type-Options "nosniff" always;

# Frame Options
add_header X-Frame-Options "SAMEORIGIN" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Strict Transport Security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Security Headers Configuration

**File**: `security-headers.js`

```javascript
// Express.js security headers middleware
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "*.googleapis.com"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'", "*.googleapis.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Content Security Policy

### CSP Configuration

**File**: `csp-policy.md`

The Content Security Policy (CSP) is designed to prevent Cross-Site Scripting (XSS) and other code injection attacks.

### CSP Directives

```javascript
const cspDirectives = {
  // Default policy for all resources
  defaultSrc: ["'self'"],
  
  // JavaScript sources
  scriptSrc: [
    "'self'",
    "'unsafe-inline'",  // Required for Vite development
    "'unsafe-eval'",    // Required for some libraries
    "*.cloudflare.com", // CDN for external libraries
    "'sha256-...'"      // Specific inline scripts
  ],
  
  // Stylesheet sources
  styleSrc: [
    "'self'",
    "'unsafe-inline'",  // Required for styled-components
    "*.googleapis.com"  // Google Fonts
  ],
  
  // Image sources
  imgSrc: [
    "'self'",
    "data:",           // Data URIs
    "*.googleapis.com", // Maps and icons
    "blob:"            // Dynamic images
  ],
  
  // Font sources
  fontSrc: [
    "'self'",
    "*.googleapis.com", // Google Fonts
    "*.gstatic.com"     // Google Static
  ],
  
  // AJAX and WebSocket sources
  connectSrc: [
    "'self'",
    "wss:",            // WebSocket connections
    "ws:",             // WebSocket connections
    "https://api.example.com" // External APIs
  ],
  
  // Media sources
  mediaSrc: ["'self'"],
  
  // Object/embed sources
  objectSrc: ["'none'"],
  
  // Frame sources
  frameSrc: ["'none'"],
  
  // Base URI
  baseUri: ["'self'"],
  
  // Form actions
  formAction: ["'self'"],
  
  // Frame ancestors
  frameAncestors: ["'none'"],
  
  // Upgrade insecure requests
  upgradeInsecureRequests: []
};
```

### CSP Violation Reporting

```javascript
// CSP violation reporting endpoint
app.post('/csp-report', (req, res) => {
  const report = req.body;
  
  // Log CSP violations
  logger.security('CSP_VIOLATION', 'HIGH', {
    violatedDirective: report['violated-directive'],
    blockedURI: report['blocked-uri'],
    documentURI: report['document-uri'],
    referrer: report.referrer,
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
    columnNumber: report['column-number']
  });
  
  res.status(204).send();
});
```

## Authentication and Authorization

### Authentication Strategy

The application implements a multi-factor authentication system:

1. **Username/Password**: Traditional authentication
2. **JWT Tokens**: Stateless session management
3. **Optional 2FA**: Two-factor authentication
4. **Session Management**: Secure session handling

### Authentication Middleware

**File**: `auth-middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { authenticateJWT, authorize };
```

### Password Security

```javascript
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password validation
const validatePassword = (password) => {
  const result = zxcvbn(password);
  
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (result.score < 3) {
    errors.push('Password is too weak');
    result.feedback.warnings.forEach(warning => errors.push(warning));
    result.feedback.suggestions.forEach(suggestion => errors.push(suggestion));
  }
  
  // Check for common patterns
  const commonPatterns = [
    /password/i,
    /123456/,
    /qwerty/,
    /admin/
  ];
  
  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns');
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    score: result.score,
    feedback: result.feedback
  };
};
```

## Data Protection

### Data Encryption

```javascript
const crypto = require('crypto');

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('hydraulic-app', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData) {
    const { encrypted, iv, authTag } = encryptedData;
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('hydraulic-app', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = DataEncryption;
```

### Data Validation and Sanitization

```javascript
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

class DataSanitizer {
  // Sanitize user input
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Remove potentially dangerous characters
    let sanitized = validator.escape(input);
    sanitized = validator.stripLow(sanitized);
    sanitized = validator.trim(sanitized);
    
    return sanitized;
  }
  
  // Sanitize HTML content
  static sanitizeHTML(html) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }
  
  // Validate email
  static validateEmail(email) {
    return validator.isEmail(email) && email.length <= 254;
  }
  
  // Validate URL
  static validateURL(url) {
    return validator.isURL(url, {
      protocols: ['https'],
      require_protocol: true
    });
  }
  
  // Validate file upload
  static validateFile(file) {
    const allowedTypes = [
      'application/json',
      'text/yaml',
      'text/plain',
      'application/pdf'
    ];
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type');
    }
    
    if (file.size > maxSize) {
      throw new Error('File too large');
    }
    
    return true;
  }
}

module.exports = DataSanitizer;
```

## Network Security

### SSL/TLS Configuration

```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://yourdomain.com',
      'https://app.yourdomain.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    error: 'API rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Application Security

### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
};

// User registration validation
const userValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
];

// Configuration validation
const configValidation = [
  body('fluidProperties.density')
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage('Density must be between 0.1 and 10000 kg/m³'),
  
  body('fluidProperties.viscosity')
    .isFloat({ min: 0.00001, max: 10 })
    .withMessage('Viscosity must be between 0.00001 and 10 Pa·s'),
  
  body('pipeSections')
    .isArray({ min: 1 })
    .withMessage('At least one pipe section required'),
  
  body('pipeSections.*.diameter')
    .isFloat({ min: 0.001, max: 10 })
    .withMessage('Diameter must be between 1mm and 10m')
];

module.exports = {
  validateRequest,
  userValidation,
  configValidation
};
```

### Error Handling

```javascript
// Secure error handling
const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Application error', err);
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Error categories
  const errorResponses = {
    ValidationError: { status: 400, message: 'Validation failed' },
    AuthenticationError: { status: 401, message: 'Authentication required' },
    AuthorizationError: { status: 403, message: 'Access denied' },
    NotFoundError: { status: 404, message: 'Resource not found' },
    ConflictError: { status: 409, message: 'Resource conflict' },
    RateLimitError: { status: 429, message: 'Rate limit exceeded' }
  };
  
  const errorType = err.constructor.name;
  const errorResponse = errorResponses[errorType] || 
    { status: 500, message: 'Internal server error' };
  
  // Send error response
  const response = {
    error: {
      message: errorResponse.message,
      timestamp: new Date().toISOString()
    }
  };
  
  // Include error details in development
  if (isDevelopment) {
    response.error.details = err.message;
    response.error.stack = err.stack;
  }
  
  res.status(errorResponse.status).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', { url: req.originalUrl, method: req.method });
  res.status(404).json({
    error: {
      message: 'Route not found',
      timestamp: new Date().toISOString()
    }
  });
};
```

## Security Monitoring

### Security Event Logging

```javascript
// Security event logger
class SecurityLogger {
  static logSecurityEvent(event, severity, details = {}) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event: event,
      severity: severity,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      userId: details.userId || null,
      sessionId: details.sessionId || null,
      details: details
    };
    
    // Log to security monitoring system
    logger.security(event, severity, securityEvent);
    
    // Send to SIEM if configured
    if (process.env.SIEM_ENDPOINT) {
      this.sendToSIEM(securityEvent);
    }
    
    // Alert on high severity events
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      this.sendSecurityAlert(securityEvent);
    }
  }
  
  static sendToSIEM(event) {
    // Implementation for SIEM integration
  }
  
  static sendSecurityAlert(event) {
    // Implementation for security alerts
  }
}

// Security event types
const securityEvents = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_LOCKED: 'account_locked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS: 'data_access',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  CSP_VIOLATION: 'csp_violation',
  XSS_ATTEMPT: 'xss_attempt',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt'
};

module.exports = { SecurityLogger, securityEvents };
```

### Intrusion Detection

```javascript
class IntrusionDetection {
  constructor() {
    this.failedLogins = new Map();
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();
  }
  
  // Monitor login attempts
  monitorLogin(email, ip, success) {
    if (!success) {
      const attempts = this.failedLogins.get(ip) || [];
      attempts.push(Date.now());
      
      // Keep only attempts from last hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentAttempts = attempts.filter(time => time > oneHourAgo);
      
      this.failedLogins.set(ip, recentAttempts);
      
      // Block IP after 5 failed attempts
      if (recentAttempts.length >= 5) {
        this.blockedIPs.add(ip);
        SecurityLogger.logSecurityEvent(
          securityEvents.LOGIN_FAILURE,
          'HIGH',
          { ip, email, attempts: recentAttempts.length }
        );
      }
    } else {
      // Clear failed attempts on successful login
      this.failedLogins.delete(ip);
    }
  }
  
  // Check if IP is blocked
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }
  
  // Monitor for suspicious patterns
  checkSuspiciousActivity(req, res, next) {
    const ip = req.ip;
    
    if (this.isIPBlocked(ip)) {
      SecurityLogger.logSecurityEvent(
        securityEvents.SUSPICIOUS_ACTIVITY,
        'CRITICAL',
        { ip, reason: 'Blocked IP attempted access' }
      );
      
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    next();
  }
}
```

## Compliance

### GDPR Compliance

```javascript
// Data subject rights implementation
class GDPRCompliance {
  // Right to access
  static async exportUserData(userId) {
    const userData = await User.findById(userId);
    const calculations = await Calculation.find({ userId });
    const logs = await Log.find({ userId }).limit(1000);
    
    return {
      user: userData,
      calculations,
      activityLogs: logs,
      exportedAt: new Date().toISOString()
    };
  }
  
  // Right to be forgotten
  static async deleteUserData(userId) {
    // Anonymize calculations instead of deleting
    await Calculation.updateMany(
      { userId },
      { 
        $set: { 
          userId: null,
          userEmail: 'deleted@anonymized.com',
          isAnonymized: true 
        } 
      }
    );
    
    // Delete logs after 30 days
    setTimeout(async () => {
      await Log.deleteMany({ userId });
    }, 30 * 24 * 60 * 60 * 1000);
    
    // Delete user account
    await User.findByIdAndDelete(userId);
    
    SecurityLogger.logSecurityEvent(
      securityEvents.DATA_DELETION,
      'INFO',
      { userId, reason: 'GDPR right to be forgotten' }
    );
  }
  
  // Cookie consent
  static setCookieConsent(req, res, consent) {
    res.cookie('cookie_consent', consent, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
  }
}

module.exports = GDPRCompliance;
```

### SOC 2 Compliance

```javascript
// SOC 2 compliance monitoring
class SOC2Compliance {
  static auditLog(event, userId, details) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      ipAddress: details.ip,
      userAgent: details.userAgent,
      resource: details.resource,
      action: details.action,
      result: details.result
    };
    
    // Store in immutable audit log
    AuditLog.create(auditEntry);
    
    // Log to external audit system
    if (process.env.AUDIT_LOG_ENDPOINT) {
      this.sendToAuditSystem(auditEntry);
    }
  }
  
  static accessControl(userId, resource, action) {
    // Implementation for access control logging
  }
  
  static dataIntegrityCheck() {
    // Implementation for data integrity verification
  }
}
```

## Security Best Practices

### Development Security

1. **Secure Coding Practices**
   - Input validation and sanitization
   - Output encoding
   - Error handling
   - Logging and monitoring

2. **Dependency Management**
   - Regular updates
   - Vulnerability scanning
   - License compliance
   - Minimal dependencies

3. **Secrets Management**
   - Environment variables
   - Secret rotation
   - Access control
   - Audit logging

### Deployment Security

1. **Container Security**
   - Minimal base images
   - Non-root users
   - Read-only filesystems
   - Security scanning

2. **Infrastructure Security**
   - Network segmentation
   - Firewall rules
   - VPN access
   - Monitoring

## Incident Response

### Security Incident Response Plan

1. **Detection and Analysis**
   - Monitor security alerts
   - Analyze security events
   - Assess impact and severity
   - Document findings

2. **Containment and Eradication**
   - Isolate affected systems
   - Remove threats
   - Patch vulnerabilities
   - Restore from backups

3. **Recovery and Lessons Learned**
   - Restore normal operations
   - Monitor for recurrence
   - Conduct post-incident review
   - Update security measures

### Emergency Contacts

```javascript
const emergencyContacts = {
  securityTeam: {
    email: 'security@company.com',
    phone: '+1-555-SECURITY',
    onCall: true
  },
  management: {
    email: 'cto@company.com',
    phone: '+1-555-MANAGEMENT',
    escalation: true
  },
  legal: {
    email: 'legal@company.com',
    phone: '+1-555-LEGAL',
    notificationRequired: true
  }
};
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)
- [Security Headers Guide](https://securityheaders.com/)
- [CSP Reference](https://content-security-policy.com/)

---

For security-related issues or questions, please contact the security team at security@company.com or refer to the [Incident Response](#incident-response) section above.