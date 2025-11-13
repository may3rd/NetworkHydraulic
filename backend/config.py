"""Application configuration using Pydantic settings management.

This module provides centralized configuration for the FastAPI application
including database settings, CORS origins, and other application-specific
configuration options.
"""

import os
from typing import List, Optional

from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    """Application settings with Pydantic settings management."""
    
    # Application
    app_name: str = "Hydraulic Network Calculator API"
    debug: bool = False
    version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Security
    allowed_hosts: List[str] = ["*"]
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Database
    database_url: str = "sqlite:///./hydraulic_calculator.db"
    database_echo: bool = False
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = [".yaml", ".yml", ".json"]
    
    # Calculation
    calculation_timeout: int = 300  # 5 minutes
    max_concurrent_calculations: int = 10
    
    # Logging
    log_level: str = "INFO"
    log_file: Optional[str] = None
    
    # Static Files
    static_files_dir: Optional[str] = None
    
    # Network Hydraulic Library
    network_hydraulic_path: str = "../src"
    
    @validator("cors_origins", pre=True)
    def validate_cors_origins(cls, v):
        """Validate CORS origins."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("allowed_hosts", pre=True)
    def validate_allowed_hosts(cls, v):
        """Validate allowed hosts."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        env_prefix = "HYDRAULIC_"
        
        # Custom validators
        validators = {
            "cors_origins": validate_cors_origins,
            "allowed_hosts": validate_allowed_hosts,
        }


# Create settings instance
settings = Settings()

# Ensure upload directory exists
if not os.path.exists(settings.upload_dir):
    os.makedirs(settings.upload_dir, exist_ok=True)