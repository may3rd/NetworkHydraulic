"""Fluid properties."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

GAS_CONSTANT = 8.314462618  # J/(mol*K)


@dataclass(slots=True)
class Fluid:
    name: Optional[str]
    mass_flow_rate: Optional[float]
    volumetric_flow_rate: Optional[float]
    phase: str
    temperature: float
    pressure: float
    density: float
    molecular_weight: float
    z_factor: float
    specific_heat_ratio: float
    viscosity: float
    standard_flow_rate: Optional[float]
    vapor_pressure: Optional[float] = None
    critical_pressure: Optional[float] = None

    def ensure_valid(self) -> None:
        if not self._has_mass_flow() and not self._has_volumetric_flow():
            raise ValueError("Either mass_flow_rate or volumetric_flow_rate must be provided")

    def phase_key(self) -> str:
        return self.phase.lower().strip()

    def is_liquid(self) -> bool:
        return self.phase_key() == "liquid"

    def is_gas(self) -> bool:
        return self.phase_key() in {"gas", "vapor"}

    def current_mass_flow_rate(self) -> float:
        if self._has_mass_flow():
            return self.mass_flow_rate or 0.0
        if self._has_volumetric_flow():
            density = self.current_density()
            return (self.volumetric_flow_rate or 0.0) * density
        raise ValueError("Unable to determine mass flow rate for fluid")

    def current_volumetric_flow_rate(self) -> float:
        if self._has_volumetric_flow():
            return self.volumetric_flow_rate or 0.0
        if self._has_mass_flow():
            density = self.current_density()
            return (self.mass_flow_rate or 0.0) / density
        raise ValueError("Unable to determine volumetric flow rate for fluid")

    def current_density(self) -> float:
        if self.is_gas():
            return self._gas_density()
        return self._require_positive(self.density, "density")

    def _gas_density(self) -> float:
        pressure = self._require_positive(self.pressure, "pressure")
        temperature = self._require_positive(self.temperature, "temperature")
        molecular_weight = self._require_positive(self.molecular_weight, "molecular_weight")
        z_factor = self._require_positive(self.z_factor or 1.0, "z_factor")
        mw_kg_per_mol = molecular_weight if molecular_weight <= 0.5 else molecular_weight / 1000.0
        return pressure * mw_kg_per_mol / (GAS_CONSTANT * temperature * z_factor)

    def _has_mass_flow(self) -> bool:
        return self.mass_flow_rate is not None and self.mass_flow_rate > 0

    def _has_volumetric_flow(self) -> bool:
        return self.volumetric_flow_rate is not None and self.volumetric_flow_rate > 0

    @staticmethod
    def _require_positive(value: Optional[float], name: str) -> float:
        if value is None or value <= 0:
            raise ValueError(f"{name} must be positive to determine flow parameters")
        return value
