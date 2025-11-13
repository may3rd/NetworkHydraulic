"""Background task management for hydraulic calculations.

This module provides background task management for handling calculations
asynchronously, progress tracking, and task queue management.
"""

import asyncio
import logging
import uuid
from datetime import datetime
from threading import Lock
from typing import Any, Dict, List, Optional, Callable

from fastapi import BackgroundTasks

from backend.config import settings
from backend.database import (
    CalculationModel,
    get_calculation,
    save_calculation,
    update_calculation_status,
)
from backend.exceptions import (
    CalculationNotFoundError,
    TaskAlreadyRunningError,
    TaskNotFoundError,
)
from backend.integration import hydraulic_calculator
from.backend.models import (
    BackgroundTaskModel,
    CalculationRequestModel,
    TaskStatus,
)

logger = logging.getLogger(__name__)


class TaskManager:
    """Manages background calculation tasks with progress tracking."""
    
    def __init__(self):
        """Initialize the task manager."""
        self._active_tasks: Dict[str, BackgroundTaskModel] = {}
        self._task_lock = Lock()
        self._max_concurrent_tasks = settings.max_concurrent_calculations
        self._progress_callbacks: Dict[str, List[Callable]] = {}
    
    def create_task(self, calculation_request: CalculationRequestModel) -> str:
        """Create a new background task.
        
        Args:
            calculation_request: The calculation request
            
        Returns:
            Task ID
            
        Raises:
            TaskAlreadyRunningError: If too many tasks are running
        """
        with self._task_lock:
            # Check if we can run more tasks
            running_tasks = [task for task in self._active_tasks.values() 
                           if task.status in [TaskStatus.RUNNING, TaskStatus.PENDING]]
            
            if len(running_tasks) >= self._max_concurrent_tasks:
                raise TaskAlreadyRunningError(
                    f"Maximum concurrent tasks ({self._max_concurrent_tasks}) reached",
                    suggestion="Please wait for existing tasks to complete"
                )
            
            # Create task
            task_id = str(uuid.uuid4())
            
            task = BackgroundTaskModel(
                task_id=task_id,
                status=TaskStatus.PENDING,
                progress=0.0,
                message="Task created, waiting to start",
            )
            
            # Save to database
            calculation_id = save_calculation(
                name=calculation_request.configuration.network.name,
                configuration=calculation_request.dict(),
                description=calculation_request.configuration.network.description,
            )
            
            task.calculation_id = calculation_id
            self._active_tasks[task_id] = task
            
            logger.info(f"Created task {task_id} for calculation {calculation_id}")
            return task_id
    
    async def run_task(self, task_id: str, calculation_request: CalculationRequestModel):
        """Run a background task.
        
        Args:
            task_id: Task ID
            calculation_request: Calculation request
        """
        task = self._active_tasks.get(task_id)
        if not task:
            logger.error(f"Task {task_id} not found")
            return
        
        try:
            # Update task status
            self._update_task_status(task_id, TaskStatus.RUNNING, 0.0, "Starting calculation...")
            
            # Execute calculation
            start_time = datetime.utcnow()
            
            # Run calculation in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                hydraulic_calculator.calculate,
                calculation_request
            )
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Update task with results
            self._update_task_status(
                task_id,
                TaskStatus.COMPLETED,
                100.0,
                "Calculation completed successfully",
            )
            
            # Save results to database
            update_calculation_status(
                task.calculation_id,
                "completed",
                result,
                execution_time=execution_time,
            )
            
            logger.info(f"Task {task_id} completed successfully")
            
            # Notify progress callbacks
            await self._notify_progress_callbacks(task_id, {
                "type": "completed",
                "task_id": task_id,
                "result": result,
                "execution_time": execution_time,
            })
            
        except Exception as e:
            # Update task with error
            self._update_task_status(
                task_id,
                TaskStatus.FAILED,
                0.0,
                f"Calculation failed: {str(e)}",
            )
            
            # Save error to database
            update_calculation_status(
                task.calculation_id,
                "failed",
                error_message=str(e),
            )
            
            logger.error(f"Task {task_id} failed: {e}")
            
            # Notify progress callbacks
            await self._notify_progress_callbacks(task_id, {
                "type": "failed",
                "task_id": task_id,
                "error": str(e),
            })
    
    def get_task(self, task_id: str) -> Optional[BackgroundTaskModel]:
        """Get task status by ID.
        
        Args:
            task_id: Task ID
            
        Returns:
            Task model or None if not found
        """
        return self._active_tasks.get(task_id)
    
    def list_tasks(self) -> List[BackgroundTaskModel]:
        """List all tasks.
        
        Returns:
            List of all task models
        """
        return list(self._active_tasks.values())
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task.
        
        Args:
            task_id: Task ID
            
        Returns:
            True if task was cancelled, False if not found
        """
        task = self._active_tasks.get(task_id)
        if not task:
            return False
        
        if task.status in [TaskStatus.RUNNING, TaskStatus.PENDING]:
            self._update_task_status(task_id, TaskStatus.CANCELLED, 0.0, "Task cancelled by user")
            logger.info(f"Task {task_id} cancelled")
            return True
        
        return False
    
    def cleanup_completed_tasks(self, max_age_hours: int = 24) -> int:
        """Clean up old completed tasks.
        
        Args:
            max_age_hours: Maximum age in hours
            
        Returns:
            Number of tasks cleaned up
        """
        cutoff_time = datetime.utcnow().timestamp() - (max_age_hours * 3600)
        tasks_to_remove = []
        
        with self._task_lock:
            for task_id, task in self._active_tasks.items():
                if (task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED] and
                    task.completed_at and
                    task.completed_at.timestamp() < cutoff_time):
                    tasks_to_remove.append(task_id)
        
        # Remove tasks outside of lock
        for task_id in tasks_to_remove:
            del self._active_tasks[task_id]
            logger.info(f"Cleaned up old task {task_id}")
        
        return len(tasks_to_remove)
    
    def register_progress_callback(self, task_id: str, callback: Callable):
        """Register a progress callback for a task.
        
        Args:
            task_id: Task ID
            callback: Callback function
        """
        if task_id not in self._progress_callbacks:
            self._progress_callbacks[task_id] = []
        self._progress_callbacks[task_id].append(callback)
    
    def _update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        progress: float,
        message: str,
    ):
        """Update task status internally.
        
        Args:
            task_id: Task ID
            status: New status
            progress: Progress percentage
            message: Status message
        """
        with self._task_lock:
            task = self._active_tasks.get(task_id)
            if not task:
                return
            
            task.status = status
            task.progress = progress
            task.message = message
            
            if status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                task.completed_at = datetime.utcnow()
    
    async def _notify_progress_callbacks(self, task_id: str, data: Dict[str, Any]):
        """Notify progress callbacks for a task.
        
        Args:
            task_id: Task ID
            data: Progress data
        """
        callbacks = self._progress_callbacks.get(task_id, [])
        for callback in callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(data)
                else:
                    callback(data)
            except Exception as e:
                logger.error(f"Error in progress callback for task {task_id}: {e}")
        
        # Clean up callbacks after completion
        if task_id in self._progress_callbacks:
            del self._progress_callbacks[task_id]


# Global task manager instance
task_manager = TaskManager()


class CalculationQueue:
    """Manages a queue of calculation requests."""
    
    def __init__(self):
        """Initialize the calculation queue."""
        self._queue: List[Dict[str, Any]] = []
        self._queue_lock = Lock()
        self._processing = False
    
    def enqueue(self, calculation_request: CalculationRequestModel, priority: int = 0) -> str:
        """Add a calculation to the queue.
        
        Args:
            calculation_request: Calculation request
            priority: Priority level (higher = more priority)
            
        Returns:
            Task ID
        """
        task_id = task_manager.create_task(calculation_request)
        
        with self._queue_lock:
            queue_item = {
                "task_id": task_id,
                "request": calculation_request,
                "priority": priority,
                "created_at": datetime.utcnow(),
            }
            
            # Insert by priority (higher priority first)
            inserted = False
            for i, item in enumerate(self._queue):
                if item["priority"] < priority:
                    self._queue.insert(i, queue_item)
                    inserted = True
                    break
            
            if not inserted:
                self._queue.append(queue_item)
            
            logger.info(f"Enqueued task {task_id} with priority {priority}")
            
            # Start processing if not already running
            if not self._processing:
                asyncio.create_task(self._process_queue())
            
            return task_id
    
    async def _process_queue(self):
        """Process items in the queue."""
        self._processing = True
        
        try:
            while self._queue:
                # Get next item from queue
                with self._queue_lock:
                    if not self._queue:
                        break
                    queue_item = self._queue.pop(0)
                
                task_id = queue_item["task_id"]
                request = queue_item["request"]
                
                logger.info(f"Processing queued task {task_id}")
                
                # Run the task
                await task_manager.run_task(task_id, request)
                
                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.1)
                
        finally:
            self._processing = False
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status.
        
        Returns:
            Queue status information
        """
        with self._queue_lock:
            return {
                "queue_length": len(self._queue),
                "processing": self._processing,
                "queued_tasks": [
                    {
                        "task_id": item["task_id"],
                        "priority": item["priority"],
                        "created_at": item["created_at"].isoformat(),
                        "network_name": item["request"].configuration.network.name,
                    }
                    for item in self._queue
                ],
            }


# Global calculation queue instance
calculation_queue = CalculationQueue()


async def run_background_calculation(
    calculation_request: CalculationRequestModel,
    background_tasks: BackgroundTasks,
    task_callback: Optional[Callable] = None,
) -> str:
    """Run a calculation in the background.
    
    Args:
        calculation_request: Calculation request
        background_tasks: FastAPI background tasks
        task_callback: Optional callback for progress updates
        
    Returns:
        Task ID
        
    Raises:
        TaskAlreadyRunningError: If too many tasks are running
    """
    # Create task
    task_id = task_manager.create_task(calculation_request)
    
    # Register callback if provided
    if task_callback:
        task_manager.register_progress_callback(task_id, task_callback)
    
    # Add to background tasks
    background_tasks.add_task(task_manager.run_task, task_id, calculation_request)
    
    logger.info(f"Started background calculation {task_id}")
    return task_id


def get_calculation_status(calculation_id: str) -> Optional[Dict[str, Any]]:
    """Get calculation status from database.
    
    Args:
        calculation_id: Calculation ID
        
    Returns:
        Status information or None if not found
    """
    calculation = get_calculation(calculation_id)
    if not calculation:
        return None
    
    # Get task status if available
    task_id = None
    for task in task_manager.list_tasks():
        if hasattr(task, 'calculation_id') and task.calculation_id == calculation_id:
            task_id = task.task_id
            break
    
    return {
        "calculation_id": calculation.id,
        "task_id": task_id,
        "name": calculation.name,
        "description": calculation.description,
        "status": calculation.status,
        "created_at": calculation.created_at.isoformat(),
        "completed_at": calculation.completed_at.isoformat() if calculation.completed_at else None,
        "has_results": calculation.has_results,
        "error_message": calculation.error_message,
        "execution_time": calculation.execution_time,
    }


def list_calculation_history(
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List calculation history.
    
    Args:
        limit: Maximum number of results
        offset: Offset for pagination
        
    Returns:
        List of calculation history items
    """
    from backend.database import list_calculations
    
    calculations = list_calculations(limit=limit, offset=offset)
    
    return [
        {
            "id": calc.id,
            "name": calc.name,
            "description": calc.description,
            "status": calc.status,
            "created_at": calc.created_at.isoformat(),
            "completed_at": calc.completed_at.isoformat() if calc.completed_at else None,
            "has_results": calc.has_results,
            "error_message": calc.error_message[:100] + "..." if calc.error_message and len(calc.error_message) > 100 else calc.error_message,
        }
        for calc in calculations
    ]


def delete_calculation_history(calculation_id: str, user_id: Optional[str] = None) -> bool:
    """Delete calculation from history.
    
    Args:
        calculation_id: Calculation ID
        user_id: Optional user ID for permission checking
        
    Returns:
        True if successful, False if not found
    """
    from backend.database import delete_calculation
    
    return delete_calculation(calculation_id, user_id)


# Utility functions for task management
def get_system_status() -> Dict[str, Any]:
    """Get overall system status.
    
    Returns:
        System status information
    """
    active_tasks = task_manager.list_tasks()
    queue_status = calculation_queue.get_queue_status()
    
    return {
        "system": {
            "active_tasks": len([t for t in active_tasks if t.status == TaskStatus.RUNNING]),
            "pending_tasks": len([t for t in active_tasks if t.status == TaskStatus.PENDING]),
            "total_tasks": len(active_tasks),
            "max_concurrent_tasks": settings.max_concurrent_calculations,
        },
        "queue": queue_status,
        "tasks": [
            {
                "task_id": task.task_id,
                "status": task.status.value,
                "progress": task.progress,
                "message": task.message,
                "created_at": task.created_at.isoformat(),
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            }
            for task in active_tasks
        ],
    }