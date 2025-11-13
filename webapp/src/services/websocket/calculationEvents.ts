/**
 * Calculation event types for WebSocket communication
 */

// Event type definitions
export const CALCULATION_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  CONNECTION_STATE_CHANGE: 'connection_state_change',
  
  // Task management events
  TASK_CREATED: 'task_created',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  TASK_CANCELLED: 'task_cancelled',
  TASK_STATUS_UPDATE: 'task_status_update',
  
  // Progress events
  PROGRESS_UPDATE: 'progress_update',
  STAGE_CHANGE: 'stage_change',
  ESTIMATED_TIME_UPDATE: 'estimated_time_update',
  
  // Calculation events
  CALCULATION_START: 'calculation_start',
  CALCULATION_PROGRESS: 'calculation_progress',
  CALCULATION_COMPLETE: 'calculation_complete',
  CALCULATION_ERROR: 'calculation_error',
  CALCULATION_CANCEL: 'calculation_cancel',
  
  // System events
  SYSTEM_STATUS_UPDATE: 'system_status_update',
  SYSTEM_ERROR: 'system_error',
  HEARTBEAT: 'heartbeat',
  
  // Message events
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  BROADCAST: 'broadcast',
} as const;

// Type-safe event names
export type CalculationEventType = typeof CALCULATION_EVENTS[keyof typeof CALCULATION_EVENTS];

// Base event interface
export interface CalculationEvent {
  type: CalculationEventType;
  timestamp: Date;
  taskId?: string;
  userId?: string;
}

// Connection events
export interface ConnectionEvent extends CalculationEvent {
  type: 'connect' | 'disconnect' | 'reconnect' | 'connection_state_change';
  state: number; // WebSocket ready state
  message: string;
}

// Task events
export interface TaskEvent extends CalculationEvent {
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'task_cancelled';
  taskData?: {
    taskId: string;
    status: string;
    progress: number;
    message: string;
    startTime?: Date;
    endTime?: Date;
  };
}

export interface TaskStatusEvent extends CalculationEvent {
  type: 'task_status_update';
  status: string;
  progress: number;
  message: string;
  estimatedTime?: number;
  elapsedTime?: number;
}

// Progress events
export interface ProgressEvent extends CalculationEvent {
  type: 'progress_update' | 'stage_change' | 'estimated_time_update';
  progress: number;
  message: string;
  stage: string;
  estimatedTime?: number;
  elapsedTime?: number;
}

// Calculation events
export interface CalculationStartEvent extends CalculationEvent {
  type: 'calculation_start';
  configuration: any;
}

export interface CalculationProgressEvent extends CalculationEvent {
  type: 'calculation_progress';
  progress: number;
  stage: string;
  message: string;
  data?: any;
}

export interface CalculationCompleteEvent extends CalculationEvent {
  type: 'calculation_complete';
  result: any;
  executionTime: number;
}

export interface CalculationErrorEvent extends CalculationEvent {
  type: 'calculation_error';
  error: {
    code: string;
    message: string;
    details?: string;
    stack?: string;
  };
}

export interface CalculationCancelEvent extends CalculationEvent {
  type: 'calculation_cancel';
  reason?: string;
}

// System events
export interface SystemStatusEvent extends CalculationEvent {
  type: 'system_status_update';
  status: {
    healthy: boolean;
    activeTasks: number;
    queueLength: number;
    version: string;
    uptime: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

export interface SystemErrorEvent extends CalculationEvent {
  type: 'system_error';
  error: {
    code: string;
    message: string;
    severity: 'warning' | 'error' | 'critical';
  };
}

// Message events
export interface MessageEvent extends CalculationEvent {
  type: 'message_received' | 'message_sent' | 'broadcast';
  message: {
    id: string;
    type: string;
    data: any;
    timestamp: Date;
  };
}

// Union type for all calculation events
export type CalculationEventUnion = 
  | ConnectionEvent
  | TaskEvent
  | TaskStatusEvent
  | ProgressEvent
  | CalculationStartEvent
  | CalculationProgressEvent
  | CalculationCompleteEvent
  | CalculationErrorEvent
  | CalculationCancelEvent
  | SystemStatusEvent
  | SystemErrorEvent
  | MessageEvent;

// Event handler interfaces
export interface CalculationEventHandler {
  onConnectionChange?: (connected: boolean, state: number) => void;
  onTaskCreated?: (event: TaskEvent) => void;
  onTaskStarted?: (event: TaskEvent) => void;
  onTaskCompleted?: (event: TaskEvent) => void;
  onTaskFailed?: (event: TaskEvent) => void;
  onTaskCancelled?: (event: TaskEvent) => void;
  onTaskStatusUpdate?: (event: TaskStatusEvent) => void;
  onProgressUpdate?: (event: ProgressEvent) => void;
  onStageChange?: (event: ProgressEvent) => void;
  onCalculationStart?: (event: CalculationStartEvent) => void;
  onCalculationProgress?: (event: CalculationProgressEvent) => void;
  onCalculationComplete?: (event: CalculationCompleteEvent) => void;
  onCalculationError?: (event: CalculationErrorEvent) => void;
  onCalculationCancel?: (event: CalculationCancelEvent) => void;
  onSystemStatusUpdate?: (event: SystemStatusEvent) => void;
  onSystemError?: (event: SystemErrorEvent) => void;
  onMessageReceived?: (event: MessageEvent) => void;
  onBroadcast?: (event: MessageEvent) => void;
}

// Event dispatcher class
export class CalculationEventDispatcher {
  private handlers: CalculationEventHandler = {};

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<CalculationEventHandler>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Dispatch event to appropriate handler
   */
  dispatch(event: CalculationEventUnion): void {
    switch (event.type) {
      case CALCULATION_EVENTS.CONNECT:
      case CALCULATION_EVENTS.DISCONNECT:
      case CALCULATION_EVENTS.RECONNECT:
      case CALCULATION_EVENTS.CONNECTION_STATE_CHANGE:
        this.handlers.onConnectionChange?.(
          (event as ConnectionEvent).state === WebSocket.OPEN,
          (event as ConnectionEvent).state
        );
        break;

      case CALCULATION_EVENTS.TASK_CREATED:
        this.handlers.onTaskCreated?.(event as TaskEvent);
        break;

      case CALCULATION_EVENTS.TASK_STARTED:
        this.handlers.onTaskStarted?.(event as TaskEvent);
        break;

      case CALCULATION_EVENTS.TASK_COMPLETED:
        this.handlers.onTaskCompleted?.(event as TaskEvent);
        break;

      case CALCULATION_EVENTS.TASK_FAILED:
        this.handlers.onTaskFailed?.(event as TaskEvent);
        break;

      case CALCULATION_EVENTS.TASK_CANCELLED:
        this.handlers.onTaskCancelled?.(event as TaskEvent);
        break;

      case CALCULATION_EVENTS.TASK_STATUS_UPDATE:
        this.handlers.onTaskStatusUpdate?.(event as TaskStatusEvent);
        break;

      case CALCULATION_EVENTS.PROGRESS_UPDATE:
      case CALCULATION_EVENTS.STAGE_CHANGE:
      case CALCULATION_EVENTS.ESTIMATED_TIME_UPDATE:
        this.handlers.onProgressUpdate?.(event as ProgressEvent);
        if (event.type === CALCULATION_EVENTS.STAGE_CHANGE) {
          this.handlers.onStageChange?.(event as ProgressEvent);
        }
        break;

      case CALCULATION_EVENTS.CALCULATION_START:
        this.handlers.onCalculationStart?.(event as CalculationStartEvent);
        break;

      case CALCULATION_EVENTS.CALCULATION_PROGRESS:
        this.handlers.onCalculationProgress?.(event as CalculationProgressEvent);
        break;

      case CALCULATION_EVENTS.CALCULATION_COMPLETE:
        this.handlers.onCalculationComplete?.(event as CalculationCompleteEvent);
        break;

      case CALCULATION_EVENTS.CALCULATION_ERROR:
        this.handlers.onCalculationError?.(event as CalculationErrorEvent);
        break;

      case CALCULATION_EVENTS.CALCULATION_CANCEL:
        this.handlers.onCalculationCancel?.(event as CalculationCancelEvent);
        break;

      case CALCULATION_EVENTS.SYSTEM_STATUS_UPDATE:
        this.handlers.onSystemStatusUpdate?.(event as SystemStatusEvent);
        break;

      case CALCULATION_EVENTS.SYSTEM_ERROR:
        this.handlers.onSystemError?.(event as SystemErrorEvent);
        break;

      case CALCULATION_EVENTS.MESSAGE_RECEIVED:
      case CALCULATION_EVENTS.MESSAGE_SENT:
        this.handlers.onMessageReceived?.(event as MessageEvent);
        break;

      case CALCULATION_EVENTS.BROADCAST:
        this.handlers.onBroadcast?.(event as MessageEvent);
        break;
    }
  }

  /**
   * Create event factory methods
   */
  static createConnectionEvent(type: 'connect' | 'disconnect' | 'reconnect' | 'connection_state_change', state: number, message?: string): ConnectionEvent {
    return {
      type,
      timestamp: new Date(),
      state,
      message: message || '',
    };
  }

  static createTaskEvent(type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'task_cancelled', taskId: string, taskData?: any): TaskEvent {
    return {
      type,
      timestamp: new Date(),
      taskId,
      taskData,
    };
  }

  static createTaskStatusEvent(taskId: string, status: string, progress: number, message: string, estimatedTime?: number, elapsedTime?: number): TaskStatusEvent {
    return {
      type: 'task_status_update',
      timestamp: new Date(),
      taskId,
      status,
      progress,
      message,
      estimatedTime: estimatedTime || undefined,
      elapsedTime: elapsedTime || undefined,
    };
  }

  static createProgressEvent(type: 'progress_update' | 'stage_change' | 'estimated_time_update', taskId: string, progress: number, stage: string, message: string, estimatedTime?: number, elapsedTime?: number): ProgressEvent {
    return {
      type,
      timestamp: new Date(),
      taskId,
      progress,
      stage,
      message,
      estimatedTime: estimatedTime || undefined,
      elapsedTime: elapsedTime || undefined,
    };
  }

  static createCalculationCompleteEvent(taskId: string, result: any, executionTime: number): CalculationCompleteEvent {
    return {
      type: 'calculation_complete',
      timestamp: new Date(),
      taskId,
      result,
      executionTime,
    };
  }

  static createCalculationErrorEvent(taskId: string, error: any): CalculationErrorEvent {
    return {
      type: 'calculation_error',
      timestamp: new Date(),
      taskId,
      error,
    };
  }

  static createSystemStatusEvent(status: any): SystemStatusEvent {
    return {
      type: 'system_status_update',
      timestamp: new Date(),
      status,
    };
  }

  static createSystemErrorEvent(error: any): SystemErrorEvent {
    return {
      type: 'system_error',
      timestamp: new Date(),
      error,
    };
  }
}

// Export singleton instance
export const calculationEventDispatcher = new CalculationEventDispatcher();