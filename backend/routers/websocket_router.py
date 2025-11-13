"""FastAPI router for WebSocket endpoints.

This module provides WebSocket endpoints for real-time communication
during hydraulic calculations.
"""

import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.websocket import websocket_endpoint

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/calculation")
async def websocket_calculation_endpoint(
    websocket: WebSocket,
    connection_id: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """WebSocket endpoint for calculation progress updates.
    
    Args:
        websocket: WebSocket connection
        connection_id: Optional connection ID (auto-generated if not provided)
        user_id: Optional user ID for connection management
    """
    try:
        await websocket_endpoint(websocket, connection_id, user_id)
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        # Note: We don't need to explicitly close the connection as FastAPI handles this


@router.websocket("/ws/system")
async def websocket_system_endpoint(
    websocket: WebSocket,
    connection_id: Optional[str] = None,
):
    """WebSocket endpoint for system status updates.
    
    Args:
        websocket: WebSocket connection
        connection_id: Optional connection ID (auto-generated if not provided)
    """
    try:
        await websocket_endpoint(websocket, connection_id)
    except WebSocketDisconnect:
        logger.info("WebSocket system connection closed")
    except Exception as e:
        logger.error(f"WebSocket system error: {e}")