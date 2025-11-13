"""Simple FastAPI backend for Hydraulic Network Calculator.

This is a simplified version that demonstrates the core API functionality
without complex dependencies.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Create FastAPI app
app = FastAPI(
    title="Hydraulic Network Calculator API (Simple)",
    description="Simplified API for hydraulic network analysis",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo
calculations = {}
templates = {}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Hydraulic Network Calculator API (Simple)",
        "version": "1.0.0",
        "description": "Simplified API for hydraulic network analysis",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "demo_mode": True,
    }


# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "demo_mode": True,
    }


# Configuration validation endpoint
@app.post("/api/calculate/validate")
async def validate_configuration(request: Dict):
    """Validate configuration without running calculation."""
    try:
        # Extract config from request body (frontend sends {config: {...}})
        config = request.get("config", request)
        
        # Basic validation
        required_fields = ["network", "fluid", "sections"]
        for field in required_fields:
            if field not in config:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )
        
        # Check fluid properties
        fluid = config.get("fluid", {})
        if not fluid.get("phase") in ["liquid", "gas", "vapor"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid fluid phase. Must be: liquid, gas, or vapor"
            )
        
        # Check network properties
        network = config.get("network", {})
        if not network.get("direction") in ["auto", "forward", "backward"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid flow direction. Must be: auto, forward, or backward"
            )
        
        return {
            "success": True,
            "message": "Configuration is valid",
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Validation error: {str(e)}"
        )


# Calculation endpoint
@app.post("/api/calculate")
async def calculate_hydraulics(config: Dict):
    """Execute hydraulic calculation (demo version)."""
    try:
        # Validate configuration first
        await validate_configuration(config)
        
        # Generate calculation ID
        calculation_id = str(uuid.uuid4())
        
        # Create mock results
        mock_results = {
            "success": True,
            "network": {
                "name": config.get("network", {}).get("name", "Demo Network"),
                "direction": config.get("network", {}).get("direction", "auto"),
                "fluid": config.get("fluid", {}),
                "total_sections": len(config.get("sections", [])),
            },
            "summary": {
                "inlet": {
                    "pressure": 101.0,
                    "temperature": 25.0,
                    "density": 997.0,
                    "velocity": 1.0,
                },
                "outlet": {
                    "pressure": 95.0,
                    "temperature": 25.0,
                    "density": 997.0,
                    "velocity": 2.5,
                },
                "pressure_drop": 6.0,
                "max_velocity": 3.2,
                "critical_conditions": [],
            },
            "sections": [
                {
                    "id": f"section_{i+1}",
                    "inlet_pressure": 101.0 - i * 1.5,
                    "outlet_pressure": 101.0 - (i + 1) * 1.5,
                    "pressure_drop": 1.5,
                    "velocity": 1.0 + i * 0.5,
                    "reynolds_number": 50000 + i * 10000,
                    "friction_factor": 0.02,
                    "remarks": "Normal operating conditions",
                }
                for i in range(len(config.get("sections", [])))
            ],
            "warnings": [],
            "execution_time": 0.15,
            "metadata": {
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat(),
                "solver": "network-hydraulic (demo)",
            },
        }
        
        # Store calculation
        calculations[calculation_id] = {
            "id": calculation_id,
            "config": config,
            "results": mock_results,
            "status": "completed",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        return {
            "success": True,
            "calculation_id": calculation_id,
            "result": mock_results,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Calculation error: {str(e)}"
        )


# Get calculation results
@app.get("/api/results/{calculation_id}")
async def get_calculation_results(calculation_id: str):
    """Get calculation results by ID."""
    if calculation_id not in calculations:
        raise HTTPException(
            status_code=404,
            detail="Calculation not found"
        )
    
    return {
        "success": True,
        "calculation": calculations[calculation_id],
        "timestamp": datetime.utcnow().isoformat(),
    }


# List calculation history
@app.get("/api/history")
async def get_calculation_history():
    """Get calculation history."""
    return {
        "success": True,
        "calculations": list(calculations.values()),
        "total": len(calculations),
        "timestamp": datetime.utcnow().isoformat(),
    }


# Get configuration templates
@app.get("/api/templates")
async def get_configuration_templates():
    """Get sample configuration templates."""
    sample_templates = [
        {
            "id": "liquid_pipeline",
            "name": "Basic Liquid Pipeline",
            "description": "Simple liquid transport system",
            "category": "liquid",
            "configuration": {
                "network": {
                    "name": "Liquid Pipeline System",
                    "direction": "forward",
                    "boundary_pressure": 200000,
                },
                "fluid": {
                    "name": "Water",
                    "phase": "liquid",
                    "temperature": 298.15,
                    "pressure": 200000,
                    "density": 997.0,
                    "viscosity": 0.001,
                },
                "sections": [
                    {
                        "id": "pipe_1",
                        "pipe_diameter": 0.1,
                        "length": 100.0,
                        "roughness": 0.000046,
                        "fittings": [],
                    }
                ],
            },
        },
        {
            "id": "gas_transmission",
            "name": "Gas Transmission Pipeline",
            "description": "High-pressure gas transmission system",
            "category": "gas",
            "configuration": {
                "network": {
                    "name": "Gas Transmission System",
                    "direction": "forward",
                    "gas_flow_model": "isothermal",
                },
                "fluid": {
                    "name": "Natural Gas",
                    "phase": "gas",
                    "temperature": 288.15,
                    "pressure": 7000000,
                    "molecular_weight": 18.0,
                    "z_factor": 0.95,
                    "viscosity": 0.000011,
                },
                "sections": [
                    {
                        "id": "pipe_1",
                        "pipe_diameter": 0.3,
                        "length": 5000.0,
                        "roughness": 0.000046,
                        "fittings": [
                            {
                                "type": "LR",
                                "k_factor": 0.5,
                            }
                        ],
                    }
                ],
            },
        },
    ]
    
    return {
        "success": True,
        "templates": sample_templates,
        "total": len(sample_templates),
        "timestamp": datetime.utcnow().isoformat(),
    }


# File upload endpoint
@app.post("/api/upload-config")
async def upload_configuration_file(file: UploadFile = File(...)):
    """Upload configuration file (YAML or JSON)."""
    try:
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Parse based on file extension
        if file.filename.endswith('.json'):
            config = json.loads(content_str)
        elif file.filename.endswith('.yaml') or file.filename.endswith('.yml'):
            # For demo, treat YAML as JSON
            config = json.loads(content_str)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload JSON or YAML files."
            )
        
        # Validate the configuration
        await validate_configuration(config)
        
        return {
            "success": True,
            "message": "Configuration file uploaded successfully",
            "filename": file.filename,
            "config": config,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload error: {str(e)}"
        )


# Get fitting properties
@app.get("/api/fittings/{fitting_type}")
async def get_fitting_properties(fitting_type: str):
    """Get fitting properties and K-factors."""
    # Demo fitting data
    fitting_data = {
        "LR": {
            "description": "Long Radius 90° Elbow",
            "typical_k_factor": "0.5-0.7",
            "reference": "Crane Technical Paper 410",
        },
        "SR": {
            "description": "Short Radius 90° Elbow",
            "typical_k_factor": "0.9-1.2",
            "reference": "Crane Technical Paper 410",
        },
        "TEE": {
            "description": "Standard Tee",
            "typical_k_factor": "1.5-2.0",
            "reference": "Crane Technical Paper 410",
        },
        "GATE_VALVE": {
            "description": "Gate Valve (fully open)",
            "typical_k_factor": "0.15-0.25",
            "reference": "Crane Technical Paper 410",
        },
    }
    
    if fitting_type not in fitting_data:
        raise HTTPException(
            status_code=404,
            detail=f"Fitting type '{fitting_type}' not found"
        )
    
    return {
        "success": True,
        "fitting_type": fitting_type,
        "properties": fitting_data[fitting_type],
        "timestamp": datetime.utcnow().isoformat(),
    }


# Get system status
@app.get("/api/system/status")
async def get_system_status():
    """Get system status and health information."""
    return {
        "success": True,
        "status": {
            "healthy": True,
            "activeTasks": len([calc for calc in calculations.values() if calc["status"] == "running"]),
            "queueLength": 0,
            "version": "1.0.0",
            "uptime": 3600,  # 1 hour
            "api_version": "1.0.0",
            "database_connected": True,
            "cache_status": "healthy",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "simple_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )