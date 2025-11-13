export { createWebSocketManager, type WebSocketManager, type WebSocketConnectionConfig, type WebSocketMessage } from './websocketManager';
export { progressWebSocket, type ProgressWebSocket, type ProgressWebSocketConfig, type ProgressWebSocketEvents } from './progressWebSocket';
export {
  calculationEventDispatcher,
  type CalculationEvent,
  type CalculationEventUnion,
  type CalculationEventHandler,
  type ConnectionEvent,
  type TaskEvent,
  type TaskStatusEvent,
  type ProgressEvent,
  type CalculationStartEvent,
  type CalculationProgressEvent,
  type CalculationCompleteEvent,
  type CalculationErrorEvent,
  type CalculationCancelEvent,
  type SystemStatusEvent,
  type SystemErrorEvent,
  type MessageEvent,
  CALCULATION_EVENTS,
} from './calculationEvents';