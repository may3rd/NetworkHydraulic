"""Application configuration using Pydantic settings management.

This module provides centralized configuration for the FastAPI application
including database settings, CORS origins, and other application-specific
configuration options.
"""

import os
from typing import List, Optional

class Settings:
    """Application settings using simple class approach."""
    
    # Application
    app_name: str = "Hydraulic Network Calculator API"
    debug: bool = False
    version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Security
    allowed_hosts: list = ["*"]
    cors_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Database
    database_url: str = "sqlite:///./hydraulic_calculator.db"
    database_echo: bool = False
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list = [".yaml", ".yml", ".json"]
    
    # Calculation
    calculation_timeout: int = 300  # 5 minutes
    max_concurrent_calculations: int = 10
    
    # Logging
    log_level: str = "INFO"
    log_file: str = None
    
    # Static Files
    static_files_dir: str = None
    
    # Network Hydraulic Library
    network_hydraulic_path: str = "../src"
    
    # Environment-based configuration
    def __init__(self):
        import os
        
        # Override from environment variables
        self.debug = os.getenv("HYDRAULIC_DEBUG", str(self.debug)).lower() == "true"
        self.host = os.getenv("HYDRAULIC_HOST", self.host)
        self.port = int(os.getenv("HYDRAULIC_PORT", str(self.port)))
        
        cors_origins_env = os.getenv("HYDRAULIC_CORS_ORIGINS")
        if cors_origins_env:
            self.cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]
        
        allowed_hosts_env = os.getenv("HYDRAULIC_ALLOWED_HOSTS")
        if allowed_hosts_env:
            self.allowed_hosts = [host.strip() for host in allowed_hosts_env.split(",")]
        
        self.database_url = os.getenv("HYDRAULIC_DATABASE_URL", self.database_url)
        self.upload_dir = os.getenv("HYDRAULIC_UPLOAD_DIR", self.upload_dir)
        self.log_level = os.getenv("HYDRAULIC_LOG_LEVEL", self.log_level)
        self.static_files_dir = os.getenv("HYDRAULIC_STATIC_FILES_DIR", self.static_files_dir)
        
        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)


# Create settings instance
settings = Settings()

