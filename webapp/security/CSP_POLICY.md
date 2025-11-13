# Content Security Policy (CSP) Documentation

This document provides comprehensive information about the Content Security Policy implementation for the Hydraulic Network Web Application.

## Table of Contents

- [CSP Overview](#csp-overview)
- [CSP Directives](#csp-directives)
- [Implementation Details](#implementation-details)
- [Testing CSP](#testing-csp)
- [CSP Violations](#csp-violations)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)

## CSP Overview

The Content Security Policy (CSP) is a critical security feature that helps prevent Cross-Site Scripting (XSS), clickjacking, and other code injection attacks. Our CSP implementation follows security best practices while maintaining application functionality.

### CSP Goals

1. **Prevent XSS Attacks**: Block unauthorized script execution
2. **Control Resource Loading**: Restrict where resources can be loaded from
3. **Mitigate Clickjacking**: Prevent iframe embedding
4. **Data Exfiltration Protection**: Limit unauthorized data transmission

### CSP Implementation Strategy

- **Strict by Default**: Allow only trusted sources
- **Progressive Enhancement**: Start restrictive, add exceptions as needed
- **Monitoring First**: Use reporting before enforcement
- **Regular Review**: Update policies based on usage patterns

## CSP Directives

### Primary CSP Configuration

```javascript
// Content Security Policy configuration
const contentSecurityPolicy = {
  directives: {
    // Default policy for all resources
    defaultSrc: ["'self'"],
    
    // JavaScript sources
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite development builds
      "'unsafe-eval'",   // Required for some development tools
      "*.cloudflare.com", // CDN for external libraries
      "'sha256-xyz123...'", // Specific inline scripts
      "'nonce-abc456...'" // Nonce-based scripts
    ],
    
    // Stylesheet sources
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      "*.googleapis.com", // Google Fonts
      "*.cloudflare.com" // CSS frameworks
    ],
    
    // Image sources
    imgSrc: [
      "'self'",
      "data:", // Data URIs for icons and small images
      "*.googleapis.com", // Maps and external images
      "blob:", // Dynamic images
      "https:" // Allow HTTPS images
    ],
    
    // Font sources
    fontSrc: [
      "'self'",
      "*.googleapis.com", // Google Fonts
      "*.gstatic.com" // Google Static Content
    ],
    
    // AJAX, WebSocket, and EventSource connections
    connectSrc: [
      "'self'",
      "wss:", // WebSocket connections
      "ws:", // WebSocket connections
      "*.googleapis.com", // External APIs
      "https://api.example.com" // Specific trusted APIs
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
    
    // Manifest sources
    manifestSrc: ["'self'"],
    
    // Worker sources
    workerSrc: ["'self'", "blob:"]
  }
};
```

### Development vs Production CSP

#### Development CSP

```javascript
// Development environment CSP (more permissive)
const developmentCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for HMR
      "'unsafe-eval'", // Required for development tools
      "localhost:*",
      "127.0.0.1:*"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "localhost:*",
      "127.0.0.1:*"
    ],
    connectSrc: [
      "'self'",
      "localhost:*",
      "127.0.0.1:*",
      "ws://localhost:*",
      "ws://127.0.0.1:*"
    ],
    imgSrc: ["'self'", "data:", "localhost:*", "127.0.0.1:*"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  },
  reportOnly: true // Report only in development
};
```

#### Production CSP

```javascript
// Production environment CSP (strict)
const productionCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "*.cloudflare.com", // Trusted CDN
      "'sha256-xyz123...'" // Specific hashes
    ],
    styleSrc: [
      "'self'",
      "*.googleapis.com",
      "*.cloudflare.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "*.googleapis.com"
    ],
    connectSrc: [
      "'self'",
      "wss://api.yourservice.com",
      "https://api.yourservice.com"
    ],
    fontSrc: [
      "'self'",
      "*.googleapis.com"
    ],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [] // Force HTTPS
  },
  reportUri: "/csp-report" // Report violations
};
```

## Implementation Details

### Server-Side Implementation

#### Express.js Implementation

```javascript
const helmet = require('helmet');

// CSP middleware for Express.js
app.use(helmet.contentSecurityPolicy({
  directives: contentSecurityPolicy.directives,
  reportOnly: process.env.NODE_ENV === 'development'
}));

// CSP violation reporting endpoint
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body;
  
  // Log CSP violation
  console.error('CSP Violation:', JSON.stringify(report, null, 2));
  
  // Store violation for analysis
  storeCSPViolation(report);
  
  res.status(204).send();
});

// Function to store CSP violations
async function storeCSPViolation(report) {
  try {
    const violation = {
      timestamp: new Date().toISOString(),
      violatedDirective: report['violated-directive'],
      blockedURI: report['blocked-uri'],
      documentURI: report['document-uri'],
      referrer: report.referrer,
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      effectiveDirective: report['effective-directive'],
      originalPolicy: report['original-policy']
    };
    
    // Store in database or log management system
    await CSPViolation.create(violation);
    
    // Send alert for critical violations
    if (isCriticalViolation(violation)) {
      sendSecurityAlert('CSP_VIOLATION', violation);
    }
  } catch (error) {
    console.error('Failed to store CSP violation:', error);
  }
}

// Function to check if violation is critical
function isCriticalViolation(violation) {
  const criticalDirectives = ['script-src', 'object-src', 'frame-src'];
  return criticalDirectives.includes(violation.effectiveDirective);
}
```

#### Nginx Implementation

```nginx
# CSP headers in Nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.cloudflare.com; style-src 'self' 'unsafe-inline' *.googleapis.com *.cloudflare.com; img-src 'self' data: *.googleapis.com; font-src 'self' *.googleapis.com *.gstatic.com; connect-src 'self' wss: ws: *.googleapis.com https://api.example.com; media-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests" always;

# Report-only CSP for testing
add_header Content-Security-Policy-Report-Only "default-src 'self'; report-uri /csp-report;" always;
```

### Client-Side Implementation

#### Dynamic CSP with Nonces

```javascript
// Generate nonce for inline scripts
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

// Inject nonce into HTML
function injectCSPNonce(html, nonce) {
  return html.replace(
    /<script([^>]*)>/g,
    `<script$1 nonce="${nonce}">`
  );
}

// React component with CSP compliance
const SecureScript = ({ children, nonce }) => {
  return (
    <script nonce={nonce} type="text/javascript">
      {children}
    </script>
  );
};
```

#### CSP-Compatible React Implementation

```javascript
// CSP-compliant React component
import React, { useEffect, useState } from 'react';

const NetworkDiagram = ({ data, config }) => {
  const [chartInstance, setChartInstance] = useState(null);
  
  useEffect(() => {
    // Initialize chart without inline scripts
    const canvas = document.getElementById('network-canvas');
    if (canvas && data) {
      const newChart = initializeNetworkChart(canvas, data, config);
      setChartInstance(newChart);
      
      return () => {
        // Cleanup
        if (newChart) {
          newChart.destroy();
        }
      };
    }
  }, [data, config]);
  
  // Use external CSS for styling
  return (
    <div className="network-diagram">
      <canvas id="network-canvas" width="800" height="600" />
    </div>
  );
};

// External chart initialization
function initializeNetworkChart(canvas, data, config) {
  // Chart.js or custom chart implementation
  return new Chart(canvas, {
    type: 'network',
    data: data,
    options: config
  });
}
```

## Testing CSP

### Local Testing

```javascript
// Test CSP violations locally
function testCSPViolations() {
  console.log('Testing CSP violations...');
  
  // Test script injection
  try {
    eval('console.log("CSP violation test")');
  } catch (error) {
    console.log('Script eval blocked by CSP');
  }
  
  // Test inline style
  try {
    document.body.style.backgroundColor = 'red';
  } catch (error) {
    console.log('Inline style modification blocked');
  }
  
  // Test external resource loading
  const img = new Image();
  img.src = 'https://example.com/untrusted-image.jpg';
  img.onerror = () => console.log('External image blocked by CSP');
}
```

### Automated Testing

```javascript
// CSP testing with Playwright
const { test, expect } = require('@playwright/test');

test.describe('Content Security Policy', () => {
  test('should not allow inline scripts', async ({ page }) => {
    // Inject inline script
    const violations = [];
    page.on('console', msg => {
      if (msg.text().includes('CSP')) {
        violations.push(msg.text());
      }
    });
    
    await page.setContent(`
      <html>
        <head>
          <meta http-equiv="Content-Security-Policy" 
                content="default-src 'self'; script-src 'self'">
        </head>
        <body>
          <script>console.log('CSP violation test');</script>
        </body>
      </html>
    `);
    
    expect(violations.length).toBeGreaterThan(0);
  });
  
  test('should allow trusted resources', async ({ page }) => {
    const response = await page.goto('https://your-app.com');
    expect(response.headers()['content-security-policy']).toBeTruthy();
  });
});
```

### CSP Testing Tools

#### Browser Developer Tools

1. **Chrome DevTools**
   - Open Security tab
   - Check for CSP violations
   - View blocked resources

2. **Firefox Developer Tools**
   - Open Console
   - Check for CSP warnings
   - Use Network Monitor

#### Online CSP Testing Tools

- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Validator](https://cspvalidator.org/)
- [SecurityHeaders.com](https://securityheaders.com/)

## CSP Violations

### Common CSP Violations

#### Script Source Violations

```javascript
// ❌ Violation: Inline script
<script>
  console.log('This will be blocked');
</script>

// ✅ Solution: External script file
<script src="/js/analytics.js"></script>

// ✅ Solution: Nonce-based inline script
<script nonce="abc123">
  console.log('This will be allowed');
</script>
```

#### Style Source Violations

```css
/* ❌ Violation: External stylesheet */
@import url('https://example.com/styles.css');

/* ✅ Solution: Self-hosted styles */
@import url('/css/styles.css');
```

#### Connect Source Violations

```javascript
// ❌ Violation: Untrusted API call
fetch('https://untrusted-api.com/data');

// ✅ Solution: Trusted API endpoint
fetch('/api/data');
```

### Handling CSP Violations

#### Graceful Degradation

```javascript
// Feature detection for CSP compliance
function isCSPCompliant() {
  try {
    // Test if eval is available
    eval('var test = 1;');
    return true;
  } catch (error) {
    return false;
  }
}

// Conditional feature loading
if (isCSPCompliant()) {
  loadAdvancedFeatures();
} else {
  loadBasicFeatures();
}
```

#### Fallback Strategies

```javascript
// Fallback for blocked resources
function loadResourceWithFallback(url, fallbackUrl) {
  return fetch(url)
    .catch(() => fetch(fallbackUrl))
    .catch(() => {
      console.warn(`All resource loading attempts failed for: ${url}`);
      return null;
    });
}
```

## Browser Support

### CSP Level 2 Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 40+ | ✅ Full |
| Firefox | 36+ | ✅ Full |
| Safari | 10+ | ✅ Full |
| Edge | 12+ | ✅ Full |
| Opera | 27+ | ✅ Full |

### CSP Level 3 Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 69+ | ✅ Full |
| Firefox | 69+ | ✅ Full |
| Safari | 14+ | ✅ Partial |
| Edge | 79+ | ✅ Full |

### Polyfills and Fallbacks

```javascript
// CSP feature detection
function supportsCSP() {
  return 'contentSecurityPolicy' in document;
}

function supportsCSPReportOnly() {
  try {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy-Report-Only';
    meta.content = "default-src 'self'";
    document.head.appendChild(meta);
    const result = meta.sheet && meta.sheet.cssRules.length > 0;
    document.head.removeChild(meta);
    return result;
  } catch (error) {
    return false;
  }
}
```

## Troubleshooting

### Common Issues

#### Issue 1: Vite Development Server

```javascript
// Problem: Vite requires 'unsafe-eval' for HMR
// Solution: Use report-only mode in development
app.use(helmet.contentSecurityPolicy({
  directives: developmentCSP.directives,
  reportOnly: true
}));
```

#### Issue 2: Styled Components

```javascript
// Problem: Styled components inject inline styles
// Solution: Allow 'unsafe-inline' for style-src in development
const styleSrc = [
  "'self'",
  "'unsafe-inline'" // Required for styled-components
];
```

#### Issue 3: External Libraries

```javascript
// Problem: External libraries load resources
// Solution: Add trusted domains to appropriate directives
const scriptSrc = [
  "'self'",
  "*.cloudflare.com", // CDN
  "*.googleapis.com"   // Google APIs
];
```

### Debugging CSP

#### Console Logging

```javascript
// Add CSP violation listener
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    violatedDirective: e.violatedDirective,
    blockedURI: e.blockedURI,
    documentURI: e.documentURI,
    effectiveDirective: e.effectiveDirective
  });
});
```

#### CSP Violation Reporting

```javascript
// Enhanced CSP violation reporting
function handleCSPViolation(event) {
  const violation = {
    timestamp: new Date().toISOString(),
    directive: event.violatedDirective,
    blocked: event.blockedURI,
    document: event.documentURI,
    referrer: event.referrer,
    source: event.sourceFile,
    line: event.lineNumber,
    column: event.columnNumber
  };
  
  // Send to analytics
  sendAnalytics('csp_violation', violation);
  
  // Log for debugging
  console.warn('CSP Violation:', violation);
}
```

### CSP Optimization

#### Performance Considerations

```javascript
// Minimize CSP directive complexity
const optimizedCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "*.trusted-cdn.com"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
};
```

#### Regular CSP Review

```javascript
// Monthly CSP review checklist
const cspReviewChecklist = [
  'Review CSP violation reports',
  'Remove unused directives',
  'Update trusted domains',
  'Test new features for CSP compliance',
  'Update CSP for new dependencies',
  'Validate CSP in different browsers',
  'Review and update CSP documentation'
];
```

---

For additional CSP support or questions, please refer to the [Security](./README.md) documentation or contact the security team.