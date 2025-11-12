 # Configuration Reference

 This document describes every supported key in a `network` configuration, lists available fittings/components, and provides example snippets.

 ---

 ## 1. YAML Skeleton

 ```yaml
 network:
   name: my_network
   description: Optional human-readable label
   direction: auto | forward | backward
   boundary_pressure: {value: 101.3, unit: kPag}
   upstream_pressure: {value: …, unit: …}        # optional
   downstream_pressure: {value: …, unit: …}      # optional
   gas_flow_model: isothermal | adiabatic        # required for gas, ignored for liquid
   design_margin: 10.0                           # percent, optional
   output_units:                                 # optional (see §4)
     pressure: kPag
     …
   fluid:                                        # required, §2
     …
   sections:                                     # required, §3
     - …
     - …
 ```

- All numeric fields accept bare SI numbers, `{value, unit}` objects, or strings with units (e.g., `"100 ft"`). Units are converted via `network_hydraulic.utils.units`.
- Unknown keys anywhere in `network` or `sections[]` raise `ValueError`.

### Network Flow Rates

- `mass_flow_rate`, `volumetric_flow_rate`: at least one is required at the network level and defines the base design flow (kg/s or m³/s). When only one is provided the solver derives the other using fluid density.
- `standard_flow_rate`: optional standard volumetric flow (Sm³/s) used for reporting gas/vapor systems.
- Section entries may override these via local `mass_flow_rate` / `volumetric_flow_rate`; unspecified sections inherit the network baseline scaled by `design_margin`.

---

## 2. `fluid` Block

 | Field | Required | Description |
 | --- | --- | --- |
 | `name` | No | Identifier for summaries. |
 | `phase` | **Yes** | `liquid`, `gas`, or `vapor`. Dictates density logic and gas-model requirements. |
 | `temperature` | **Yes** | Absolute temperature; specify units (K, degC, degF). |
 | `pressure` | Yes* | Absolute pressure; can be omitted if `network.boundary_pressure` is provided. |
 | `density` | Required for liquids | kg/m³ in SI or convertible units. |
 | `molecular_weight` | Required for gas/vapor | kg/mol or g/mol. |
 | `z_factor` | Required for gas/vapor | Compressibility factor (dimensionless). |
 | `specific_heat_ratio` | Required for gas/vapor | γ = Cp/Cv. |
 | `viscosity` | **Yes** | Dynamic viscosity (Pa·s). |
 | `vapor_pressure`, `critical_pressure` | Optional; required for liquid valve calcs. |

 ---

 ## 3. Sections

 Each entry in `network.sections` maps to a `PipeSection`. Required keys:

 | Field | Required | Description |
 | --- | --- | --- |
 | `id` | **Yes** | Unique identifier. |
 | `schedule` | **Yes** | Pipe schedule (string). |
 | `pipe_NPD` or `main_ID` | **Yes** | Nominal pipe diameter (inches) or main internal diameter (m). |
 | `roughness` | **Yes** | Absolute roughness (m). |
 | `length` | **Yes** | Straight length (m). Can be `{value, unit}`. |
 | `elevation_change` | No (defaults to 0) | Positive for elevation gain. |
 | `fitting_type` | **Yes** | Style for elbows/tees: `SCRD`, `SR`, `LR`, `stub_in`, etc. |
 | `fittings` | **Yes** (list, can be empty) | Repeated entries, see §3.2. |

 Optional fields:

 - `pipe_diameter`, `inlet_diameter`, `outlet_diameter` – override derived diameters (m).
 - `control_valve`, `orifice` – component blocks (§3.3).
 - `user_specified_fixed_loss` – pressure drop (Pa) applied directly.
 - `user_K`, `fitting_K`, `pipe_length_K`, `total_K`, `piping_and_fitting_safety_factor` – manual loss overrides (rare).
 - `boundary_pressure` – per-section pressure boundary (Pa).
 - `direction` – overrides network direction for that section.
 - `design_margin` – percent overriding network-level margin.
 - `erosional_constant` – used for erosional velocity checks.
 - `mass_flow_rate`, `volumetric_flow_rate` – optional per-section overrides (kg/s or m³/s); inherit from the network when omitted.

 ### 3.1 Auto-Swage

 When adjacent sections have mismatched diameters and neither explicitly sets inlet/outlet diameters, the loader auto-inserts `inlet_swage` or `outlet_swage` fittings to maintain continuity.

 ### 3.2 Allowed Fitting Types

 ```
 elbow_90, elbow_45, u_bend, stub_in_elbow, tee_elbow, tee_through,
 block_valve_full_line_size, block_valve_reduced_trim_0.9d,
 block_valve_reduced_trim_0.8d, globe_valve, diaphragm_valve,
 butterfly_valve, check_valve_swing, lift_check_valve, tilting_check_valve,
 pipe_entrance_normal, pipe_entrance_raise, pipe_exit,
 inlet_swage, outlet_swage
 ```

 *Aliases*: `check_valve_lift` → `lift_check_valve`, `check_valve_tilting` → `tilting_check_valve`.

 ### 3.3 Components

 #### Control Valve (`control_valve`)

 | Field | Description |
 | --- | --- |
 | `tag` | Identifier for reports. |
 | `cv` / `cg` | Flow coefficients (must be positive if provided). |
 | `pressure_drop` | Fixed ΔP (Pa). |
 | `C1`, `FL`, `Fd`, `xT` | Vendor constants. |
 | `inlet_diameter`, `outlet_diameter`, `valve_diameter` | Defaults to section diameters. |

 The calculator requires either a specified pressure drop or a Cv/Cg. Liquid valves use ISA/IEC flashing / cavitation limits (`F_F`, `F_L`) and benefit from `fluid.vapor_pressure`/`fluid.critical_pressure`, but those values are now optional. Compressible valves follow the ISA expansion-factor correlation (`x_T`, `Y`) and reuse the same geometry factors (`F_P`) as liquids.

 #### Orifice (`orifice`)

 | Field | Description |
 | --- | --- |
 | `tag` | Identifier. |
 | `d_over_D_ratio` | Ratio of orifice to pipe diameter. |
 | `pressure_drop` | Fixed ΔP (Pa). |
 | `pipe_diameter`, `orifice_diameter` | Provide at least one; the loader deduces the other. |
 | `meter_type`, `taps`, `tap_position` | Passed to `fluids.flow_meter`. |
 | `discharge_coefficient`, `expansibility` | Optional overrides. |

 ---

 ## 4. Output Units

 `network.output_units` accepts the following keys (default SI in parentheses):

 - `pressure` (Pa)
 - `pressure_drop` (Pa)
 - `temperature` (K)
 - `density` (kg/m³)
 - `velocity` (m/s)
 - `volumetric_flow_rate` (m³/s)
 - `mass_flow_rate` (kg/s)
 - `flow_momentum` (Pa)

 Unit strings are validated via the project’s converter; invalid entries raise `ValueError`.

 ---

 ## 5. Example Minimal Config

 ```yaml
 network:
   name: demo
   direction: auto
   boundary_pressure: {value: 300, unit: kPa}
   fluid:
     name: nitrogen
     phase: gas
     temperature: {value: 35, unit: degC}
     pressure: {value: 300, unit: kPa}
     molecular_weight: 28
     z_factor: 0.98
     specific_heat_ratio: 1.32
     viscosity: 1.8e-5
     mass_flow_rate: 2.5
   sections:
     - id: inlet
       schedule: 40
       pipe_NPD: 6
       roughness: {value: 0.045, unit: mm}
       length: 20
       elevation_change: 0
       fitting_type: LR
       fittings:
         - {type: elbow_90, count: 2}
       control_valve:
         tag: CV-101
         pressure_drop: {value: 10, unit: kPa}
 ```

 ---

 ## 6. Validation Tips

 - Use `python main.py --config your.yaml` during authoring to surface loader errors early.
 - The solver now fails fast when prerequisites (diameters, positive lengths, component pressures) are missing. Fix configuration issues instead of relying on best-effort runs.
