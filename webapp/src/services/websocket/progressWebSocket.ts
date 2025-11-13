import { createWebSocketManager, type WebSocketManager } from './websocketManager';
import type { ProgressUpdate, CalculationProgress } from '../calculation/progressTracker';
import type { CalculationError } from '../calculation/errorHandler';

export interface ProgressWebSocketConfig {
  websocketUrl?: string;
  autoConnect?: boolean;
  reconnectOnClose?: boolean;
  enableLogging?: boolean;
}

export interface ProgressWebSocketEvents {
  onProgressUpdate?: (progressUpdate: ProgressUpdate) => void;
  onCalculationComplete?: (taskId: string, result: any) => void;
  onCalculationError?: (taskId: string, error: CalculationError) => void;
  onConnectionStateChange?: (connected: boolean, state: number) => void;
  onTaskStatusUpdate?: (taskId: string, status: string, message: string) => void;
}

export class ProgressWebSocket {
  private websocketManager: WebSocketManager | null = null;
  private config: ProgressWebSocketConfig;
  private events: ProgressWebSocketEvents = {};
  private subscriptions: Set<string> = new Set();
  private connectionState = false;

  constructor(config: ProgressWebSocketConfig = {}) {
    this.config = {
      autoConnect: false,
      reconnectOnClose: true,
      enableLogging: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') || false,
      ...config,
    };

    // Get WebSocket URL from environment or use default
    if (!this.config.websocketUrl) {
      this.config.websocketUrl = (typeof window !== 'undefined' && (window as any).VITE_WEBSOCKET_URL) || 
        'ws://localhost:8000/api/ws/calculation';
    }

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<boolean> {
    try {
      this.websocketManager = createWebSocketManager(this.config.websocketUrl!);
      
      await this.websocketManager.connect({
        onOpen: () => {
          this.log('WebSocket connected');
          this.connectionState = true;
          this.events.onConnectionStateChange?.(true, WebSocket.OPEN);
          
          // Resubscribe to previously subscribed tasks
          this.resubscribeToTasks();
        },
        onClose: (event) => {
          this.log('WebSocket disconnected:', event.code, event.reason);
          this.connectionState = false;
          this.events.onConnectionStateChange?.(false, WebSocket.CLOSED);
          
          if (this.config.reconnectOnClose && !event.wasClean) {
            this.log('Attempting to reconnect...');
            setTimeout(() => this.connect(), 3000);
          }
        },
        onError: (event) => {
          this.log('WebSocket error:', event);
          this.events.onConnectionStateChange?.(false, WebSocket.CONNECTING);
        },
        onProgressUpdate: (progressUpdate) => {
          this.log('Progress update:', progressUpdate);
          this.events.onProgressUpdate?.(progressUpdate);
        },
        onCalculationComplete: (result) => {
          this.log('Calculation complete:', result);
          this.events.onCalculationComplete?.(result.task_id, result.result);
          this.unsubscribeFromTask(result.task_id);
        },
        onCalculationError: (error) => {
          this.log('Calculation error:', error);
          const calculationError = this.normalizeError(error);
          this.events.onCalculationError?.(error.task_id, calculationError);
          this.unsubscribeFromTask(error.task_id);
        },
      });

      return true;
    } catch (error) {
      this.log('Failed to connect to WebSocket:', error);
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.websocketManager) {
      this.websocketManager.disconnect();
      this.websocketManager = null;
      this.connectionState = false;
      this.subscriptions.clear();
      this.events.onConnectionStateChange?.(false, WebSocket.CLOSED);
    }
  }

  /**
   * Subscribe to task progress updates
   */
  subscribeToTask(taskId: string): boolean {
    if (!this.websocketManager || !this.isConnected()) {
      this.log('Cannot subscribe: WebSocket not connected');
      return false;
    }

    const success = this.websocketManager.subscribeToTask(taskId);
    if (success) {
      this.subscriptions.add(taskId);
      this.log(`Subscribed to task: ${taskId}`);
    }
    return success;
  }

  /**
   * Unsubscribe from task progress updates
   */
  unsubscribeFromTask(taskId: string): void {
    this.subscriptions.delete(taskId);
    this.log(`Unsubscribed from task: ${taskId}`);
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): boolean {
    if (!this.websocketManager || !this.isConnected()) {
      return false;
    }

    return this.websocketManager.getTaskStatus(taskId);
  }

  /**
   * Update event handlers
   */
  updateEventHandlers(events: Partial<ProgressWebSocketEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState && this.websocketManager?.isConnected() === true;
  }

  /**
   * Get connection state
   */
  getReadyState(): number {
    return this.websocketManager?.getReadyState() || WebSocket.CLOSED;
  }

  /**
   * Get subscribed tasks
   */
  getSubscribedTasks(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * Resubscribe to all previously subscribed tasks
   */
  private resubscribeToTasks(): void {
    const tasks = Array.from(this.subscriptions);
    this.subscriptions.clear();
    
    tasks.forEach(taskId => {
      setTimeout(() => {
        this.subscribeToTask(taskId);
      }, 100); // Small delay between subscriptions
    });
  }

  /**
   * Normalize error from WebSocket message
   */
  private normalizeError(errorData: any): CalculationError {
    return {
      type: 'network',
      code: errorData.code || 'WEBSOCKET_ERROR',
      message: errorData.message || 'WebSocket error occurred',
      details: errorData.details || errorData.error,
      field: errorData.field,
      suggestion: errorData.suggestion,
      timestamp: new Date(),
      recoverable: true,
    };
  }

  /**
   * Log messages if enabled
   */
  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[ProgressWebSocket]', ...args);
    }
  }
}

// Export singleton instance
export const progressWebSocket = new ProgressWebSocket({
  autoConnect: false, // Only connect when needed
  enableLogging: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') || false,
});