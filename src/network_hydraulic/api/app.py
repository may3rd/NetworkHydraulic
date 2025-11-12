"""FastAPI application that exposes network hydraulic calculations."""
from __future__ import annotations

import logging
from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from network_hydraulic.api.schemas import (
    CalculationRequest,
    CalculationResponse,
    CalculationSummaryModel,
    PressurePointModel,
    SectionSummaryModel,
)
from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.models.pipe_section import PipeSection
from network_hydraulic.solver.network_solver import NetworkSolver

logger = logging.getLogger(__name__)

app = FastAPI(title="Network Hydraulic API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.post("/api/calculate", response_model=CalculationResponse)
def calculate(request: CalculationRequest) -> CalculationResponse:
    payload = request.config.strip()
    if not payload:
        raise HTTPException(status_code=400, detail="Configuration payload cannot be empty")

    try:
        loader = ConfigurationLoader.from_string(payload)
        network = loader.build_network()
        solver = NetworkSolver(
            default_pipe_diameter=request.defaultDiameter,
            volumetric_flow_rate=request.flowRate,
        )
        solver.run(network)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc))
    except Exception as exc:  # pragma: no cover - bubble up to client
        logger.exception("Calculation failed")
        raise HTTPException(status_code=500, detail="Unable to complete calculation")

    return _build_response(request.projectName, network)


def _build_response(project_name: str, network) -> CalculationResponse:
    sections = network.sections
    section_payloads = [_section_summary(section, network) for section in sections]
    total_length = sum(section.length or 0.0 for section in sections)
    total_drop = sum(
        section.calculation_output.pressure_drop.total_segment_loss or 0.0
        for section in sections
    )
    peak_flow = _determine_peak_flow(sections, network)
    summary = CalculationSummaryModel(
        totalSections=len(sections),
        totalLength=total_length,
        totalPressureDrop=_pa_to_kpa(total_drop),
        peakFlow=peak_flow,
    )

    return CalculationResponse(
        id=str(uuid4()),
        projectName=project_name or network.name or "network",
        summary=summary,
        sections=section_payloads,
        pressureProfile=_build_pressure_profile(sections, network),
        generatedAt=datetime.utcnow(),
    )


def _section_summary(section: PipeSection, network) -> SectionSummaryModel:
    diameter_m = section.pipe_diameter or section.inlet_diameter or section.outlet_diameter or 0.0
    flow_rate = (
        section.design_volumetric_flow_rate
        or network.volumetric_flow_rate
        or 0.0
    )
    pressure_drop = section.calculation_output.pressure_drop.total_segment_loss or 0.0
    return SectionSummaryModel(
        id=section.id,
        lengthM=section.length or 0.0,
        diameterMm=diameter_m * 1_000,
        flowRate=flow_rate,
        pressureDrop=_pa_to_kpa(pressure_drop),
    )


def _build_pressure_profile(sections: list[PipeSection], network) -> list[PressurePointModel]:
    profile: list[PressurePointModel] = []
    for section in sections:
        inlet = section.result_summary.inlet.pressure
        outlet = section.result_summary.outlet.pressure
        if inlet is not None:
            profile.append(
                PressurePointModel(label=f"{section.id} inlet", pressure=_pa_to_kpa(inlet))
            )
        if outlet is not None:
            profile.append(
                PressurePointModel(label=f"{section.id} outlet", pressure=_pa_to_kpa(outlet))
            )

    final_pressure = network.result_summary.outlet.pressure
    if final_pressure is not None:
        profile.append(
            PressurePointModel(label="Network outlet", pressure=_pa_to_kpa(final_pressure))
        )
    return profile


def _pa_to_kpa(value: float) -> float:
    return float(value / 1_000.0)


def _determine_peak_flow(sections: list[PipeSection], network) -> float:
    flows: list[float] = []
    for section in sections:
        candidate = (
            section.design_volumetric_flow_rate
            or network.volumetric_flow_rate
            or 0.0
        )
        flows.append(candidate)
    if not flows:
        return 0.0
    return max(flows)
