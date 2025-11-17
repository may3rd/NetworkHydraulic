from network_hydraulic.utils.pint_units import u, P_atm, P_atm_pascal, P_atm_bar, P_atm_ksc, P_atm_psi

# --- Examples ---

print("--- Registry and Offset Definitions ---")
print(f"Standard Atmosphere (psi): {P_atm_psi:.5f} psi")
print(f"Standard Atmosphere (bar): {P_atm_bar:.5f} bar")
print("-" * 40)


print("\n--- Gauge to Absolute Conversions ---")
# 1. Start with 0 gauge pressure (atmospheric pressure)
pressure_g_1 = u.Quantity(0, u.psig)
print(f"{pressure_g_1} = {pressure_g_1.to(u.psi):.5f} (absolute)")

pressure_g_2 = u.Quantity(0, u.barg)
print(f"{pressure_g_2} = {pressure_g_2.to(u.bar):.5f} (absolute)")

# 2. Start with a positive gauge pressure
pressure_g_3 = u.Quantity(10, u.barg)
print(f"{pressure_g_3} = {pressure_g_3.to(u.bar):.5f} (absolute)")
print(f"{pressure_g_3} = {pressure_g_3.to(u.psi):.5f} (absolute)")
print(f"{pressure_g_3} = {pressure_g_3.to(u.psig):.5f} (gauge)")
print(f"{pressure_g_3} = {pressure_g_3.to(u.kscg):.5f} (gauge)")
print("-" * 40)


print("\n--- Absolute to Gauge Conversions ---")
# 1. Start with standard atmospheric pressure (should be 0 gauge)
pressure_a_1 = 1.0 * u.atm
print(f"{pressure_a_1.to(u.psi):.5f} (absolute) = {pressure_a_1.to(u.psig):.5f}")

# 2. Start with a high absolute pressure
pressure_a_2 = 30 * u.psi
print(f"{pressure_a_2} (absolute) = {pressure_a_2.to(u.psig):.5f}")
print(f"{pressure_a_2} (absolute) = {pressure_a_2.to(u.kscg):.5f}")
print("-" * 40)

print("\n--- Delta (Difference) Calculations ---")
# Pint correctly handles differences (offsets cancel out)
pressure_delta = u.Quantity(10, u.psig) - u.Quantity(5, u.psig)
print(f"A difference of {pressure_delta}...")
print(f"...is equal to {pressure_delta.to(u.psi)}")
print("Note: 5.0 psig = 5.0 psi (because it's a difference)")
print("-" * 40)