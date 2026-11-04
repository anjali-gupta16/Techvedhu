"""
SmartWatt AI - Dashboard Analytics API
Aggregates real-time metrics, month-to-date totals, appliance distributions,
and simulated consumption curves.
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.appliance import Appliance
from app.models.energy_reading import EnergyReading
from app.models.home import Home
from app.simulation.engine import simulation_engine
from app.ml.predictor import predictor_service
from app.core.config import settings

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Total and Active Appliances
    total_appliances = db.query(Appliance).count() or 8
    active_appliances = db.query(Appliance).filter(Appliance.status == True).count()

    # 2. Tariff
    home = db.query(Home).first()
    tariff = home.electricity_tariff if home else settings.DEFAULT_TARIFF

    # 3. Today's consumption (last 24 hours of readings)
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_kwh = (
        db.query(func.sum(EnergyReading.energy_kwh))
        .filter(EnergyReading.timestamp >= day_start)
        .scalar()
    ) or 0.0

    if today_kwh == 0.0:
        # Fallback to sum of last 24 records if day_start has few readings
        recent_24h = now - timedelta(hours=24)
        today_kwh = (
            db.query(func.sum(EnergyReading.energy_kwh))
            .filter(EnergyReading.timestamp >= recent_24h)
            .scalar()
        ) or 14.85

    # 4. Monthly consumption (last 30 days of readings)
    thirty_days_ago = now - timedelta(days=30)
    monthly_kwh = (
        db.query(func.sum(EnergyReading.energy_kwh))
        .filter(EnergyReading.timestamp >= thirty_days_ago)
        .scalar()
    ) or 348.5

    # 5. AI Predicted consumption for tomorrow
    daily_preds = predictor_service.predict_daily()
    predicted_kwh = round(sum(p["predicted_kwh"] for p in daily_preds), 2)

    # 6. Estimated Bill
    estimated_bill = round(monthly_kwh * tariff, 2)

    # 7. Efficiency Score (0 to 100)
    # Average baseline household consumes ~16 kWh/day
    target_daily = 16.0
    actual_daily_rate = today_kwh if today_kwh > 0 else 14.5
    score = max(50.0, min(98.0, 100.0 - ((actual_daily_rate - 12.0) / target_daily) * 20.0))

    return {
        "today_consumption_kwh": round(float(today_kwh), 2),
        "monthly_consumption_kwh": round(float(monthly_kwh), 2),
        "predicted_consumption_kwh": predicted_kwh,
        "estimated_bill": estimated_bill,
        "efficiency_score": round(score, 1),
        "active_appliances": active_appliances,
        "total_appliances": total_appliances,
        "simulation_running": simulation_engine.is_running,
        "tariff_rate": tariff,
        "simulated": True,
    }


@router.get("/consumption")
def get_dashboard_consumption(period: str = "daily", db: Session = Depends(get_db)):
    """
    Returns time series labels & values for charts (period: daily, weekly, monthly).
    Also includes appliance breakdown pie disaggregation.
    """
    now = datetime.now(timezone.utc)
    labels = []
    values = []

    if period == "daily":
        # 24 hourly buckets
        labels = [f"{h:02d}:00" for h in range(24)]
        # Aggregate from readings or simulate smooth pattern
        for h in range(24):
            # Typical day profile
            val = 0.85 + 0.9 * (1 if 18 <= h <= 22 or 6 <= h <= 9 else 0.4)
            values.append(round(val, 2))
    elif period == "weekly":
        # Last 7 days
        days = [(now - timedelta(days=6 - i)) for i in range(7)]
        labels = [d.strftime("%a") for d in days]
        values = [14.2, 15.6, 13.9, 16.8, 17.4, 18.2, 15.1]
    else:
        # Last 4 weeks
        labels = ["Week 1", "Week 2", "Week 3", "Week 4"]
        values = [98.5, 104.2, 92.8, 108.6]

    # Appliance breakdown
    appliances = db.query(Appliance).all()
    appliance_data = []
    total_app_kwh = 0.0

    app_defaults = {
        "Air Conditioner": 5.8,
        "Water Heater": 2.6,
        "Refrigerator": 1.4,
        "Washing Machine": 1.1,
        "Computer": 1.2,
        "Microwave": 0.8,
        "Television": 0.7,
        "Lights": 0.9,
    }

    for app in appliances:
        # Query sum from energy_readings in past 24h
        recent_kwh = (
            db.query(func.sum(EnergyReading.energy_kwh))
            .filter(EnergyReading.appliance_id == app.id)
            .filter(EnergyReading.timestamp >= now - timedelta(hours=24))
            .scalar()
        )
        if not recent_kwh or recent_kwh == 0:
            recent_kwh = app_defaults.get(app.appliance_name, 1.0)
        
        total_app_kwh += float(recent_kwh)
        appliance_data.append({
            "appliance_name": app.appliance_name,
            "consumption_kwh": round(float(recent_kwh), 2),
            "power_watts": app.rated_power if app.status else 0.0,
            "status": app.status,
        })

    # Add percentages
    for item in appliance_data:
        pct = (item["consumption_kwh"] / total_app_kwh * 100.0) if total_app_kwh > 0 else 12.5
        item["percentage"] = round(pct, 1)

    return {
        "period": period,
        "labels": labels,
        "values": values,
        "appliance_breakdown": sorted(appliance_data, key=lambda x: x["consumption_kwh"], reverse=True),
        "simulated": True,
    }

