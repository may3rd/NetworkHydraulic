"""FastAPI router for calculation endpoints.

This module provides API endpoints for hydraulic calculations including
execution, validation, and progress tracking.
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile

from backend.config import settings
from backend.database import save_calculation
from backend.exceptions import (
    ConfigurationError,
    ConfigurationParseError,
    ValidationError,
)
from backend.integration import hydraulic_calculator
from.backend.models import (
    CalculationRequestModel,
    CalculationResponseModel,
    ErrorModel,
    FileUploadResponseModel,
    ValidationResult,
)
from backend.tasks import (
    get_calculation_status,
    get_system_status,
    list_calculation_history,
    run_background_calculation,
)
from backend.websocket import calculation_progress_callback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calculate", tags=["Calculation"])


@router.post(
    "/",
    response_model=CalculationResponseModel,
    summary="Execute hydraulic calculation",
    description="Execute hydraulic calculation synchronously or asynchronously",
)
async def execute_calculation(
    request: CalculationRequestModel,
    background_tasks: BackgroundTasks,
    async_calculation: bool = Query(
        False,
        description="Run calculation asynchronously in background"
    ),
):
    """Execute hydraulic calculation.
    
    Args:
        request: Calculation request with configuration
        background_tasks: FastAPI background tasks
        async_calculation: Whether to run asynchronously
        
    Returns:
        Calculation response with results or task ID
        
    Raises:
        HTTPException: For validation or calculation errors
    """
    try:
        if async_calculation:
            # Run asynchronously
            task_id = await run_background_calculation(
                request,
                background_tasks,
                task_callback=calculation_progress_callback,
            )
            
            return CalculationResponseModel(
                success=True,
                result={
                    "task_id": task_id,
                    "message": "Calculation started in background",
                    "status": "pending",
                },
                execution_time=None,
                warnings=[],
            )
        else:
            # Run synchronously
            result = hydraulic_calculator.calculate(request)
            
            return CalculationResponseModel(
                success=True,
                result=result,
                execution_time=None,  # Will be set by middleware
                warnings=[],  # Could be populated from result
            )
            
    except ValidationError as e:
        logger.warning(f"Validation error in calculation request: {e}")
        raise HTTPException(
            status_code=400,
            detail=ErrorModel(
                code="VALIDATION_ERROR",
                message="Configuration validation failed",
                details=str(e),
                field=getattr(e, 'field', None),
                suggestion=getattr(e, 'suggestion', None),
            ).dict(),
        )
    except ConfigurationError as e:
        logger.warning(f"Configuration error in calculation request: {e}")
        raise HTTPException(
            status_code=422,
            detail=ErrorModel(
                code="CONFIGURATION_ERROR",
                message="Invalid configuration",
                details=str(e),
                suggestion=getattr(e, 'suggestion', None),
            ).dict(),
        )
    except Exception as e:
        logger.error(f"Unexpected error in calculation request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="INTERNAL_ERROR",
                message="Calculation failed",
                details="An unexpected error occurred during calculation",
            ).dict(),
        )


@router.post(
    "/validate",
    response_model=ValidationResult,
    summary="Validate configuration",
    description="Validate hydraulic configuration without running calculation",
)
async def validate_configuration(request: CalculationRequestModel):
    """Validate hydraulic configuration.
    
    Args:
        request: Configuration to validate
        
    Returns:
        Validation result with errors and warnings
    """
    try:
        result = hydraulic_calculator.validate_configuration(request.configuration)
        return ValidationResult(**result)
        
    except ValidationError as e:
        logger.warning(f"Validation error: {e}")
        return ValidationResult(
            valid=False,
            errors=[str(e)],
            warnings=[],
            field_errors={getattr(e, 'field', ''): str(e)} if hasattr(e, 'field') else {},
        )
    except Exception as e:
        logger.error(f"Validation failed: {e}", exc_info=True)
        return ValidationResult(
            valid=False,
            errors=[f"Validation failed: {str(e)}"],
            warnings=[],
            field_errors={},
        )


@router.post(
    "/upload",
    response_model=FileUploadResponseModel,
    summary="Upload configuration file",
    description="Upload YAML or JSON configuration file for hydraulic calculation",
)
async def upload_configuration(
    file: UploadFile = File(..., description="Configuration file (YAML or JSON)"),
):
    """Upload configuration file for hydraulic calculation.
    
    Args:
        file: Uploaded configuration file
        
    Returns:
        Upload response with file information
        
    Raises:
        HTTPException: For upload or parsing errors
    """
    try:
        # Validate file type
        allowed_extensions = settings.allowed_file_types
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        
        if f".{file_extension}" not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=ErrorModel(
                    code="UNSUPPORTED_FILE_TYPE",
                    message=f"Unsupported file type: .{file_extension}",
                    details=f"Allowed file types: {', '.join(allowed_extensions)}",
                    suggestion="Please upload a YAML (.yaml, .yml) or JSON (.json) file",
                ).dict(),
            )
        
        # Validate file size
        max_size = settings.max_file_size
        content = await file.read()
        
        if len(content) > max_size:
            raise HTTPException(
                status_code=413,
                detail=ErrorModel(
                    code="FILE_SIZE_EXCEEDED",
                    message="File size exceeds limit",
                    details=f"File size {len(content)} bytes exceeds maximum {max_size} bytes",
                    suggestion=f"Please upload a file smaller than {max_size // (1024*1024)}MB",
                ).dict(),
            )
        
        # Parse configuration file
        try:
            config_data = hydraulic_calculator.parse_configuration_file(content, file.filename)
        except ConfigurationParseError as e:
            raise HTTPException(
                status_code=422,
                detail=ErrorModel(
                    code="CONFIGURATION_PARSE_ERROR",
                    message="Failed to parse configuration file",
                    details=str(e),
                    suggestion=getattr(e, 'suggestion', "Please check the file format and try again"),
                ).dict(),
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=ErrorModel(
                    code="FILE_UPLOAD_ERROR",
                    message="Unexpected error during file upload",
                    details=str(e),
                ).dict(),
            )
        
        # Validate configuration structure
        if not isinstance(config_data, dict) or "network" not in config_data:
            raise HTTPException(
                status_code=422,
                detail=ErrorModel(
                    code="INVALID_CONFIGURATION_FORMAT",
                    message="Invalid configuration file format",
                    details="Configuration must be a dictionary with 'network' key",
                    suggestion="Please check the configuration file structure",
                ).dict(),
            )
        
        # Save upload information
        file_id = f"upload_{file.filename}_{hash(content)}"
        
        # TODO: Save file to upload directory if needed
        # upload_path = os.path.join(settings.upload_dir, file_id)
        # with open(upload_path, 'wb') as f:
        #     f.write(content)
        
        return FileUploadResponseModel(
            success=True,
            file_id=file_id,
            filename=file.filename,
            file_size=len(content),
            content_type=file.content_type or "application/octet-stream",
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="FILE_UPLOAD_ERROR",
                message="Unexpected error during file upload",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/status/{task_id}",
    summary="Get calculation status",
    description="Get status of a background calculation task",
)
async def get_calculation_status_endpoint(task_id: str):
    """Get calculation status by task ID.
    
    Args:
        task_id: Task ID
        
    Returns:
        Task status information
        
    Raises:
        HTTPException: If task not found
    """
    status = get_calculation_status(task_id)
    if not status:
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="TASK_NOT_FOUND",
                message=f"Task with ID '{task_id}' not found",
                suggestion="Please check the task ID and try again",
            ).dict(),
        )
    
    return {
        "success": True,
        "data": status,
    }


@router.get(
    "/history",
    summary="Get calculation history",
    description="Get list of previous calculations",
)
async def get_calculation_history(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """Get calculation history.
    
    Args:
        limit: Maximum number of results
        offset: Offset for pagination
        
    Returns:
        List of calculation history items
    """
    history = list_calculation_history(limit=limit, offset=offset)
    
    return {
        "success": True,
        "data": history,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": len(history),
        },
    }


@router.delete(
    "/history/{calculation_id}",
    summary="Delete calculation history",
    description="Delete a calculation from history",
)
async def delete_calculation_history_endpoint(calculation_id: str):
    """Delete calculation from history.
    
    Args:
        calculation_id: Calculation ID to delete
        
    Returns:
        Deletion confirmation
        
    Raises:
        HTTPException: If calculation not found
    """
    from backend.database import delete_calculation
    
    success = delete_calculation(calculation_id)
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


@router.get(
    "/system/status",
    summary="Get system status",
    description="Get overall system status including active tasks and queue",
)
async def get_system_status_endpoint():
    """Get system status.
    
    Returns:
        System status information
    """
    status = get_system_status()
    
    return {
        "success": True,
        "data": status,
    }


@router.get(
    "/progress/ws-url",
    summary="Get WebSocket URL",
    description="Get WebSocket URL for real-time progress updates",
)
async def get_websocket_url():
    """Get WebSocket URL for progress updates.
    
    Returns:
        WebSocket connection information
    """
    return {
        "success": True,
        "data": {
            "websocket_url": f"ws://{settings.host}:{settings.port}/api/ws/calculation",
            "connection_info": {
                "supported_messages": [
                    "subscribe_task",
                    "get_task_status",
                    "ping"
                ],
                "task_subscription": "Send {\"type\": \"subscribe_task\", \"task_id\": \"<task_id>\"} to subscribe to task updates",
                "status_query": "Send {\"type\": \"get_task_status\", \"task_id\": \"<task_id>\"} to get current status",
                "ping": "Send {\"type\": \"ping\"} to check connection health",
            },
        },
    }