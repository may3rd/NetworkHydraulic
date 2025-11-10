"""Configuration for report/output units."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Dict


@dataclass(slots=True)
class OutputUnits:
    pressure: str = "Pa"
    pressure_drop: str = "Pa"
    temperature: str = "K"
    density: str = "kg/m^3"
    velocity: str = "m/s"
    volumetric_flow_rate: str = "m^3/s"
    mass_flow_rate: str = "kg/s"
    flow_momentum: str = "Pa"

    def __post_init__(self) -> None:
        self.pressure = self._normalize(self.pressure, "Pa")
        self.pressure_drop = self._normalize(self.pressure_drop or self.pressure, self.pressure)
        self.temperature = self._normalize(self.temperature, "K")
        self.density = self._normalize(self.density, "kg/m^3")
        self.velocity = self._normalize(self.velocity, "m/s")
        self.volumetric_flow_rate = self._normalize(self.volumetric_flow_rate, "m^3/s")
        self.mass_flow_rate = self._normalize(self.mass_flow_rate, "kg/s")
        self.flow_momentum = self._normalize(self.flow_momentum, self.pressure_drop)

    def as_dict(self) -> Dict[str, str]:
        """Return a serializable snapshot of the configured units."""
        return asdict(self)

    @staticmethod
    def _normalize(value: str | None, default: str) -> str:
        text = (value or "").strip()
        return text or default
