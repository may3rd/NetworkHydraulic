"""Pydantic schemas used by the FastAPI backend."""
from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class CalculationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    projectName: str
    config: str
    defaultDiameter: float | None = None
    flowRate: float | None = None
    debugFittings: bool = False


class SectionSummaryModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    lengthM: float
    diameterMm: float
    flowRate: float
    pressureDrop: float


class PressurePointModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    pressure: float


class CalculationSummaryModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    totalSections: int
    totalLength: float
    totalPressureDrop: float
    peakFlow: float


class CalculationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    projectName: str
    summary: CalculationSummaryModel
    sections: List[SectionSummaryModel]
    pressureProfile: List[PressurePointModel]
    generatedAt: datetime
