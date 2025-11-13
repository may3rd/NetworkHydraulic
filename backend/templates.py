"""Configuration templates for common hydraulic network scenarios.

This module provides sample configurations for various hydraulic network
scenarios including liquid and gas systems, different pipe configurations,
and common industrial applications.
"""

from typing import Any, Dict, List


def get_liquid_system_template() -> Dict[str, Any]:
    """Get a template for liquid (water) system calculations.
    
    Returns:
        Configuration dictionary for liquid system
    """
    return {
        "network": {
            "name": "Liquid System Example",
            "description": "Example liquid (water) system with multiple pipe sections",
            "direction": "forward",
            "boundary_pressure": {
                "value": 200.0,
                "unit": "kPag"
            },
            "design_margin": 10.0,
            "mass_flow_rate": {
                "value": 1000.0,
                "unit": "kg/h"
            },
            "output_units": {
                "pressure": "kPag",
                "pressure_drop": "kPa",
                "temperature": "degC",
                "density": "kg/m^3",
                "velocity": "m/s",
                "volumetric_flow_rate": "m^3/h",
                "mass_flow_rate": "kg/h"
            },
            "fluid": {
                "name": "Water",
                "phase": "liquid",
                "temperature": {
                    "value": 25.0,
                    "unit": "degC"
                },
                "pressure": {
                    "value": 200.0,
                    "unit": "kPag"
                },
                "density": {
                    "value": 998.0,
                    "unit": "kg/m^3"
                },
                "viscosity": {
                    "value": 1.002,
                    "unit": "cP"
                }
            },
            "sections": [
                {
                    "id": "inlet",
                    "description": "Inlet pipe section",
                    "schedule": "40",
                    "pipe_NPD": 4.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 10.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 0.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "pipe_entrance_normal", "count": 1},
                        {"type": "elbow_90", "count": 2}
                    ]
                },
                {
                    "id": "main_line",
                    "description": "Main pipeline section",
                    "schedule": "40",
                    "pipe_NPD": 4.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 50.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 5.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 3},
                        {"type": "tee_through", "count": 1}
                    ]
                },
                {
                    "id": "outlet",
                    "description": "Outlet pipe section",
                    "schedule": "40",
                    "pipe_NPD": 4.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 15.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 2.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 2},
                        {"type": "pipe_exit", "count": 1}
                    ]
                }
            ]
        }
    }


def get_gas_system_template() -> Dict[str, Any]:
    """Get a template for gas (natural gas) system calculations.
    
    Returns:
        Configuration dictionary for gas system
    """
    return {
        "network": {
            "name": "Gas System Example",
            "description": "Example gas (natural gas) system with isothermal flow",
            "direction": "forward",
            "boundary_pressure": {
                "value": 500.0,
                "unit": "psig"
            },
            "gas_flow_model": "isothermal",
            "design_margin": 5.0,
            "volumetric_flow_rate": {
                "value": 1000.0,
                "unit": "scfh"
            },
            "output_units": {
                "pressure": "psig",
                "pressure_drop": "psi",
                "temperature": "degF",
                "density": "lb/ft^3",
                "velocity": "ft/s",
                "volumetric_flow_rate": "scfh",
                "mass_flow_rate": "lb/h"
            },
            "fluid": {
                "name": "Natural Gas",
                "phase": "gas",
                "temperature": {
                    "value": 60.0,
                    "unit": "degF"
                },
                "pressure": {
                    "value": 500.0,
                    "unit": "psig"
                },
                "molecular_weight": {
                    "value": 18.0,
                    "unit": "lb/lbmol"
                },
                "z_factor": 0.95,
                "specific_heat_ratio": 1.30,
                "viscosity": {
                    "value": 0.012,
                    "unit": "cP"
                }
            },
            "sections": [
                {
                    "id": "compressor_discharge",
                    "description": "Compressor discharge line",
                    "schedule": "40",
                    "pipe_NPD": 6.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 20.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 0.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 4},
                        {"type": "check_valve_swing", "count": 1}
                    ]
                },
                {
                    "id": "distribution_line",
                    "description": "Main distribution line",
                    "schedule": "40",
                    "pipe_NPD": 6.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 100.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 10.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 6},
                        {"type": "tee_through", "count": 2}
                    ]
                },
                {
                    "id": "delivery_line",
                    "description": "Final delivery line",
                    "schedule": "40",
                    "pipe_NPD": 4.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 30.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 5.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 3},
                        {"type": "control_valve", "count": 1},
                        {"type": "pipe_exit", "count": 1}
                    ],
                    "control_valve": {
                        "tag": "CV-101",
                        "cv": 250.0,
                        "FL": 0.9,
                        "xT": 0.70
                    }
                }
            ]
        }
    }


def get_vapor_system_template() -> Dict[str, Any]:
    """Get a template for vapor (steam) system calculations.
    
    Returns:
        Configuration dictionary for vapor system
    """
    return {
        "network": {
            "name": "Steam System Example",
            "description": "Example steam system with adiabatic flow",
            "direction": "forward",
            "boundary_pressure": {
                "value": 150.0,
                "unit": "psig"
            },
            "gas_flow_model": "adiabatic",
            "design_margin": 15.0,
            "mass_flow_rate": {
                "value": 5000.0,
                "unit": "lb/h"
            },
            "output_units": {
                "pressure": "psig",
                "pressure_drop": "psi",
                "temperature": "degF",
                "density": "lb/ft^3",
                "velocity": "ft/s",
                "volumetric_flow_rate": "acfh",
                "mass_flow_rate": "lb/h"
            },
            "fluid": {
                "name": "Steam",
                "phase": "vapor",
                "temperature": {
                    "value": 366.0,
                    "unit": "degF"
                },
                "pressure": {
                    "value": 150.0,
                    "unit": "psig"
                },
                "molecular_weight": {
                    "value": 18.02,
                    "unit": "lb/lbmol"
                },
                "z_factor": 1.0,
                "specific_heat_ratio": 1.33,
                "viscosity": {
                    "value": 0.013,
                    "unit": "cP"
                }
            },
            "sections": [
                {
                    "id": "steam_line",
                    "description": "Main steam header",
                    "schedule": "40",
                    "pipe_NPD": 8.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 50.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 0.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 5},
                        {"type": "tee_through", "count": 1}
                    ]
                },
                {
                    "id": "branch_line",
                    "description": "Branch line to equipment",
                    "schedule": "40",
                    "pipe_NPD": 4.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 25.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 8.0,
                        "unit": "m"
                    },
                    "erosional_constant": 100,
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 4},
                        {"type": "block_valve_full_line_size", "count": 1}
                    ],
                    "user_specified_fixed_loss": {
                        "value": 2.0,
                        "unit": "psi"
                    }
                }
            ]
        }
    }


def get_simple_liquid_template() -> Dict[str, Any]:
    """Get a simple liquid system template for testing.
    
    Returns:
        Simple configuration dictionary
    """
    return {
        "network": {
            "name": "Simple Liquid Test",
            "description": "Simple liquid system for testing",
            "direction": "forward",
            "boundary_pressure": {
                "value": 101.325,
                "unit": "kPa"
            },
            "mass_flow_rate": {
                "value": 100.0,
                "unit": "kg/h"
            },
            "fluid": {
                "name": "Water",
                "phase": "liquid",
                "temperature": {
                    "value": 20.0,
                    "unit": "degC"
                },
                "pressure": {
                    "value": 101.325,
                    "unit": "kPa"
                },
                "density": {
                    "value": 998.0,
                    "unit": "kg/m^3"
                },
                "viscosity": {
                    "value": 1.0,
                    "unit": "cP"
                }
            },
            "sections": [
                {
                    "id": "test_section",
                    "description": "Single test section",
                    "schedule": "40",
                    "pipe_NPD": 2.0,
                    "roughness": 4.57e-5,
                    "length": {
                        "value": 10.0,
                        "unit": "m"
                    },
                    "elevation_change": {
                        "value": 0.0,
                        "unit": "m"
                    },
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 2}
                    ]
                }
            ]
        }
    }


def get_fitting_library_data() -> List[Dict[str, Any]]:
    """Get standard fitting library data with K-factors.
    
    Returns:
        List of fitting property dictionaries
    """
    return [
        {
            "type": "elbow_90",
            "description": "90-degree standard elbow",
            "typical_k_factor": "0.75-1.2",
            "manufacturer_data": {
                "standard": 0.9,
                "long_radius": 0.5,
                "short_radius": 1.2
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "elbow_45",
            "description": "45-degree standard elbow",
            "typical_k_factor": "0.3-0.5",
            "manufacturer_data": {
                "standard": 0.4,
                "long_radius": 0.2,
                "short_radius": 0.5
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "u_bend",
            "description": "U-bend or return bend",
            "typical_k_factor": "1.5-2.5",
            "manufacturer_data": {
                "standard": 2.0
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "tee_elbow",
            "description": "Tee with elbow (branch flow)",
            "typical_k_factor": "1.0-2.0",
            "manufacturer_data": {
                "run_through": 0.4,
                "branch_flow": 1.5
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "tee_through",
            "description": "Tee with straight run (through flow)",
            "typical_k_factor": "0.2-0.6",
            "manufacturer_data": {
                "run_through": 0.4,
                "branch_flow": 1.5
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "block_valve_full_line_size",
            "description": "Block valve (full line size)",
            "typical_k_factor": "0.5-1.0",
            "manufacturer_data": {
                "ball_valve": 0.5,
                "gate_valve": 0.2,
                "globe_valve": 3.0
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "block_valve_reduced_trim_0.9d",
            "description": "Block valve (reduced trim, 90% diameter)",
            "typical_k_factor": "1.0-2.0",
            "manufacturer_data": {
                "reduced_90": 1.5
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "block_valve_reduced_trim_0.8d",
            "description": "Block valve (reduced trim, 80% diameter)",
            "typical_k_factor": "2.0-4.0",
            "manufacturer_data": {
                "reduced_80": 3.0
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "globe_valve",
            "description": "Globe valve",
            "typical_k_factor": "6.0-10.0",
            "manufacturer_data": {
                "standard": 8.0,
                "high_performance": 4.0
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "diaphragm_valve",
            "description": "Diaphragm valve",
            "typical_k_factor": "2.0-5.0",
            "manufacturer_data": {
                "standard": 3.5
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "butterfly_valve",
            "description": "Butterfly valve",
            "typical_k_factor": "0.5-1.5",
            "manufacturer_data": {
                "standard": 1.0,
                "high_performance": 0.5
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "check_valve_swing",
            "description": "Swing check valve",
            "typical_k_factor": "2.0-5.0",
            "manufacturer_data": {
                "standard": 3.5
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "lift_check_valve",
            "description": "Lift check valve",
            "typical_k_factor": "3.0-6.0",
            "manufacturer_data": {
                "standard": 4.5
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "tilting_check_valve",
            "description": "Tilting disc check valve",
            "typical_k_factor": "1.0-2.0",
            "manufacturer_data": {
                "standard": 1.5
            },
            "reference": "Manufacturer data sheets"
        },
        {
            "type": "pipe_entrance_normal",
            "description": "Pipe entrance (sharp edge)",
            "typical_k_factor": "0.5",
            "manufacturer_data": {
                "sharp_edge": 0.5,
                "rounded": 0.04
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "pipe_entrance_raise",
            "description": "Raised pipe entrance",
            "typical_k_factor": "0.2-0.5",
            "manufacturer_data": {
                "standard": 0.35
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "pipe_exit",
            "description": "Pipe exit (discharge)",
            "typical_k_factor": "1.0",
            "manufacturer_data": {
                "standard": 1.0
            },
            "reference": "Crane Technical Paper No. 410"
        },
        {
            "type": "inlet_swage",
            "description": "Inlet swage (diameter transition)",
            "typical_k_factor": "0.1-0.5",
            "manufacturer_data": {
                "concentric": 0.2,
                "eccentric": 0.3
            },
            "reference": "Process piping design standards"
        },
        {
            "type": "outlet_swage",
            "description": "Outlet swage (diameter transition)",
            "typical_k_factor": "0.1-0.5",
            "manufacturer_data": {
                "concentric": 0.2,
                "eccentric": 0.3
            },
            "reference": "Process piping design standards"
        }
    ]


def get_template_categories() -> List[Dict[str, str]]:
    """Get available template categories.
    
    Returns:
        List of category dictionaries
    """
    return [
        {
            "id": "liquid",
            "name": "Liquid Systems",
            "description": "Templates for liquid flow calculations including water, oil, and other liquids"
        },
        {
            "id": "gas",
            "name": "Gas Systems",
            "description": "Templates for gas flow calculations including natural gas, air, and other gases"
        },
        {
            "id": "vapor",
            "name": "Vapor Systems",
            "description": "Templates for vapor/steam flow calculations"
        },
        {
            "id": "simple",
            "name": "Simple Examples",
            "description": "Basic templates for learning and testing"
        },
        {
            "id": "industrial",
            "name": "Industrial Applications",
            "description": "Templates for common industrial applications"
        }
    ]


# Template registry
TEMPLATES = {
    "liquid_system": {
        "name": "Liquid System Example",
        "description": "Complete liquid system with multiple sections",
        "category": "liquid",
        "config": get_liquid_system_template()
    },
    "gas_system": {
        "name": "Gas System Example",
        "description": "Complete gas system with control valve",
        "category": "gas",
        "config": get_gas_system_template()
    },
    "vapor_system": {
        "name": "Steam System Example",
        "description": "Steam system with adiabatic flow",
        "category": "vapor",
        "config": get_vapor_system_template()
    },
    "simple_liquid": {
        "name": "Simple Liquid Test",
        "description": "Simple liquid system for testing",
        "category": "simple",
        "config": get_simple_liquid_template()
    }
}


def get_template(template_id: str) -> Dict[str, Any]:
    """Get a specific template by ID.
    
    Args:
        template_id: Template identifier
        
    Returns:
        Template configuration dictionary
        
    Raises:
        ValueError: If template not found
    """
    if template_id not in TEMPLATES:
        available_templates = list(TEMPLATES.keys())
        raise ValueError(f"Template '{template_id}' not found. Available templates: {available_templates}")
    
    return TEMPLATES[template_id]["config"]


def list_templates() -> List[Dict[str, Any]]:
    """List all available templates.
    
    Returns:
        List of template metadata
    """
    return [
        {
            "id": template_id,
            "name": template_data["name"],
            "description": template_data["description"],
            "category": template_data["category"]
        }
        for template_id, template_data in TEMPLATES.items()
    ]


def list_templates_by_category(category: str) -> List[Dict[str, Any]]:
    """List templates filtered by category.
    
    Args:
        category: Template category
        
    Returns:
        List of template metadata for the category
    """
    return [
        {
            "id": template_id,
            "name": template_data["name"],
            "description": template_data["description"],
            "category": template_data["category"]
        }
        for template_id, template_data in TEMPLATES.items()
        if template_data["category"] == category
    ]