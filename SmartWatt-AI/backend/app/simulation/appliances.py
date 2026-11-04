"""
SmartWatt AI - Virtual Smart Meter Appliance Definitions
Defines appliance models, rated wattage specifications, and diurnal usage patterns.
All simulated readings are clearly identified as simulated data.
"""

from typing import Dict, Any, List
import random
import math


class ApplianceModel:
    def __init__(
        self,
        name: str,
        rated_power: float,
        standby_power: float,
        hourly_probability: List[float],
        power_variance: float = 0.08,
        description: str = "",
    ):
        """
        :param name: Appliance name
        :param rated_power: Operating power in Watts
        :param standby_power: Standby power in Watts when plugged in but idle
        :param hourly_probability: 24-element list of probabilities [0.0 - 1.0] for hours 0-23
        :param power_variance: Random noise factor (e.g., 0.08 = +/- 8%)
        """
        self.name = name
        self.rated_power = rated_power
        self.standby_power = standby_power
        self.hourly_probability = hourly_probability
        self.power_variance = power_variance
        self.description = description

    def calculate_power(
        self,
        hour: int,
        is_weekend: bool = False,
        temperature: float = 28.0,
        forced_status: bool | None = None,
    ) -> tuple[float, bool]:
        """
        Calculates instantaneous power in Watts and active operating state.
        Returns: (power_watts, is_active)
        """
        # If explicitly forced on/off via manual control
        if forced_status is not None:
            if not forced_status:
                return (self.standby_power, False)
            noise = random.uniform(1.0 - self.power_variance, 1.0 + self.power_variance)
            return (round(self.rated_power * noise, 2), True)

        # Base probability from diurnal profile
        base_prob = self.hourly_probability[hour % 24]

        # Adjust for weekend habits (later mornings, daytime home occupancy)
        if is_weekend:
            if 8 <= hour <= 17:
                base_prob = min(1.0, base_prob * 1.35)
            elif hour < 8:
                base_prob = base_prob * 0.6

        # AC load heavily depends on ambient temperature
        if "Air Conditioner" in self.name:
            if temperature > 32.0:
                base_prob = min(0.98, base_prob * 1.6)
            elif temperature < 22.0:
                base_prob = base_prob * 0.25

        # Water Heater / Geyser depends on cooler mornings
        if "Water Heater" in self.name:
            if 5 <= hour <= 9:
                base_prob = 0.75 if temperature < 25.0 else 0.45
            else:
                base_prob = 0.04

        # Refrigerator has a compressor cycling duty cycle (~35% of each hour)
        if "Refrigerator" in self.name:
            # Compressor runs about 35% to 45% of time randomly throughout 24 hrs
            # Slightly higher during warm daytime
            is_active = random.random() < (0.42 if 11 <= hour <= 19 else 0.32)
            if is_active:
                noise = random.uniform(0.92, 1.08)
                return (round(self.rated_power * noise, 2), True)
            else:
                return (round(self.standby_power, 2), False)

        # Stochastic decision for other appliances
        is_active = random.random() < base_prob

        if is_active:
            noise = random.uniform(1.0 - self.power_variance, 1.0 + self.power_variance)
            power = round(self.rated_power * noise, 2)
            return (power, True)
        else:
            return (round(self.standby_power, 2), False)


# 8 Standard Appliances with realistic profiles
DEFAULT_APPLIANCE_PROFILES: Dict[str, ApplianceModel] = {
    "Air Conditioner": ApplianceModel(
        name="Air Conditioner",
        rated_power=1800.0,
        standby_power=5.0,
        # Peaks in hot afternoon (13-16) and night sleeping (21-04)
        hourly_probability=[
            0.65, 0.65, 0.60, 0.50, 0.30, 0.10, 0.05, 0.05,
            0.10, 0.15, 0.25, 0.45, 0.60, 0.75, 0.75, 0.70,
            0.50, 0.40, 0.45, 0.55, 0.70, 0.80, 0.80, 0.70,
        ],
        power_variance=0.10,
        description="1.5 Ton Inverter Split Air Conditioner",
    ),
    "Refrigerator": ApplianceModel(
        name="Refrigerator",
        rated_power=180.0,
        standby_power=2.0,
        hourly_probability=[0.35] * 24,  # Handled by compressor cycle logic
        power_variance=0.08,
        description="Double-door 350L frost-free refrigerator with inverter compressor",
    ),
    "Television": ApplianceModel(
        name="Television",
        rated_power=120.0,
        standby_power=1.5,
        # Evening entertainment peak (18-23), morning news (7-9)
        hourly_probability=[
            0.05, 0.02, 0.01, 0.01, 0.01, 0.02, 0.10, 0.35,
            0.30, 0.15, 0.10, 0.12, 0.15, 0.20, 0.18, 0.15,
            0.20, 0.35, 0.65, 0.85, 0.90, 0.85, 0.50, 0.20,
        ],
        power_variance=0.06,
        description="55-inch 4K LED Smart TV with soundbar",
    ),
    "Washing Machine": ApplianceModel(
        name="Washing Machine",
        rated_power=850.0,
        standby_power=1.0,
        # Typically morning 8-11 or weekend afternoons
        hourly_probability=[
            0.01, 0.00, 0.00, 0.00, 0.00, 0.02, 0.05, 0.15,
            0.30, 0.35, 0.25, 0.15, 0.10, 0.08, 0.08, 0.06,
            0.08, 0.12, 0.10, 0.08, 0.05, 0.03, 0.02, 0.01,
        ],
        power_variance=0.15,
        description="7kg Front-Load Automatic Washing Machine with heater",
    ),
    "Lights": ApplianceModel(
        name="Lights",
        rated_power=90.0,
        standby_power=0.0,
        # Active in morning before sunrise and evening till bed
        hourly_probability=[
            0.10, 0.05, 0.05, 0.05, 0.10, 0.40, 0.70, 0.60,
            0.20, 0.10, 0.08, 0.08, 0.08, 0.08, 0.10, 0.15,
            0.30, 0.70, 0.95, 0.95, 0.95, 0.85, 0.50, 0.20,
        ],
        power_variance=0.10,
        description="Combined LED living room, kitchen, and bedroom lighting fixtures",
    ),
    "Water Heater": ApplianceModel(
        name="Water Heater",
        rated_power=2200.0,
        standby_power=0.0,
        # Intense morning bathing peak (6-9) and evening (20-21)
        hourly_probability=[
            0.01, 0.00, 0.00, 0.00, 0.02, 0.15, 0.55, 0.70,
            0.50, 0.20, 0.08, 0.04, 0.03, 0.02, 0.02, 0.02,
            0.03, 0.05, 0.10, 0.25, 0.30, 0.10, 0.04, 0.02,
        ],
        power_variance=0.05,
        description="25L Instant Storage Geyser",
    ),
    "Microwave": ApplianceModel(
        name="Microwave",
        rated_power=1100.0,
        standby_power=3.0,
        # Breakfast (7-9), lunch (12-14), dinner (19-21) bursts
        hourly_probability=[
            0.01, 0.01, 0.00, 0.00, 0.01, 0.03, 0.15, 0.40,
            0.35, 0.15, 0.10, 0.25, 0.35, 0.30, 0.12, 0.10,
            0.15, 0.20, 0.35, 0.50, 0.45, 0.25, 0.10, 0.04,
        ],
        power_variance=0.08,
        description="28L Convection Microwave Oven",
    ),
    "Computer": ApplianceModel(
        name="Computer",
        rated_power=240.0,
        standby_power=4.0,
        # Work hours (9-18) + evening leisure (19-23)
        hourly_probability=[
            0.10, 0.05, 0.02, 0.01, 0.01, 0.02, 0.05, 0.15,
            0.35, 0.65, 0.75, 0.75, 0.70, 0.68, 0.72, 0.75,
            0.70, 0.65, 0.55, 0.60, 0.65, 0.50, 0.30, 0.15,
        ],
        power_variance=0.12,
        description="High-performance Desktop PC & Dual Monitors",
    ),
}

