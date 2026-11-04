"""
SmartWatt AI - Virtual Smart Meter Historical Data Generator
Generates realistic multi-month historical electricity consumption datasets
for training machine learning forecasting models and initial database population.
All data is clearly identified as simulated.
"""

from datetime import datetime, timedelta, timezone
import random
import math
import os
import pandas as pd

from app.simulation.appliances import DEFAULT_APPLIANCE_PROFILES


def simulate_temperature(day_of_year: int, hour: int) -> float:
    """
    Simulates a realistic ambient temperature profile (representative of subtropical/temperate climates).
    Seasonal curve + diurnal diurnal amplitude (cooler at night, hotter mid-afternoon).
    """
    # Seasonal baseline: varies from ~18°C in winter to ~36°C in summer
    seasonal_base = 27.0 + 8.5 * math.sin(2 * math.pi * (day_of_year - 100) / 365)
    # Daily diurnal swing: peak around 14:00 (+5°C), low around 05:00 (-5°C)
    daily_swing = 5.0 * math.sin(2 * math.pi * (hour - 8) / 24)
    # Natural jitter
    noise = random.uniform(-1.2, 1.2)
    return round(seasonal_base + daily_swing + noise, 2)


def generate_historical_dataset(
    days: int = 180,
    output_path: str = "datasets/historical_readings.csv",
) -> pd.DataFrame:
    """
    Generates hourly simulated readings for 180+ days across all 8 appliances.
    Returns: DataFrame containing time, environmental, appliance loads and total energy.
    """
    print(f"[SmartWatt AI] Generating {days} days of simulated smart meter readings...")
    
    end_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=days)

    records = []
    current_time = start_time

    while current_time < end_time:
        hour = current_time.hour
        day_of_week = current_time.weekday()  # 0=Monday, 6=Sunday
        is_weekend = day_of_week in [5, 6]
        month = current_time.month
        day_of_year = current_time.timetuple().tm_yday
        temp = simulate_temperature(day_of_year, hour)

        appliance_powers = {}
        total_power = 0.0

        for name, model in DEFAULT_APPLIANCE_PROFILES.items():
            power, _ = model.calculate_power(hour, is_weekend, temp)
            appliance_powers[name] = power
            total_power += power

        # Add small household base load (routers, standby chargers, clocks)
        base_standby = round(random.uniform(25.0, 45.0), 1)
        total_power += base_standby

        # Energy in kWh for this 1-hour interval: W * 1 hr / 1000
        hourly_energy_kwh = round((total_power * 1.0) / 1000.0, 4)

        # Record dictionary
        row = {
            "timestamp": current_time.isoformat(),
            "hour": hour,
            "day_of_week": day_of_week,
            "month": month,
            "is_weekend": int(is_weekend),
            "temperature": temp,
            "ac_watts": appliance_powers.get("Air Conditioner", 0.0),
            "fridge_watts": appliance_powers.get("Refrigerator", 0.0),
            "tv_watts": appliance_powers.get("Television", 0.0),
            "washer_watts": appliance_powers.get("Washing Machine", 0.0),
            "lights_watts": appliance_powers.get("Lights", 0.0),
            "heater_watts": appliance_powers.get("Water Heater", 0.0),
            "microwave_watts": appliance_powers.get("Microwave", 0.0),
            "computer_watts": appliance_powers.get("Computer", 0.0),
            "base_standby_watts": base_standby,
            "total_power_watts": round(total_power, 2),
            "total_energy_kwh": hourly_energy_kwh,
            "simulated": True,
        }
        records.append(row)
        current_time += timedelta(hours=1)

    df = pd.DataFrame(records)

    # Ensure target directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[SmartWatt AI] Saved {len(df)} simulated historical records to {output_path}")
    return df


if __name__ == "__main__":
    generate_historical_dataset(days=180, output_path="datasets/historical_readings.csv")

