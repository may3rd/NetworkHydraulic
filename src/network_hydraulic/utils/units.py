"""Unit conversion helpers placeholder."""
from __future__ import annotations
from src.unit_converter.unit_converter.converter import converts

def convert(value: float, from_unit: str, to_unit: str) -> float:
    convert_value = converts(f"{value} {from_unit}", to_unit)
    return float(convert_value)
