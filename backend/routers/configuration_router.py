"""FastAPI router for configuration endpoints.

This module provides API endpoints for configuration management including
templates, fitting properties, and configuration validation.
"""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from backend.database import (
    get_fitting_properties,
    get_template,
    list_fitting_types,
    list_templates,
    save_fitting_properties,
    save_template,
)
from backend.exceptions import ValidationError
from backend.models import (
    ErrorModel,
    FittingPropertiesModel,
    TemplateModel,
)
from backend.templates import (
    get_fitting_library_data,
    get_template,
    list_templates as get_all_templates,
    list_templates_by_category,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get(
    "/templates",
    summary="Get configuration templates",
    description="Get list of available configuration templates",
)
async def get_templates(
    category: str = Query(None, description="Filter by template category"),
):
    """Get configuration templates.
    
    Args:
        category: Optional category filter
        
    Returns:
        List of available templates
    """
    try:
        if category:
            templates = list_templates_by_category(category)
        else:
            templates = get_all_templates()
        
        return {
            "success": True,
            "data": templates,
            "total": len(templates),
        }
        
    except Exception as e:
        logger.error(f"Error getting templates: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="TEMPLATE_ERROR",
                message="Failed to get templates",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/templates/{template_id}",
    summary="Get template by ID",
    description="Get specific configuration template by ID",
)
async def get_template_by_id(template_id: str):
    """Get template by ID.
    
    Args:
        template_id: Template identifier
        
    Returns:
        Template configuration
        
    Raises:
        HTTPException: If template not found
    """
    try:
        template_config = get_template(template_id)
        
        return {
            "success": True,
            "data": template_config,
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="TEMPLATE_NOT_FOUND",
                message=f"Template '{template_id}' not found",
                details=str(e),
                suggestion="Please check the template ID and try again",
            ).dict(),
        )
    except Exception as e:
        logger.error(f"Error getting template {template_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="TEMPLATE_ERROR",
                message="Failed to get template",
                details=str(e),
            ).dict(),
        )


@router.post(
    "/templates",
    summary="Save custom template",
    description="Save a custom configuration template",
)
async def save_custom_template(
    template_data: Dict[str, Any],
    name: str = Query(..., description="Template name"),
    description: str = Query("", description="Template description"),
    category: str = Query("custom", description="Template category"),
):
    """Save a custom template.
    
    Args:
        template_data: Template configuration data
        name: Template name
        description: Template description
        category: Template category
        
    Returns:
        Save confirmation
        
    Raises:
        HTTPException: For validation errors
    """
    try:
        # Validate template data structure
        if not isinstance(template_data, dict) or "network" not in template_data:
            raise ValidationError(
                "Template must be a dictionary with 'network' key",
                field="template_data",
                suggestion="Please check the template structure",
            )
        
        # Save template to database
        template_id = save_template(
            name=name,
            configuration=template_data,
            description=description,
            category=category,
            is_public=False,  # User templates are private by default
        )
        
        return {
            "success": True,
            "message": f"Template '{name}' saved successfully",
            "template_id": template_id,
        }
        
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=ErrorModel(
                code="VALIDATION_ERROR",
                message="Template validation failed",
                details=str(e),
                field=getattr(e, 'field', None),
                suggestion=getattr(e, 'suggestion', None),
            ).dict(),
        )
    except Exception as e:
        logger.error(f"Error saving template: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="TEMPLATE_ERROR",
                message="Failed to save template",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/fittings",
    summary="Get fitting types",
    description="Get list of available fitting types",
)
async def get_fitting_types():
    """Get available fitting types.
    
    Returns:
        List of fitting types
    """
    try:
        fitting_types = list_fitting_types()
        
        return {
            "success": True,
            "data": fitting_types,
            "total": len(fitting_types),
        }
        
    except Exception as e:
        logger.error(f"Error getting fitting types: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="FITTING_ERROR",
                message="Failed to get fitting types",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/fittings/{fitting_type}",
    summary="Get fitting properties",
    description="Get properties and K-factors for a specific fitting type",
)
async def get_fitting_properties_endpoint(fitting_type: str):
    """Get fitting properties by type.
    
    Args:
        fitting_type: Fitting type
        
    Returns:
        Fitting properties
        
    Raises:
        HTTPException: If fitting type not found
    """
    try:
        # First check database
        fitting = get_fitting_properties(fitting_type)
        
        if fitting:
            return {
                "success": True,
                "data": {
                    "type": fitting.type,
                    "description": fitting.description,
                    "typical_k_factor": fitting.typical_k_factor,
                    "manufacturer_data": fitting.manufacturer_data,
                    "reference": fitting.reference,
                },
            }
        
        # If not in database, check library data
        library_data = get_fitting_library_data()
        for fitting_data in library_data:
            if fitting_data["type"] == fitting_type:
                # Save to database for future use
                save_fitting_properties(
                    fitting_type=fitting_data["type"],
                    description=fitting_data["description"],
                    typical_k_factor=fitting_data["typical_k_factor"],
                    manufacturer_data=fitting_data["manufacturer_data"],
                    reference=fitting_data["reference"],
                )
                
                return {
                    "success": True,
                    "data": fitting_data,
                }
        
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="FITTING_NOT_FOUND",
                message=f"Fitting type '{fitting_type}' not found",
                suggestion="Please check the fitting type and try again",
            ).dict(),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fitting properties for {fitting_type}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="FITTING_ERROR",
                message="Failed to get fitting properties",
                details=str(e),
            ).dict(),
        )


@router.post(
    "/fittings",
    summary="Add fitting properties",
    description="Add new fitting properties to the library",
)
async def add_fitting_properties(
    fitting_type: str = Query(..., description="Fitting type"),
    description: str = Query(..., description="Fitting description"),
    typical_k_factor: str = Query(..., description="Typical K-factor"),
    manufacturer_data: Dict[str, Any] = Query(None, description="Manufacturer data"),
    reference: str = Query(None, description="Reference information"),
):
    """Add new fitting properties.
    
    Args:
        fitting_type: Fitting type
        description: Fitting description
        typical_k_factor: Typical K-factor
        manufacturer_data: Optional manufacturer data
        reference: Optional reference
        
    Returns:
        Save confirmation
    """
    try:
        fitting_id = save_fitting_properties(
            fitting_type=fitting_type,
            description=description,
            typical_k_factor=typical_k_factor,
            manufacturer_data=manufacturer_data,
            reference=reference,
        )
        
        return {
            "success": True,
            "message": f"Fitting properties for '{fitting_type}' saved successfully",
            "fitting_id": fitting_id,
        }
        
    except Exception as e:
        logger.error(f"Error saving fitting properties: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="FITTING_ERROR",
                message="Failed to save fitting properties",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/categories",
    summary="Get template categories",
    description="Get list of available template categories",
)
async def get_template_categories():
    """Get template categories.
    
    Returns:
        List of template categories
    """
    from backend.templates import get_template_categories
    
    try:
        categories = get_template_categories()
        
        return {
            "success": True,
            "data": categories,
            "total": len(categories),
        }
        
    except Exception as e:
        logger.error(f"Error getting template categories: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="CATEGORY_ERROR",
                message="Failed to get template categories",
                details=str(e),
            ).dict(),
        )


@router.post(
    "/validate",
    summary="Validate configuration structure",
    description="Validate configuration structure without running calculation",
)
async def validate_config_structure(config_data: Dict[str, Any]):
    """Validate configuration structure.
    
    Args:
        config_data: Configuration data to validate
        
    Returns:
        Validation result
        
    Raises:
        HTTPException: For validation errors
    """
    try:
        # Basic structure validation
        errors = []
        warnings = []
        
        if not isinstance(config_data, dict):
            errors.append("Configuration must be a dictionary")
            return {
                "success": False,
                "errors": errors,
                "warnings": warnings,
                "field_errors": {},
            }
        
        # Check for required sections
        if "network" not in config_data:
            errors.append("Missing 'network' section")
        
        if "fluid" not in config_data.get("network", {}):
            errors.append("Missing 'fluid' configuration in network")
        
        if "sections" not in config_data.get("network", {}):
            errors.append("Missing 'sections' in network")
        elif not isinstance(config_data["network"]["sections"], list):
            errors.append("'sections' must be a list")
        elif len(config_data["network"]["sections"]) == 0:
            warnings.append("No pipe sections defined")
        
        # Check network structure
        network = config_data.get("network", {})
        if "name" not in network:
            warnings.append("Missing network name")
        
        # Check fluid structure
        fluid = network.get("fluid", {})
        required_fluid_fields = ["phase", "temperature", "pressure", "viscosity"]
        for field in required_fluid_fields:
            if field not in fluid:
                errors.append(f"Missing required fluid field: {field}")
        
        # Check section structure
        sections = network.get("sections", [])
        section_errors = []
        for i, section in enumerate(sections):
            if not isinstance(section, dict):
                section_errors.append(f"Section {i+1} must be a dictionary")
                continue
            
            required_section_fields = ["id", "schedule", "roughness", "length"]
            for field in required_section_fields:
                if field not in section:
                    section_errors.append(f"Section {section.get('id', i+1)}: missing required field '{field}'")
        
        if section_errors:
            errors.extend(section_errors)
        
        if errors:
            return {
                "success": False,
                "errors": errors,
                "warnings": warnings,
                "field_errors": {},
            }
        
        return {
            "success": True,
            "errors": [],
            "warnings": warnings,
            "field_errors": {},
        }
        
    except Exception as e:
        logger.error(f"Error validating configuration structure: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="VALIDATION_ERROR",
                message="Configuration validation failed",
                details=str(e),
            ).dict(),
        )