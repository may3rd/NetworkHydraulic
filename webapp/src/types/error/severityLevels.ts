/**
 * Severity Levels for Hydraulic Network Web Application
 * 
 * This module defines error severity levels and their associated properties
 * including display characteristics, handling priorities, and user notifications.
 */

import { ErrorSeverity } from './errorTypes';

// Severity level configuration interface
export interface SeverityLevel {
  level: ErrorSeverity;
  priority: number;
  color: string;
  icon: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  notificationDuration?: number;
  autoDismiss: boolean;
  requiresAction: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  userImpact: 'none' | 'minor' | 'moderate' | 'severe' | 'critical';
  systemImpact: 'none' | 'minor' | 'moderate' | 'severe' | 'critical';
}

// Severity level definitions
export const SEVERITY_LEVELS: Record<ErrorSeverity, SeverityLevel> = {
  [ErrorSeverity.INFO]: {
    level: ErrorSeverity.INFO,
    priority: 1,
    color: '#1976d2',
    icon: 'info',
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    textColor: '#1976d2',
    notificationDuration: 5000,
    autoDismiss: true,
    requiresAction: false,
    logLevel: 'info',
    userImpact: 'none',
    systemImpact: 'none'
  },
  
  [ErrorSeverity.WARNING]: {
    level: ErrorSeverity.WARNING,
    priority: 2,
    color: '#f57c00',
    icon: 'warning',
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    textColor: '#f57c00',
    notificationDuration: 8000,
    autoDismiss: true,
    requiresAction: false,
    logLevel: 'warn',
    userImpact: 'minor',
    systemImpact: 'minor'
  },
  
  [ErrorSeverity.ERROR]: {
    level: ErrorSeverity.ERROR,
    priority: 3,
    color: '#d32f2f',
    icon: 'error',
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    textColor: '#d32f2f',
    notificationDuration: 10000,
    autoDismiss: false,
    requiresAction: true,
    logLevel: 'error',
    userImpact: 'moderate',
    systemImpact: 'moderate'
  },
  
  [ErrorSeverity.CRITICAL]: {
    level: ErrorSeverity.CRITICAL,
    priority: 4,
    color: '#7b0a0a',
    icon: 'critical',
    backgroundColor: '#ffe6e6',
    borderColor: '#ff0000',
    textColor: '#7b0a0a',
    notificationDuration: 0, // Never auto-dismiss
    autoDismiss: false,
    requiresAction: true,
    logLevel: 'critical',
    userImpact: 'severe',
    systemImpact: 'severe'
  }
} as const;

// Severity color mapping for Material-UI integration
export const SEVERITY_COLORS = {
  [ErrorSeverity.INFO]: 'info',
  [ErrorSeverity.WARNING]: 'warning',
  [ErrorSeverity.ERROR]: 'error',
  [ErrorSeverity.CRITICAL]: 'error'
} as const;

// Severity icon mapping
export const SEVERITY_ICONS = {
  [ErrorSeverity.INFO]: 'info',
  [ErrorSeverity.WARNING]: 'warning_amber',
  [ErrorSeverity.ERROR]: 'error',
  [ErrorSeverity.CRITICAL]: 'report_problem'
} as const;

// Severity display options
export const SEVERITY_DISPLAY_OPTIONS = {
  [ErrorSeverity.INFO]: {
    showInToast: true,
    showInBanner: false,
    showInModal: false,
    showInInline: true,
    showInConsole: true,
    showInLog: true
  },
  [ErrorSeverity.WARNING]: {
    showInToast: true,
    showInBanner: false,
    showInModal: false,
    showInInline: true,
    showInConsole: true,
    showInLog: true
  },
  [ErrorSeverity.ERROR]: {
    showInToast: true,
    showInBanner: true,
    showInModal: false,
    showInInline: true,
    showInConsole: true,
    showInLog: true
  },
  [ErrorSeverity.CRITICAL]: {
    showInToast: false,
    showInBanner: false,
    showInModal: true,
    showInInline: false,
    showInConsole: true,
    showInLog: true
  }
} as const;

// Severity handling strategies
export const SEVERITY_HANDLING_STRATEGIES = {
  [ErrorSeverity.INFO]: {
    retryable: false,
    recoverable: true,
    continueOnError: true,
    escalate: false,
    logImmediately: false
  },
  [ErrorSeverity.WARNING]: {
    retryable: true,
    recoverable: true,
    continueOnError: true,
    escalate: false,
    logImmediately: true
  },
  [ErrorSeverity.ERROR]: {
    retryable: true,
    recoverable: true,
    continueOnError: false,
    escalate: true,
    logImmediately: true
  },
  [ErrorSeverity.CRITICAL]: {
    retryable: false,
    recoverable: false,
    continueOnError: false,
    escalate: true,
    logImmediately: true
  }
} as const;

// Get severity level configuration
export function getSeverityLevel(severity: ErrorSeverity): SeverityLevel {
  return SEVERITY_LEVELS[severity];
}

// Get severity priority (higher number = higher priority)
export function getSeverityPriority(severity: ErrorSeverity): number {
  return SEVERITY_LEVELS[severity].priority;
}

// Compare severity levels
export function compareSeverity(a: ErrorSeverity, b: ErrorSeverity): number {
  return getSeverityPriority(b) - getSeverityPriority(a);
}

// Get highest severity from array
export function getHighestSeverity(severities: ErrorSeverity[]): ErrorSeverity {
  return severities.reduce((highest, current) => 
    compareSeverity(current, highest) > 0 ? current : highest
  );
}

// Check if severity requires immediate attention
export function requiresImmediateAttention(severity: ErrorSeverity): boolean {
  return severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR;
}

// Check if severity is recoverable
export function isRecoverable(severity: ErrorSeverity): boolean {
  return severity !== ErrorSeverity.CRITICAL;
}

// Get appropriate action for severity
export function getSeverityAction(severity: ErrorSeverity): 'continue' | 'retry' | 'stop' | 'escalate' {
  const strategy = SEVERITY_HANDLING_STRATEGIES[severity];
  
  if (strategy.continueOnError) {
    return 'continue';
  } else if (strategy.retryable) {
    return 'retry';
  } else if (strategy.escalate) {
    return 'escalate';
  } else {
    return 'stop';
  }
}

// Get notification duration for severity
export function getNotificationDuration(severity: ErrorSeverity): number {
  return SEVERITY_LEVELS[severity].notificationDuration || 0;
}

// Check if severity should auto-dismiss
export function shouldAutoDismiss(severity: ErrorSeverity): boolean {
  return SEVERITY_LEVELS[severity].autoDismiss;
}

// Get Material-UI color for severity
export function getMUIColor(severity: ErrorSeverity): 'info' | 'warning' | 'error' | 'success' {
  return SEVERITY_COLORS[severity];
}

// Get icon name for severity
export function getSeverityIcon(severity: ErrorSeverity): string {
  return SEVERITY_ICONS[severity];
}

// Get CSS classes for severity styling
export function getSeverityClasses(severity: ErrorSeverity): string[] {
  const level = SEVERITY_LEVELS[severity];
  return [
    `severity-${severity}`,
    `priority-${level.priority}`
  ];
}

// Get inline styles for severity
export function getSeverityStyles(severity: ErrorSeverity): React.CSSProperties {
  const level = SEVERITY_LEVELS[severity];
  return {
    backgroundColor: level.backgroundColor,
    borderColor: level.borderColor,
    color: level.textColor,
    border: '1px solid',
    borderRadius: '4px'
  };
}

// Severity threshold configuration
export const SEVERITY_THRESHOLDS = {
  // Maximum number of errors/warnings to display before summarizing
  MAX_DISPLAY_ERRORS: 5,
  MAX_DISPLAY_WARNINGS: 10,
  
  // Auto-dismiss timeouts (in milliseconds)
  AUTO_DISMISS_TIMEOUTS: {
    [ErrorSeverity.INFO]: 5000,
    [ErrorSeverity.WARNING]: 8000,
    [ErrorSeverity.ERROR]: 0, // No auto-dismiss
    [ErrorSeverity.CRITICAL]: 0 // No auto-dismiss
  },
  
  // Rate limiting for notifications
  NOTIFICATION_RATE_LIMIT: 1000, // Minimum 1 second between similar notifications
  
  // Critical error thresholds
  CRITICAL_ERROR_THRESHOLD: 3, // Maximum critical errors before system halt
  ERROR_RATE_THRESHOLD: 10 // Maximum errors per minute
} as const;

// Severity escalation rules
export const SEVERITY_ESCALATION_RULES = {
  // Escalate after multiple warnings
  WARNING_TO_ERROR_THRESHOLD: 3,
  WARNING_TO_ERROR_TIMEFRAME: 60000, // 1 minute
  
  // Escalate after multiple errors
  ERROR_TO_CRITICAL_THRESHOLD: 2,
  ERROR_TO_CRITICAL_TIMEFRAME: 30000, // 30 seconds
  
  // Auto-retry configuration
  AUTO_RETRY_ATTEMPTS: 3,
  AUTO_RETRY_DELAY: 1000, // 1 second
  
  // Escalation notifications
  ESCALATE_TO_ADMIN: true,
  ESCALATE_TO_MONITORING: true
} as const;