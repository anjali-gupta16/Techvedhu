"""
SmartWatt AI - Energy Readings & Historical API
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from app.database.connection import get_db
from app.models.energy_reading import EnergyReading
from app.models.appliance import Appliance
from app.schemas.energy import EnergyReadingResponse

router = APIRouter(prefix="/api/energy", tags=["Energy"])


@router.get("/readings", response_model=List[EnergyReadingResponse])
def get_readings(
    appliance_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(EnergyReading)
    if appliance_id is not None:
        query = query.filter(EnergyReading.appliance_id == appliance_id)

    readings = query.order_by(EnergyReading.timestamp.desc()).limit(limit).all()
    return readings


@router.get("/history")
def get_history(
    period: str = Query("7d", regex="^(24h|7d|30d|180d)$"),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    delta_map = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "180d": timedelta(days=180),
    }
    start_time = now - delta_map[period]

    appliances = {a.id: a.appliance_name for a in db.query(Appliance).all()}
    recent = (
        db.query(EnergyReading)
        .filter(EnergyReading.timestamp >= start_time)
        .order_by(EnergyReading.timestamp.desc())
        .limit(100)
        .all()
    )

    items = []
    for r in recent:
        items.append({
            "id": r.id,
            "appliance_name": appliances.get(r.appliance_id, f"Appliance #{r.appliance_id}"),
            "power_watts": r.power_watts,
            "energy_kwh": r.energy_kwh,
            "timestamp": r.timestamp.isoformat(),
            "simulated": True,
        })

    return {
        "period": period,
        "count": len(items),
        "readings": items,
        "simulated": True,
    }

