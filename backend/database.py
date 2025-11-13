"""Database models and configuration for the Hydraulic Network Calculator API.

This module provides SQLAlchemy models for storing calculations, results,
and user sessions, along with database initialization and session management.
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, Column, DateTime, JSON, String, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func

from backend.config import settings

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(settings.database_url, echo=settings.database_echo)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class CalculationModel(Base):
    """Database model for storing calculation metadata."""
    
    __tablename__ = "calculations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    user_id = Column(String, nullable=True, index=True)  # For future user management
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Configuration storage
    configuration = Column(JSON, nullable=False)
    
    # Results storage
    results = Column(JSON, nullable=True)
    
    # Calculation metadata
    execution_time = Column(String, nullable=True)
    version = Column(String, nullable=True)
    
    # Flags
    has_results = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False, index=True)


class CalculationResultModel(Base):
    """Database model for storing detailed calculation results."""
    
    __tablename__ = "calculation_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    calculation_id = Column(String, nullable=False, index=True)
    section_id = Column(String, nullable=True)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TemplateModel(Base):
    """Database model for storing configuration templates."""
    
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, index=True)
    tags = Column(JSON, nullable=True)  # List of tags
    configuration = Column(JSON, nullable=False)
    is_public = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String, nullable=True)


class FittingLibraryModel(Base):
    """Database model for storing fitting properties and K-factors."""
    
    __tablename__ = "fitting_library"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    typical_k_factor = Column(String, nullable=True)  # Can store ranges like "0.5-1.2"
    manufacturer_data = Column(JSON, nullable=True)  # Manufacturer-specific data
    reference = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserSessionModel(Base):
    """Database model for storing user sessions (for future auth implementation)."""
    
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), onupdate=func.now())


# Database utility functions
def init_db():
    """Initialize the database by creating all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger = __import__('logging').getLogger(__name__)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger = __import__('logging').getLogger(__name__)
        logger.error(f"Failed to initialize database: {e}")
        raise


def get_db():
    """Get database session dependency for FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_calculation(
    name: str,
    configuration: Dict[str, Any],
    description: Optional[str] = None,
    user_id: Optional[str] = None,
) -> str:
    """Save a new calculation to the database.
    
    Args:
        name: Calculation name
        configuration: Configuration dictionary
        description: Optional description
        user_id: Optional user ID
        
    Returns:
        Calculation ID
    """
    from sqlalchemy.orm import Session
    
    calculation_id = str(uuid.uuid4())
    
    db = SessionLocal()
    try:
        calculation = CalculationModel(
            id=calculation_id,
            name=name,
            description=description,
            user_id=user_id,
            configuration=configuration,
            status="pending",
        )
        db.add(calculationsion)
        db.commit()
        return calculation_id
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def update_calculation_status(
    calculation_id: str,
    status: str,
    results: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None,
    execution_time: Optional[float] = None,
) -> bool:
    """Update calculation status and results.
    
    Args:
        calculation_id: Calculation ID
        status: New status
        results: Optional results data
        error_message: Optional error message
        execution_time: Optional execution time
        
    Returns:
        True if successful, False otherwise
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        calculation = db.query(CalculationModel).filter(
            CalculationModel.id == calculation_id,
            CalculationModel.is_deleted == False
        ).first()
        
        if not calculation:
            return False
        
        calculation.status = status
        calculation.updated_at = datetime.utcnow()
        
        if status == "completed" and results:
            calculation.results = results
            calculation.has_results = True
            calculation.completed_at = datetime.utcnow()
            calculation.execution_time = f"{execution_time:.2f}s" if execution_time else None
        elif status == "failed" and error_message:
            calculation.error_message = error_message
            calculation.completed_at = datetime.utcnow()
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_calculation(calculation_id: str) -> Optional[CalculationModel]:
    """Get calculation by ID.
    
    Args:
        calculation_id: Calculation ID
        
    Returns:
        Calculation model or None if not found
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        calculation = db.query(CalculationModel).filter(
            CalculationModel.id == calculation_id,
            CalculationModel.is_deleted == False
        ).first()
        return calculation
    finally:
        db.close()


def list_calculations(
    user_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list:
    """List calculations with optional user filtering.
    
    Args:
        user_id: Optional user ID to filter by
        limit: Maximum number of results
        offset: Offset for pagination
        
    Returns:
        List of calculation models
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        query = db.query(CalculationModel).filter(
            CalculationModel.is_deleted == False
        )
        
        if user_id:
            query = query.filter(CalculationModel.user_id == user_id)
        
        query = query.order_by(CalculationModel.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        return query.all()
    finally:
        db.close()


def delete_calculation(calculation_id: str, user_id: Optional[str] = None) -> bool:
    """Mark calculation as deleted (soft delete).
    
    Args:
        calculation_id: Calculation ID
        user_id: Optional user ID for permission checking
        
    Returns:
        True if successful, False if not found
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        query = db.query(CalculationModel).filter(
            CalculationModel.id == calculation_id,
            CalculationModel.is_deleted == False
        )
        
        if user_id:
            query = query.filter(CalculationModel.user_id == user_id)
        
        calculation = query.first()
        if not calculation:
            return False
        
        calculation.is_deleted = True
        calculation.updated_at = datetime.utcnow()
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def save_template(
    name: str,
    configuration: Dict[str, Any],
    description: Optional[str] = None,
    category: str = "general",
    is_public: bool = True,
    created_by: Optional[str] = None,
) -> str:
    """Save a new template to the database.
    
    Args:
        name: Template name
        configuration: Template configuration
        description: Optional description
        category: Template category
        is_public: Whether template is public
        created_by: Optional creator ID
        
    Returns:
        Template ID
    """
    from sqlalchemy.orm import Session
    
    template_id = str(uuid.uuid4())
    
    db = SessionLocal()
    try:
        template = TemplateModel(
            id=template_id,
            name=name,
            description=description,
            category=category,
            configuration=configuration,
            is_public=is_public,
            created_by=created_by,
        )
        db.add(template)
        db.commit()
        return template_id
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def list_templates(
    category: Optional[str] = None,
    is_public: bool = True,
    limit: int = 100,
) -> list:
    """List templates with optional filtering.
    
    Args:
        category: Optional category filter
        is_public: Whether to include public templates
        limit: Maximum number of results
        
    Returns:
        List of template models
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        query = db.query(TemplateModel).filter(
            TemplateModel.is_public == is_public
        )
        
        if category:
            query = query.filter(TemplateModel.category == category)
        
        query = query.order_by(TemplateModel.created_at.desc())
        query = query.limit(limit)
        
        return query.all()
    finally:
        db.close()


def get_template(template_id: str) -> Optional[TemplateModel]:
    """Get template by ID.
    
    Args:
        template_id: Template ID
        
    Returns:
        Template model or None if not found
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        template = db.query(TemplateModel).filter(
            TemplateModel.id == template_id,
            TemplateModel.is_public == True
        ).first()
        return template
    finally:
        db.close()


def save_fitting_properties(
    fitting_type: str,
    description: str,
    typical_k_factor: str,
    manufacturer_data: Optional[Dict[str, Any]] = None,
    reference: Optional[str] = None,
) -> str:
    """Save fitting properties to the database.
    
    Args:
        fitting_type: Fitting type
        description: Fitting description
        typical_k_factor: Typical K-factor (can include ranges)
        manufacturer_data: Optional manufacturer data
        reference: Optional reference information
        
    Returns:
        Fitting ID
    """
    from sqlalchemy.orm import Session
    
    fitting_id = str(uuid.uuid4())
    
    db = SessionLocal()
    try:
        # Check if fitting already exists
        existing = db.query(FittingLibraryModel).filter(
            FittingLibraryModel.type == fitting_type
        ).first()
        
        if existing:
            # Update existing fitting
            existing.description = description
            existing.typical_k_factor = typical_k_factor
            existing.manufacturer_data = manufacturer_data
            existing.reference = reference
            existing.updated_at = datetime.utcnow()
            db.commit()
            return existing.id
        else:
            # Create new fitting
            fitting = FittingLibraryModel(
                id=fitting_id,
                type=fitting_type,
                description=description,
                typical_k_factor=typical_k_factor,
                manufacturer_data=manufacturer_data,
                reference=reference,
            )
            db.add(fitting)
            db.commit()
            return fitting_id
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_fitting_properties(fitting_type: str) -> Optional[FittingLibraryModel]:
    """Get fitting properties by type.
    
    Args:
        fitting_type: Fitting type
        
    Returns:
        Fitting model or None if not found
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        fitting = db.query(FittingLibraryModel).filter(
            FittingLibraryModel.type == fitting_type
        ).first()
        return fitting
    finally:
        db.close()


def list_fitting_types() -> list:
    """List all available fitting types.
    
    Returns:
        List of fitting types
    """
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    try:
        fittings = db.query(FittingLibraryModel.type).all()
        return [f[0] for f in fittings]
    finally:
        db.close()