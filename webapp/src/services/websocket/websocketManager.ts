import type { CalculationProgress, ProgressUpdate } from '../calculation/progressTracker';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketConnectionConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  protocols?: string | string[];
}

export interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onProgressUpdate?: (progress: ProgressUpdate) => void;
  onCalculationComplete?: (result: any) => void;
  onCalculationError?: (error: any) => void;
}

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private config: WebSocketConnectionConfig;
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManualClose = false;

  constructor(config: WebSocketConnectionConfig) {
    this.config = config;
  }

  /**
   * Connect to WebSocket server
   */
  connect(eventHandlers?: WebSocketEventHandlers): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.isManualClose = false;
      this.eventHandlers = { ...this.eventHandlers, ...eventHandlers };

      try {
        this.socket = new WebSocket(
          this.config.url,
          this.config.protocols
        );

        this.socket.onopen = (event) => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          this.eventHandlers.onOpen?.(event);
          
          resolve();
        };

        this.socket.onclose = (event) => {
          this.isConnecting = false;
          this.stopHeartbeat();
          
          this.eventHandlers.onClose?.(event);
          
          // Attempt to reconnect if not manually closed and under max attempts
          if (!this.isManualClose && 
              this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (event) => {
          this.isConnecting = false;
          this.eventHandlers.onError?.(event);
          
          reject(new Error('WebSocket connection error'));
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
            this.eventHandlers.onMessage?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(message: WebSocketMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to task updates
   */
  subscribeToTask(taskId: string): boolean {
    return this.send({
      type: 'subscribe_task',
      data: { task_id: taskId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): boolean {
    return this.send({
      type: 'get_task_status',
      data: { task_id: taskId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send ping to server
   */
  ping(): boolean {
    return this.send({
      type: 'ping',
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getReadyState(): number {
    return this.socket?.readyState || WebSocket.CLOSED;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'progress_update':
        this.handleProgressUpdate(message.data);
        break;
      case 'calculation_complete':
        this.handleCalculationComplete(message.data);
        break;
      case 'calculation_error':
        this.handleCalculationError(message.data);
        break;
      case 'task_status':
        this.handleTaskStatus(message.data);
        break;
      case 'subscribed':
        this.handleSubscription(message.data);
        break;
      case 'pong':
        this.handlePong(message.data);
        break;
      case 'system_status':
        this.handleSystemStatus(message.data);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Handle progress updates
   */
  private handleProgressUpdate(data: any): void {
    const progressUpdate: ProgressUpdate = {
      progress: data.progress || 0,
      message: data.message || 'Processing',
      stage: data.stage || 'unknown',
      timestamp: new Date(),
      estimatedTime: data.estimated_time,
      elapsedTime: data.elapsed_time,
    };

    this.eventHandlers.onProgressUpdate?.(progressUpdate);
  }

  /**
   * Handle calculation completion
   */
  private handleCalculationComplete(data: any): void {
    this.eventHandlers.onCalculationComplete?.(data.result);
  }

  /**
   * Handle calculation errors
   */
  private handleCalculationError(data: any): void {
    this.eventHandlers.onCalculationError?.(data.error);
  }

  /**
   * Handle task status updates
   */
  private handleTaskStatus(data: any): void {
    // Handle task status message
    console.log('Task status:', data);
  }

  /**
   * Handle subscription confirmation
   */
  private handleSubscription(data: any): void {
    console.log('Subscribed to task:', data.task_id);
  }

  /**
   * Handle pong response
   */
  private handlePong(data: any): void {
    console.log('Pong received:', data);
  }

  /**
   * Handle system status updates
   */
  private handleSystemStatus(data: any): void {
    console.log('System status:', data);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000; // 30 seconds
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      }
    }, interval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    const interval = this.config.reconnectInterval || 5000; // 5 seconds
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts})...`);
      this.connect();
    }, interval);
  }

  /**
   * Update event handlers
   */
  updateEventHandlers(handlers: Partial<WebSocketEventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Remove event handler
   */
  removeEventHandler(event: keyof WebSocketEventHandlers): void {
    delete this.eventHandlers[event];
  }
}

// Export singleton instance factory
export function createWebSocketManager(url: string, config?: Partial<WebSocketConnectionConfig>): WebSocketManager {
  return new WebSocketManager({
    url,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    ...config,
  });
}