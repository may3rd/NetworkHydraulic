"""Custom exception classes for the Hydraulic Network Calculator API.

This module defines all custom exceptions used throughout the application
with proper error codes, messages, and optional field information for
better error handling and user feedback.
"""

from typing import Optional


class HydraulicCalculatorError(Exception):
    """Base exception for hydraulic calculator errors."""
    
    def __init__(
        self,
        message: str,
        error_code: str = "HYDRAULIC_ERROR",
        field: Optional[str] = None,
        suggestion: Optional[str] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.field = field
        self.suggestion = suggestion
        super().__init__(self.message)
    
    def __str__(self):
        return f"{self.error_code}: {self.message}"


class ValidationError(HydraulicCalculatorError):
    """Exception raised for validation errors."""
    
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        suggestion: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            field=field,
            suggestion=suggestion,
        )


class ConfigurationError(HydraulicCalculatorError):
    """Exception raised for configuration errors."""
    
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        suggestion: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            field=field,
            suggestion=suggestion,
        )


class HydraulicCalculationError(HydraulicCalculatorError):
    """Exception raised for hydraulic calculation errors."""
    
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        suggestion: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            error_code="CALCULATION_ERROR",
            field=field,
            suggestion=suggestion,
        )


class FileUploadError(HydraulicCalculatorError):
    """Exception raised for file upload errors."""
    
    def __init__(
        self,
        message: str,
        file_type: Optional[str] = None,
        line: Optional[int] = None,
        suggestion: Optional[str] = None,
    ):
        self.file_type = file_type
        self.line = line
        error_code = f"FILE_UPLOAD_ERROR_{file_type.upper()}" if file_type else "FILE_UPLOAD_ERROR"
        super().__init__(
            message=message,
            error_code=error_code,
            suggestion=suggestion,
        )


class NetworkHydraulicIntegrationError(HydraulicCalculatorError):
    """Exception raised for network-hydraulic integration errors."""
    
    def __init__(
        self,
        message: str,
        original_exception: Optional[Exception] = None,
        suggestion: Optional[str] = None,
    ):
        self.original_exception = original_exception
        super().__init__(
            message=message,
            error_code="NETWORK_HYDRAULIC_ERROR",
            suggestion=suggestion,
        )


class UnsupportedFileTypeError(FileUploadError):
    """Exception raised when file type is not supported."""
    
    def __init__(self, file_type: str, suggestion: Optional[str] = None):
        message = f"Unsupported file type: {file_type}. Supported types: .yaml, .yml, .json"
        super().__init__(
            message=message,
            file_type=file_type,
            suggestion=suggestion or "Please upload a YAML or JSON configuration file",
        )


class FileSizeLimitError(FileUploadError):
    """Exception raised when file size exceeds limit."""
    
    def __init__(self, file_size: int, max_size: int, suggestion: Optional[str] = None):
        message = f"File size {file_size} bytes exceeds maximum allowed size of {max_size} bytes"
        super().__init__(
            message=message,
            suggestion=suggestion or f"Please upload a file smaller than {max_size // (1024*1024)}MB",
        )


class ConfigurationParseError(FileUploadError):
    """Exception raised when configuration file cannot be parsed."""
    
    def __init__(
        self,
        message: str,
        file_type: str,
        line: Optional[int] = None,
        suggestion: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            file_type=file_type,
            line=line,
            suggestion=suggestion or "Please check the file format and try again",
        )


class CalculationTimeoutError(HydraulicCalculationError):
    """Exception raised when calculation times out."""
    
    def __init__(self, timeout: int, suggestion: Optional[str] = None):
        message = f"Calculation timed out after {timeout} seconds"
        super().__init__(
            message=message,
            suggestion=suggestion or "Please try with a smaller network or contact support",
        )


class CalculationNotFoundError(HydraulicCalculatorError):
    """Exception raised when calculation result is not found."""
    
    def __init__(self, calculation_id: str, suggestion: Optional[str] = None):
        message = f"Calculation with ID '{calculation_id}' not found"
        super().__init__(
            message=message,
            error_code="CALCULATION_NOT_FOUND",
            suggestion=suggestion or "Please check the calculation ID and try again",
        )


class InvalidCalculationStatusError(HydraulicCalculatorError):
    """Exception raised when calculation status is invalid."""
    
    def __init__(self, status: str, suggestion: Optional[str] = None):
        message = f"Invalid calculation status: {status}"
        super().__init__(
            message=message,
            error_code="INVALID_CALCULATION_STATUS",
            suggestion=suggestion or "Please check the calculation status and try again",
        )


class DatabaseError(HydraulicCalculatorError):
    """Exception raised for database errors."""
    
    def __init__(
        self,
        message: str,
        operation: Optional[str] = None,
        suggestion: Optional[str] = None,
    ):
        error_code = f"DATABASE_ERROR_{operation.upper()}" if operation else "DATABASE_ERROR"
        super().__init__(
            message=message,
            error_code=error_code,
            suggestion=suggestion,
        )


class WebSocketError(HydraulicCalculatorError):
    """Exception raised for WebSocket errors."""
    
    def __init__(
        self,
        message: str,
        connection_id: Optional[str] = None,
        suggestion: Optional[str] = None,
    ):
        error_code = f"WEBSOCKET_ERROR" if not connection_id else f"WEBSOCKET_ERROR_{connection_id}"
        super().__init__(
            message=message,
            error_code=error_code,
            suggestion=suggestion,
        )


class TaskNotFoundError(HydraulicCalculatorError):
    """Exception raised when background task is not found."""
    
    def __init__(self, task_id: str, suggestion: Optional[str] = None):
        message = f"Background task with ID '{task_id}' not found"
        super().__init__(
            message=message,
            error_code="TASK_NOT_FOUND",
            suggestion=suggestion or "Please check the task ID and try again",
        )


class TaskAlreadyRunningError(HydraulicCalculatorError):
    """Exception raised when task is already running."""
    
    def __init__(self, task_id: str, suggestion: Optional[str] = None):
        message = f"Task with ID '{task_id}' is already running"
        super().__init__(
            message=message,
            error_code="TASK_ALREADY_RUNNING",
            suggestion=suggestion or "Please wait for the current task to complete",
        )


# Utility functions for exception handling
def create_validation_error(field: str, message: str, suggestion: Optional[str] = None) -> ValidationError:
    """Create a validation error with field information."""
    return ValidationError(
        message=message,
        field=field,
        suggestion=suggestion,
    )


def create_configuration_error(message: str, field: Optional[str] = None, suggestion: Optional[str] = None) -> ConfigurationError:
    """Create a configuration error."""
    return ConfigurationError(
        message=message,
        field=field,
        suggestion=suggestion,
    )


def create_calculation_error(message: str, field: Optional[str] = None, suggestion: Optional[str] = None) -> HydraulicCalculationError:
    """Create a calculation error."""
    return HydraulicCalculationError(
        message=message,
        field=field,
        suggestion=suggestion,
    )


def create_network_hydraulic_error(
    message: str,
    original_exception: Optional[Exception] = None,
    suggestion: Optional[str] = None,
) -> NetworkHydraulicIntegrationError:
    """Create a network-hydraulic integration error."""
    return NetworkHydraulicIntegrationError(
        message=message,
        original_exception=original_exception,
        suggestion=suggestion,
    )