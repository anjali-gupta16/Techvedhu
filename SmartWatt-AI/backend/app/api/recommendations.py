"""
SmartWatt AI - Smart Recommendations API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.recommendation import Recommendation
from app.models.home import Home
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_engine import recommendation_engine
from app.core.config import settings

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db)):
    recs = db.query(Recommendation).order_by(Recommendation.potential_savings_cost.desc()).all()
    if not recs:
        home = db.query(Home).first()
        tariff = home.electricity_tariff if home else settings.DEFAULT_TARIFF
        recommendation_engine.generate_recommendations(tariff_per_kwh=tariff)
        recs = db.query(Recommendation).order_by(Recommendation.potential_savings_cost.desc()).all()
    return recs


@router.post("/refresh")
def refresh_recommendations(db: Session = Depends(get_db)):
    home = db.query(Home).first()
    tariff = home.electricity_tariff if home else settings.DEFAULT_TARIFF
    items = recommendation_engine.generate_recommendations(tariff_per_kwh=tariff)
    return {
        "status": "success",
        "count": len(items),
        "items": items,
        "tariff_used": tariff,
        "simulated": True,
    }

