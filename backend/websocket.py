"""WebSocket support for real-time progress updates.

This module provides WebSocket endpoints for real-time communication
during hydraulic calculations, including progress updates, status changes,
and error streaming.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosed

from backend.models import WebSocketMessageModel, ProgressUpdateModel
from backend.tasks import task_manager

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_lock = asyncio.Lock()
        self.user_connections: Dict[str, List[str]] = {}  # user_id -> list of connection_ids
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: Optional[str] = None):
        """Accept WebSocket connection and add to active connections.
        
        Args:
            websocket: WebSocket connection
            connection_id: Unique connection ID
            user_id: Optional user ID
        """
        await websocket.accept()
        
        async with self.connection_lock:
            self.active_connections[connection_id] = websocket
            if user_id:
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = []
                self.user_connections[user_id].append(connection_id)
        
        logger.info(f"WebSocket connection {connection_id} established")
    
    def disconnect(self, connection_id: str):
        """Remove connection from active connections.
        
        Args:
            connection_id: Connection ID to remove
        """
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        # Clean up user connections
        for user_id, connections in self.user_connections.items():
            if connection_id in connections:
                connections.remove(connection_id)
                if not connections:
                    del self.user_connections[user_id]
                break
        
        logger.info(f"WebSocket connection {connection_id} disconnected")
    
    async def send_personal_message(self, message: Dict[str, Any], connection_id: str):
        """Send message to specific connection.
        
        Args:
            message: Message to send
            connection_id: Target connection ID
        """
        connection = self.active_connections.get(connection_id)
        if connection:
            try:
                await connection.send_text(json.dumps(message))
            except (ConnectionClosed, RuntimeError) as e:
                logger.warning(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def broadcast_to_user(self, message: Dict[str, Any], user_id: str):
        """Broadcast message to all connections for a user.
        
        Args:
            message: Message to send
            user_id: Target user ID
        """
        user_connections = self.user_connections.get(user_id, [])
        for connection_id in user_connections:
            await self.send_personal_message(message, connection_id)
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all active connections.
        
        Args:
            message: Message to send
        """
        disconnected_connections = []
        
        for connection_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except (ConnectionClosed, RuntimeError) as e:
                logger.warning(f"Failed to send message to {connection_id}: {e}")
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)


# Global connection manager
connection_manager = ConnectionManager()


class ProgressTracker:
    """Tracks progress for calculations and sends updates via WebSocket."""
    
    def __init__(self):
        """Initialize the progress tracker."""
        self.task_progress: Dict[str, Dict[str, Any]] = {}
        self.tracking_lock = asyncio.Lock()
    
    async def start_tracking(self, task_id: str, connection_id: str):
        """Start tracking progress for a task.
        
        Args:
            task_id: Task ID to track
            connection_id: Connection ID to send updates to
        """
        async with self.tracking_lock:
            self.task_progress[task_id] = {
                "connection_id": connection_id,
                "progress": 0.0,
                "message": "Task created",
                "stage": "initialization",
                "start_time": datetime.utcnow(),
            }
        
        # Send initial progress update
        await self._send_progress_update(
            task_id,
            0.0,
            "Task created, waiting to start",
            "initialization"
        )
    
    async def update_progress(
        self,
        task_id: str,
        progress: float,
        message: str,
        stage: str,
    ):
        """Update progress for a task.
        
        Args:
            task_id: Task ID
            progress: Progress percentage (0-100)
            message: Progress message
            stage: Current calculation stage
        """
        async with self.tracking_lock:
            if task_id not in self.task_progress:
                return
            
            self.task_progress[task_id].update({
                "progress": progress,
                "message": message,
                "stage": stage,
            })
        
        await self._send_progress_update(task_id, progress, message, stage)
    
    async def complete_tracking(self, task_id: str, success: bool, result: Optional[Dict[str, Any]] = None):
        """Complete tracking for a task.
        
        Args:
            task_id: Task ID
            success: Whether task completed successfully
            result: Optional result data
        """
        async with self.tracking_lock:
            if task_id not in self.task_progress:
                return
            
            progress_data = self.task_progress[task_id]
            connection_id = progress_data["connection_id"]
            start_time = progress_data["start_time"]
            
            # Clean up tracking
            del self.task_progress[task_id]
        
        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        if success:
            await self._send_completion_message(
                connection_id,
                task_id,
                "Calculation completed successfully",
                result,
                execution_time,
            )
        else:
            await self._send_error_message(
                connection_id,
                task_id,
                "Calculation failed",
                result,
                execution_time,
            )
    
    async def _send_progress_update(
        self,
        task_id: str,
        progress: float,
        message: str,
        stage: str,
    ):
        """Send progress update to client.
        
        Args:
            task_id: Task ID
            progress: Progress percentage
            message: Progress message
            stage: Current stage
        """
        async with self.tracking_lock:
            progress_data = self.task_progress.get(task_id)
            if not progress_data:
                return
            
            connection_id = progress_data["connection_id"]
        
        progress_update = ProgressUpdateModel(
            progress=progress,
            message=message,
            stage=stage,
        )
        
        message_data = WebSocketMessageModel(
            type="progress_update",
            data={
                "task_id": task_id,
                "progress": progress_update.dict(),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
        
        await connection_manager.send_personal_message(message_data.dict(), connection_id)
    
    async def _send_completion_message(
        self,
        connection_id: str,
        task_id: str,
        message: str,
        result: Optional[Dict[str, Any]],
        execution_time: float,
    ):
        """Send completion message to client.
        
        Args:
            connection_id: Connection ID
            task_id: Task ID
            message: Completion message
            result: Result data
            execution_time: Execution time in seconds
        """
        message_data = WebSocketMessageModel(
            type="calculation_complete",
            data={
                "task_id": task_id,
                "message": message,
                "result": result,
                "execution_time": execution_time,
                "completed_at": datetime.utcnow().isoformat(),
            },
        )
        
        await connection_manager.send_personal_message(message_data.dict(), connection_id)
    
    async def _send_error_message(
        self,
        connection_id: str,
        task_id: str,
        message: str,
        error_details: Optional[Dict[str, Any]],
        execution_time: float,
    ):
        """Send error message to client.
        
        Args:
            connection_id: Connection ID
            task_id: Task ID
            message: Error message
            error_details: Error details
            execution_time: Execution time in seconds
        """
        message_data = WebSocketMessageModel(
            type="calculation_error",
            data={
                "task_id": task_id,
                "message": message,
                "error": error_details,
                "execution_time": execution_time,
                "failed_at": datetime.utcnow().isoformat(),
            },
        )
        
        await connection_manager.send_personal_message(message_data.dict(), connection_id)


# Global progress tracker
progress_tracker = ProgressTracker()


async def calculation_progress_callback(data: Dict[str, Any]):
    """Callback function for calculation progress updates.
    
    Args:
        data: Progress data from calculation
    """
    task_id = data.get("task_id")
    calculation_type = data.get("type")
    
    if calculation_type == "completed":
        await progress_tracker.complete_tracking(task_id, True, data.get("result"))
    elif calculation_type == "failed":
        await progress_tracker.complete_tracking(task_id, False, {"error": data.get("error")})
    # Note: Progress updates during calculation would be sent via separate WebSocket messages
    # from the calculation engine itself


async def handle_websocket_message(websocket: WebSocket, connection_id: str):
    """Handle incoming WebSocket messages.
    
    Args:
        websocket: WebSocket connection
        connection_id: Connection ID
    """
    try:
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                message_type = message.get("type")
                
                if message_type == "subscribe_task":
                    task_id = message.get("task_id")
                    if task_id:
                        await progress_tracker.start_tracking(task_id, connection_id)
                        await connection_manager.send_personal_message({
                            "type": "subscribed",
                            "task_id": task_id,
                            "message": f"Subscribed to task {task_id}",
                            "timestamp": datetime.utcnow().isoformat(),
                        }, connection_id)
                
                elif message_type == "get_task_status":
                    task_id = message.get("task_id")
                    if task_id:
                        task = task_manager.get_task(task_id)
                        if task:
                            await connection_manager.send_personal_message({
                                "type": "task_status",
                                "task_id": task_id,
                                "status": task.status.value,
                                "progress": task.progress,
                                "message": task.message,
                                "timestamp": datetime.utcnow().isoformat(),
                            }, connection_id)
                        else:
                            await connection_manager.send_personal_message({
                                "type": "error",
                                "message": f"Task {task_id} not found",
                                "timestamp": datetime.utcnow().isoformat(),
                            }, connection_id)
                
                elif message_type == "ping":
                    await connection_manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    }, connection_id)
                
                else:
                    await connection_manager.send_personal_message({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}",
                        "timestamp": datetime.utcnow().isoformat(),
                    }, connection_id)
                    
            except json.JSONDecodeError:
                await connection_manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat(),
                }, connection_id)
                
    except WebSocketDisconnect:
        connection_manager.disconnect(connection_id)
        logger.info(f"WebSocket {connection_id} disconnected")
    except Exception as e:
        logger.error(f"Error in WebSocket message handler for {connection_id}: {e}")
        connection_manager.disconnect(connection_id)


async def websocket_endpoint(websocket: WebSocket, connection_id: str = None, user_id: Optional[str] = None):
    """Main WebSocket endpoint for real-time updates.
    
    Args:
        websocket: WebSocket connection
        connection_id: Optional connection ID (will generate if not provided)
        user_id: Optional user ID for connection management
    """
    if not connection_id:
        connection_id = f"ws_{websocket.client.host}_{websocket.client.port}_{datetime.utcnow().timestamp()}"
    
    # Connect to manager
    await connection_manager.connect(websocket, connection_id, user_id)
    
    try:
        # Send welcome message
        await connection_manager.send_personal_message({
            "type": "welcome",
            "connection_id": connection_id,
            "message": "Connected to Hydraulic Network Calculator WebSocket",
            "server_time": datetime.utcnow().isoformat(),
            "supported_messages": [
                "subscribe_task",
                "get_task_status", 
                "ping"
            ],
        }, connection_id)
        
        # Handle incoming messages
        await handle_websocket_message(websocket, connection_id)
        
    except WebSocketDisconnect:
        connection_manager.disconnect(connection_id)
        logger.info(f"WebSocket {connection_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
        connection_manager.disconnect(connection_id)


# Utility functions for sending progress updates during calculations
async def send_calculation_progress(
    task_id: str,
    progress: float,
    message: str,
    stage: str,
):
    """Send progress update for a calculation.
    
    Args:
        task_id: Task ID
        progress: Progress percentage (0-100)
        message: Progress message
        stage: Current calculation stage
    """
    await progress_tracker.update_progress(task_id, progress, message, stage)


async def broadcast_system_status():
    """Broadcast system status to all connected clients."""
    from backend.tasks import get_system_status
    
    system_status = get_system_status()
    
    message_data = WebSocketMessageModel(
        type="system_status",
        data={
            "status": system_status,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    
    await connection_manager.broadcast_to_all(message_data.dict())


# Background task for periodic system status updates
async def system_status_broadcaster():
    """Broadcast system status periodically to all connected clients."""
    while True:
        try:
            await broadcast_system_status()
            await asyncio.sleep(30)  # Broadcast every 30 seconds
        except Exception as e:
            logger.error(f"Error in system status broadcaster: {e}")
            await asyncio.sleep(30)


# Start the system status broadcaster when the module is imported
if __name__ != "__main__":
    # Only start if not running as main (to avoid issues during testing)
    asyncio.create_task(system_status_broadcaster())