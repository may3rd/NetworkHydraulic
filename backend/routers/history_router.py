"""FastAPI router for history endpoints.

This module provides API endpoints for managing calculation history
and user preferences.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import (
    delete_calculation,
    list_calculations,
)
from backend.exceptions import ValidationError
from backend.models import ErrorModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["History"])


@router.get(
    "/",
    summary="Get calculation history",
    description="Get paginated list of calculation history",
)
async def get_calculation_history(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    status: str = Query(None, description="Filter by status (pending, running, completed, failed)"),
    user_id: str = Query(None, description="Filter by user ID"),
):
    """Get calculation history with filtering and pagination.
    
    Args:
        limit: Maximum number of results
        offset: Offset for pagination
        status: Optional status filter
        user_id: Optional user ID filter
        
    Returns:
        Paginated calculation history
    """
    try:
        # Apply filters
        query_filters = {}
        if status:
            query_filters["status"] = status
        if user_id:
            query_filters["user_id"] = user_id
        
        calculations = list_calculations(
            user_id=user_id,
            limit=limit,
            offset=offset,
        )
        
        # Format response
        history_data = []
        for calc in calculations:
            history_item = {
                "id": calc.id,
                "name": calc.name,
                "description": calc.description,
                "status": calc.status,
                "created_at": calc.created_at.isoformat(),
                "completed_at": calc.completed_at.isoformat() if calc.completed_at else None,
                "has_results": calc.has_results,
                "error_message": calc.error_message[:100] + "..." if calc.error_message and len(calc.error_message) > 100 else calc.error_message,
                "execution_time": calc.execution_time,
                "user_id": calc.user_id,
            }
            history_data.append(history_item)
        
        return {
            "success": True,
            "data": history_data,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(history_data),
            },
            "filters": query_filters,
        }
        
    except Exception as e:
        logger.error(f"Error getting calculation history: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="HISTORY_ERROR",
                message="Failed to get calculation history",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/statistics",
    summary="Get calculation statistics",
    description="Get statistics about calculations",
)
async def get_calculation_statistics(
    user_id: str = Query(None, description="Filter by user ID"),
):
    """Get calculation statistics.
    
    Args:
        user_id: Optional user ID filter
        
    Returns:
        Calculation statistics
    """
    try:
        calculations = list_calculations(user_id=user_id)
        
        # Calculate statistics
        total_calculations = len(calculations)
        status_counts = {}
        for calc in calculations:
            status = calc.status
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Calculate average execution time
        completed_calculations = [calc for calc in calculations if calc.status == "completed"]
        if completed_calculations:
            total_time = sum(float(calc.execution_time.replace('s', '')) for calc in completed_calculations if calc.execution_time)
            avg_execution_time = total_time / len(completed_calculations)
        else:
            avg_execution_time = 0
        
        return {
            "success": True,
            "data": {
                "total_calculations": total_calculations,
                "status_breakdown": status_counts,
                "average_execution_time": f"{avg_execution_time:.2f}s",
                "completed_calculations": status_counts.get("completed", 0),
                "failed_calculations": status_counts.get("failed", 0),
                "pending_calculations": status_counts.get("pending", 0),
            },
        }
        
    except Exception as e:
        logger.error(f"Error getting calculation statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="STATISTICS_ERROR",
                message="Failed to get calculation statistics",
                details=str(e),
            ).dict(),
        )


@router.delete(
    "/{calculation_id}",
    summary="Delete calculation from history",
    description="Delete a calculation and its results from history",
)
async def delete_calculation_from_history(
    calculation_id: str,
    user_id: str = Query(None, description="User ID for permission checking"),
):
    """Delete calculation from history.
    
    Args:
        calculation_id: Calculation ID to delete
        user_id: Optional user ID for permission checking
        
    Returns:
        Deletion confirmation
        
    Raises:
        HTTPException: If calculation not found
    """
    try:
        success = delete_calculation(calculation_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=ErrorModel(
                    code="CALCULATION_NOT_FOUND",
                    message=f"Calculation with ID '{calculation_id}' not found",
                    suggestion="Please check the calculation ID and try again",
                ).dict(),
            )
        
        return {
            "success": True,
            "message": f"Calculation {calculation_id} deleted successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calculation {calculation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="DELETE_ERROR",
                message="Failed to delete calculation",
                details=str(e),
                suggestion="Please contact support",
            ).dict(),
        )


@router.delete(
    "/batch",
    summary="Delete multiple calculations",
    description="Delete multiple calculations by ID",
)
async def delete_multiple_calculations(
    calculation_ids: List[str] = Query(..., description="List of calculation IDs to delete"),
    user_id: str = Query(None, description="User ID for permission checking"),
):
    """Delete multiple calculations from history.
    
    Args:
        calculation_ids: List of calculation IDs to delete
        user_id: Optional user ID for permission checking
        
    Returns:
        Deletion results
        
    Raises:
        HTTPException: For validation errors
    """
    try:
        if not calculation_ids:
            raise HTTPException(
                status_code=400,
                detail=ErrorModel(
                    code="VALIDATION_ERROR",
                    message="No calculation IDs provided",
                    suggestion="Please provide at least one calculation ID",
                ).dict(),
            )
        
        if len(calculation_ids) > 100:
            raise HTTPException(
                status_code=400,
                detail=ErrorModel(
                    code="VALIDATION_ERROR",
                    message="Too many calculations to delete at once",
                    details="Maximum 100 calculations can be deleted in a single request",
                    suggestion="Please split the deletion into smaller batches",
                ).dict(),
            )
        
        results = {
            "deleted": [],
            "not_found": [],
            "failed": [],
        }
        
        for calc_id in calculation_ids:
            try:
                success = delete_calculation(calc_id, user_id)
                if success:
                    results["deleted"].append(calc_id)
                else:
                    results["not_found"].append(calc_id)
            except Exception as e:
                results["failed"].append({
                    "id": calc_id,
                    "error": str(e),
                })
        
        return {
            "success": True,
            "data": results,
            "summary": {
                "total_requested": len(calculation_ids),
                "successfully_deleted": len(results["deleted"]),
                "not_found": len(results["not_found"]),
                "failed": len(results["failed"]),
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch deletion: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="BATCH_DELETE_ERROR",
                message="Failed to delete calculations in batch",
                details=str(e),
                suggestion="Please contact support",
            ).dict(),
        )


@router.get(
    "/search",
    summary="Search calculations",
    description="Search calculations by name or description",
)
async def search_calculations(
    query: str = Query(..., min_length=3, description="Search query"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    user_id: str = Query(None, description="Filter by user ID"),
):
    """Search calculations by name or description.
    
    Args:
        query: Search query (minimum 3 characters)
        limit: Maximum number of results
        user_id: Optional user ID filter
        
    Returns:
        Search results
    """
    try:
        if len(query.strip()) < 3:
            raise HTTPException(
                status_code=400,
                detail=ErrorModel(
                    code="VALIDATION_ERROR",
                    message="Search query must be at least 3 characters long",
                    suggestion="Please enter a longer search query",
                ).dict(),
            )
        
        # Get all calculations with filters
        calculations = list_calculations(user_id=user_id, limit=limit * 10)  # Get more to filter
        
        # Filter by search query
        search_lower = query.lower().strip()
        search_results = []
        
        for calc in calculations:
            # Check if query matches name or description
            name_match = calc.name and search_lower in calc.name.lower()
            description_match = calc.description and search_lower in calc.description.lower()
            
            if name_match or description_match:
                search_results.append({
                    "id": calc.id,
                    "name": calc.name,
                    "description": calc.description,
                    "status": calc.status,
                    "created_at": calc.created_at.isoformat(),
                    "completed_at": calc.completed_at.isoformat() if calc.completed_at else None,
                    "has_results": calc.has_results,
                })
            
            if len(search_results) >= limit:
                break
        
        return {
            "success": True,
            "data": search_results,
            "search_info": {
                "query": query,
                "total_found": len(search_results),
                "limit": limit,
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching calculations: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="SEARCH_ERROR",
                message="Failed to search calculations",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/recent",
    summary="Get recent calculations",
    description="Get recently created or modified calculations",
)
async def get_recent_calculations(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    user_id: str = Query(None, description="Filter by user ID"),
):
    """Get recent calculations.
    
    Args:
        limit: Maximum number of results
        user_id: Optional user ID filter
        
    Returns:
        Recent calculations
    """
    try:
        calculations = list_calculations(user_id=user_id, limit=limit)
        
        recent_calculations = []
        for calc in calculations:
            recent_calculations.append({
                "id": calc.id,
                "name": calc.name,
                "description": calc.description,
                "status": calc.status,
                "created_at": calc.created_at.isoformat(),
                "updated_at": calc.updated_at.isoformat(),
                "completed_at": calc.completed_at.isoformat() if calc.completed_at else None,
                "has_results": calc.has_results,
            })
        
        return {
            "success": True,
            "data": recent_calculations,
            "info": {
                "limit": limit,
                "total": len(recent_calculations),
            },
        }
        
    except Exception as e:
        logger.error(f"Error getting recent calculations: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="RECENT_ERROR",
                message="Failed to get recent calculations",
                details=str(e),
            ).dict(),
        )