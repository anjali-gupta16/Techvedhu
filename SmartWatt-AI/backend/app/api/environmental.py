"""
SmartWatt AI - Environmental Impact API
Calculates estimated carbon emissions (kg CO2e), avoided emissions from energy recommendations,
and equivalent metrics like tree offset equivalents.
All values are clearly labeled as estimates.
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.energy_reading import EnergyReading
from app.models.recommendation import Recommendation
from app.core.config import settings

router = APIRouter(prefix="/api/environmental", tags=["Environmental Impact"])


@router.get("/impact")
def get_environmental_impact(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    factor = settings.GRID_EMISSION_FACTOR  # kg CO2 / kWh

    # Total month energy
    thirty_days_ago = now - timedelta(days=30)
    month_kwh = (
        db.query(func.sum(EnergyReading.energy_kwh))
        .filter(EnergyReading.timestamp >= thirty_days_ago)
        .scalar()
    ) or 348.5

    # Carbon emissions this month
    estimated_co2_kg = round(float(month_kwh) * factor, 2)

    # Sum of potential savings from smart recommendations
    potential_savings_kwh = (
        db.query(func.sum(Recommendation.potential_savings_kwh))
        .scalar()
    ) or 154.9

    # Avoided emissions if all recommendations are implemented
    avoided_co2_kg = round(float(potential_savings_kwh) * factor, 2)

    # 1 mature urban tree absorbs approximately 21.77 kg CO2 annually (~1.81 kg/month)
    trees_equivalent = round(estimated_co2_kg / 21.77, 1)
    trees_saved_equivalent = round(avoided_co2_kg / 21.77, 1)

    return {
        "monthly_energy_kwh": round(float(month_kwh), 2),
        "grid_emission_factor_kg_per_kwh": factor,
        "estimated_co2_emissions_kg": estimated_co2_kg,
        "potential_avoided_co2_kg": avoided_co2_kg,
        "potential_energy_savings_kwh": round(float(potential_savings_kwh), 2),
        "trees_equivalent_needed": trees_equivalent,
        "trees_offset_from_savings": trees_saved_equivalent,
        "is_estimate": True,
        "source": "Central Electricity Authority / Regional Grid Average",
        "simulated": True,
    }

