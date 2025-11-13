"""Main FastAPI application for Hydraulic Network Calculator API.

This module sets up the FastAPI application with proper metadata, CORS configuration,
middleware, and all API endpoints for the hydraulic network calculation system.
"""

import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Import from local modules (relative imports)
from config import settings
from database import init_db
from exceptions import (
    ConfigurationError,
    HydraulicCalculationError,
    ValidationError,
)
from routers import (
    calculation_router,
    configuration_router,
    history_router,
    results_router,
    websocket_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Hydraulic Network Calculator API...")
    await init_db()
    logger.info("Database initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Hydraulic Network Calculator API...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="Hydraulic Network Calculator API",
        description="REST API for hydraulic network analysis and calculation using the network-hydraulic library",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add trusted host middleware for security
    if settings.allowed_hosts:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.allowed_hosts,
        )
    
    # Add request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all incoming requests."""
        request_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        logger.info(
            f"Request {request_id}: {request.method} {request.url} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        response = await call_next(request)
        
        process_time = (datetime.utcnow() - start_time).total_seconds()
        logger.info(
            f"Response {request_id}: {response.status_code} "
            f"completed in {process_time:.4f}s"
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    # Global exception handlers
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        """Handle validation errors."""
        logger.error(f"Validation error: {exc}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Configuration validation failed",
                    "details": str(exc),
                    "field": getattr(exc, 'field', None),
                    "suggestion": getattr(exc, 'suggestion', None),
                },
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": getattr(request.state, 'request_id', None),
            },
        )
    
    @app.exception_handler(ConfigurationError)
    async def configuration_error_handler(request: Request, exc: ConfigurationError):
        """Handle configuration errors."""
        logger.error(f"Configuration error: {exc}")
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "CONFIGURATION_ERROR",
                    "message": "Invalid configuration",
                    "details": str(exc),
                },
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": getattr(request.state, 'request_id', None),
            },
        )
    
    @app.exception_handler(HydraulicCalculationError)
    async def calculation_error_handler(request: Request, exc: HydraulicCalculationError):
        """Handle hydraulic calculation errors."""
        logger.error(f"Calculation error: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "CALCULATION_ERROR",
                    "message": "Calculation failed",
                    "details": str(exc),
                },
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": getattr(request.state, 'request_id', None),
            },
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions."""
        logger.error(f"HTTP error {exc.status_code}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": "HTTP error",
                    "details": exc.detail,
                },
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": getattr(request.state, 'request_id', None),
            },
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions."""
        logger.error(f"Unexpected error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error",
                    "details": "An unexpected error occurred",
                },
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": getattr(request.state, 'request_id', None),
            },
        )
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "name": "Hydraulic Network Calculator API",
            "version": app.version,
            "description": app.description,
            "docs_url": app.docs_url,
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    # Health check endpoint
    @app.get("/api/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": app.version,
        }
    
    # Include routers
    app.include_router(calculation_router, prefix="/api")
    app.include_router(configuration_router, prefix="/api")
    app.include_router(results_router, prefix="/api")
    app.include_router(history_router, prefix="/api")
    app.include_router(websocket_router, prefix="/api")
    
    # Mount static files if needed
    if settings.static_files_dir and os.path.exists(settings.static_files_dir):
        app.mount("/static", StaticFiles(directory=settings.static_files_dir), name="static")
    
    return app


if __name__ == "__main__":
    uvicorn.run(
        "main:create_app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning",
    )