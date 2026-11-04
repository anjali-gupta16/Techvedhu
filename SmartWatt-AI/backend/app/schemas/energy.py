from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class EnergyReadingResponse(BaseModel):
    id: int
    appliance_id: int
    power_watts: float
    energy_kwh: float
    timestamp: datetime
    simulated: bool

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    today_consumption_kwh: float
    monthly_consumption_kwh: float
    predicted_consumption_kwh: float
    estimated_bill: float
    efficiency_score: float
    active_appliances: int
    total_appliances: int
    simulation_running: bool


class ConsumptionData(BaseModel):
    labels: List[str]
    values: List[float]
    period: str  # "daily", "weekly", "monthly"


class ApplianceConsumption(BaseModel):
    appliance_name: str
    consumption_kwh: float
    percentage: float
    power_watts: float
