"""Auxiliary components such as control valves and orifices."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class ControlValve:
    tag: Optional[str]
    cv: Optional[float]
    cg: Optional[float]
    pressure_drop: Optional[float]
    C1: Optional[float]
    FL: Optional[float] = None
    Fd: Optional[float] = None
    xT: Optional[float] = None
    inlet_diameter: Optional[float] = None
    outlet_diameter: Optional[float] = None
    valve_diameter: Optional[float] = None
    calculation_note: Optional[str] = None


@dataclass(slots=True)
class Orifice:
    tag: Optional[str]
    d_over_D_ratio: Optional[float]
    pressure_drop: Optional[float]
    pipe_diameter: Optional[float] = None
    orifice_diameter: Optional[float] = None
    meter_type: Optional[str] = None
    taps: Optional[str] = None
    tap_position: Optional[str] = None
    discharge_coefficient: Optional[float] = None
    expansibility: Optional[float] = None
    calculation_note: Optional[str] = None
