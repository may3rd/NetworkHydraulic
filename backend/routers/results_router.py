"""FastAPI router for results endpoints.

This module provides API endpoints for accessing and managing calculation results.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_calculation
from backend.exceptions import CalculationNotFoundError
from backend.models import ErrorModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/results", tags=["Results"])


@router.get(
    "/{calculation_id}",
    summary="Get calculation results",
    description="Get detailed results for a specific calculation",
)
async def get_calculation_results(calculation_id: str):
    """Get calculation results by ID.
    
    Args:
        calculation_id: Calculation ID
        
    Returns:
        Calculation results
        
    Raises:
        HTTPException: If calculation not found or results unavailable
    """
    try:
        calculation = get_calculation(calculation_id)
        
        if not calculation:
            raise CalculationNotFoundError(
                calculation_id,
                suggestion="Please check the calculation ID and try again",
            )
        
        if not calculation.has_results:
            raise HTTPException(
                status_code=404,
                detail=ErrorModel(
                    code="RESULTS_NOT_AVAILABLE",
                    message="Results not available for this calculation",
                    details="Calculation may still be running or failed",
                    suggestion="Please check the calculation status first",
                ).dict(),
            )
        
        if calculation.status != "completed":
            raise HTTPException(
                status_code=409,
                detail=ErrorModel(
                    code="CALCULATION_NOT_COMPLETED",
                    message="Calculation not completed",
                    details=f"Current status: {calculation.status}",
                    suggestion="Please wait for calculation to complete",
                ).dict(),
            )
        
        # Parse results from JSON
        results = calculation.results
        if isinstance(results, str):
            import json
            try:
                results = json.loads(results)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON in results for calculation {calculation_id}")
                raise HTTPException(
                    status_code=500,
                    detail=ErrorModel(
                        code="RESULTS_ERROR",
                        message="Results data is corrupted",
                        details="Unable to parse calculation results",
                        suggestion="Please contact support",
                    ).dict(),
                )
        
        return {
            "success": True,
            "data": {
                "calculation_id": calculation.id,
                "name": calculation.name,
                "description": calculation.description,
                "status": calculation.status,
                "created_at": calculation.created_at.isoformat(),
                "completed_at": calculation.completed_at.isoformat() if calculation.completed_at else None,
                "execution_time": calculation.execution_time,
                "results": results,
                "warnings": getattr(results, 'warnings', []) if results else [],
            },
        }
        
    except CalculationNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="CALCULATION_NOT_FOUND",
                message=str(e),
                suggestion=e.suggestion,
            ).dict(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting results for calculation {calculation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="RESULTS_ERROR",
                message="Failed to get calculation results",
                details=str(e),
                suggestion="Please contact support",
            ).dict(),
        )


@router.get(
    "/{calculation_id}/summary",
    summary="Get calculation summary",
    description="Get summary information for a calculation without detailed results",
)
async def get_calculation_summary(calculation_id: str):
    """Get calculation summary by ID.
    
    Args:
        calculation_id: Calculation ID
        
    Returns:
        Calculation summary information
        
    Raises:
        HTTPException: If calculation not found
    """
    try:
        calculation = get_calculation(calculation_id)
        
        if not calculation:
            raise CalculationNotFoundError(
                calculation_id,
                suggestion="Please check the calculation ID and try again",
            )
        
        return {
            "success": True,
            "data": {
                "calculation_id": calculation.id,
                "name": calculation.name,
                "description": calculation.description,
                "status": calculation.status,
                "has_results": calculation.has_results,
                "created_at": calculation.created_at.isoformat(),
                "completed_at": calculation.completed_at.isoformat() if calculation.completed_at else None,
                "execution_time": calculation.execution_time,
                "error_message": calculation.error_message,
            },
        }
        
    except CalculationNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="CALCULATION_NOT_FOUND",
                message=str(e),
                suggestion=e.suggestion,
            ).dict(),
        )
    except Exception as e:
        logger.error(f"Error getting summary for calculation {calculation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="SUMMARY_ERROR",
                message="Failed to get calculation summary",
                details=str(e),
            ).dict(),
        )


@router.get(
    "/{calculation_id}/export/{format}",
    summary="Export calculation results",
    description="Export calculation results in various formats",
)
async def export_calculation_results(
    calculation_id: str,
    format: str = Query(..., description="Export format (json, csv, pdf)"),
):
    """Export calculation results.
    
    Args:
        calculation_id: Calculation ID
        format: Export format
        
    Returns:
        Exported results
        
    Raises:
        HTTPException: If calculation not found or export fails
    """
    try:
        calculation = get_calculation(calculation_id)
        
        if not calculation:
            raise CalculationNotFoundError(
                calculation_id,
                suggestion="Please check the calculation ID and try again",
            )
        
        if not calculation.has_results:
            raise HTTPException(
                status_code=404,
                detail=ErrorModel(
                    code="RESULTS_NOT_AVAILABLE",
                    message="Results not available for export",
                    suggestion="Please run the calculation first",
                ).dict(),
            )
        
        # Parse results
        results = calculation.results
        if isinstance(results, str):
            import json
            results = json.loads(results)
        
        # Generate export based on format
        if format.lower() == "json":
            return {
                "success": True,
                "format": "json",
                "filename": f"calculation_{calculation_id}_results.json",
                "content": results,
                "mime_type": "application/json",
            }
        
        elif format.lower() == "csv":
            # Convert results to CSV format
            csv_content = _convert_results_to_csv(results)
            return {
                "success": True,
                "format": "csv",
                "filename": f"calculation_{calculation_id}_results.csv",
                "content": csv_content,
                "mime_type": "text/csv",
            }
        
        elif format.lower() == "pdf":
            # Generate PDF report (placeholder - would need additional dependencies)
            pdf_content = _generate_pdf_report(results, calculation)
            return {
                "success": True,
                "format": "pdf",
                "filename": f"calculation_{calculation_id}_results.pdf",
                "content": pdf_content,
                "mime_type": "application/pdf",
            }
        
        else:
            raise HTTPException(
                status_code=400,
                detail=ErrorModel(
                    code="INVALID_EXPORT_FORMAT",
                    message=f"Unsupported export format: {format}",
                    suggestion="Supported formats: json, csv, pdf",
                ).dict(),
            )
        
    except CalculationNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="CALCULATION_NOT_FOUND",
                message=str(e),
                suggestion=e.suggestion,
            ).dict(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting results for calculation {calculation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="EXPORT_ERROR",
                message="Failed to export results",
                details=str(e),
                suggestion="Please contact support",
            ).dict(),
        )


def _convert_results_to_csv(results: Dict[str, Any]) -> str:
    """Convert results to CSV format.
    
    Args:
        results: Calculation results
        
    Returns:
        CSV content as string
    """
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Section ID", "Inlet Pressure", "Outlet Pressure", "Pressure Drop", 
                    "Velocity", "Reynolds Number", "Friction Factor"])
    
    # Write section data
    sections = results.get("sections", [])
    for section in sections:
        section_data = section.get("summary", {})
        inlet_pressure = section_data.get("inlet", {}).get("pressure", "")
        outlet_pressure = section_data.get("outlet", {}).get("pressure", "")
        pressure_drop = section.get("calculation", {}).get("pressure_drop", {}).get("total_segment_loss", "")
        velocity = section_data.get("inlet", {}).get("velocity", "")
        
        writer.writerow([
            section.get("section_id", ""),
            inlet_pressure,
            outlet_pressure,
            pressure_drop,
            velocity,
            "",
            "",
        ])
    
    return output.getvalue()


def _generate_pdf_report(results: Dict[str, Any], calculation) -> str:
    """Generate PDF report (placeholder implementation).
    
    Args:
        results: Calculation results
        calculation: Calculation object
        
    Returns:
        PDF content as base64 string
    """
    # This is a placeholder - in a real implementation, you would use
    # a library like ReportLab, WeasyPrint, or similar to generate PDFs
    
    import json
    import base64
    
    # Create a simple text report and encode as base64
    report_data = {
        "calculation_name": calculation.name,
        "calculation_id": calculation.id,
        "created_at": calculation.created_at.isoformat(),
        "summary": results.get("summary", {}),
        "sections_count": len(results.get("sections", [])),
    }
    
    report_text = f"""
HYDRAULIC CALCULATION REPORT
============================

Calculation Name: {report_data["calculation_name"]}
Calculation ID: {report_data["calculation_id"]}
Created: {report_data["created_at"]}

SUMMARY
-------
Total Sections: {report_data["sections_count"]}

Inlet Conditions:
  Pressure: {report_data["summary"].get("inlet", {}).get("pressure", "N/A")}
  Temperature: {report_data["summary"].get("inlet", {}).get("temperature", "N/A")}

Outlet Conditions:
  Pressure: {report_data["summary"].get("outlet", {}).get("pressure", "N/A")}
  Temperature: {report_data["summary"].get("outlet", {}).get("temperature", "N/A")}

Total Pressure Drop: {report_data["summary"].get("pressure_drop", {}).get("total_segment_loss", "N/A")}

SECTIONS
--------
"""
    
    for section in results.get("sections", []):
        section_summary = section.get("summary", {})
        report_text += f"""
Section: {section.get("section_id", "Unknown")}
  Inlet Pressure: {section_summary.get("inlet", {}).get("pressure", "N/A")}
  Outlet Pressure: {section_summary.get("outlet", {}).get("pressure", "N/A")}
  Velocity: {section_summary.get("inlet", {}).get("velocity", "N/A")}
"""
    
    # Encode as base64 (in real implementation, this would be actual PDF bytes)
    return base64.b64encode(report_text.encode()).decode()


@router.get(
    "/{calculation_id}/sections",
    summary="Get section results",
    description="Get detailed results for individual pipe sections",
)
async def get_section_results(
    calculation_id: str,
    section_id: str = Query(None, description="Specific section ID (optional)"),
):
    """Get section results by calculation ID.
    
    Args:
        calculation_id: Calculation ID
        section_id: Optional specific section ID
        
    Returns:
        Section results
        
    Raises:
        HTTPException: If calculation not found or section not found
    """
    try:
        calculation = get_calculation(calculation_id)
        
        if not calculation:
            raise CalculationNotFoundError(
                calculation_id,
                suggestion="Please check the calculation ID and try again",
            )
        
        if not calculation.has_results:
            raise HTTPException(
                status_code=404,
                detail=ErrorModel(
                    code="RESULTS_NOT_AVAILABLE",
                    message="Results not available",
                    suggestion="Please run the calculation first",
                ).dict(),
            )
        
        # Parse results
        results = calculation.results
        if isinstance(results, str):
            import json
            results = json.loads(results)
        
        sections = results.get("sections", [])
        
        if section_id:
            # Find specific section
            target_section = None
            for section in sections:
                if section.get("section_id") == section_id:
                    target_section = section
                    break
            
            if not target_section:
                raise HTTPException(
                    status_code=404,
                    detail=ErrorModel(
                        code="SECTION_NOT_FOUND",
                        message=f"Section '{section_id}' not found",
                        suggestion="Please check the section ID and try again",
                    ).dict(),
                )
            
            return {
                "success": True,
                "data": {
                    "calculation_id": calculation_id,
                    "section_id": section_id,
                    "section_data": target_section,
                },
            }
        else:
            # Return all sections
            return {
                "success": True,
                "data": {
                    "calculation_id": calculation_id,
                    "sections": sections,
                    "total_sections": len(sections),
                },
            }
        
    except CalculationNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=ErrorModel(
                code="CALCULATION_NOT_FOUND",
                message=str(e),
                suggestion=e.suggestion,
            ).dict(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting section results for calculation {calculation_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorModel(
                code="SECTION_RESULTS_ERROR",
                message="Failed to get section results",
                details=str(e),
            ).dict(),
        )