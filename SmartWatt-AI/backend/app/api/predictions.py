"""
SmartWatt AI - Machine Learning Predictions API
Serves next-day and 7-day energy forecasts with tree-ensemble confidence bounds
and model performance evaluation metrics.
"""

from fastapi import APIRouter
from app.ml.predictor import predictor_service

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


@router.get("/daily")
def get_daily_predictions():
    preds = predictor_service.predict_daily()
    total_kwh = round(sum(p["predicted_kwh"] for p in preds), 2)
    return {
        "model_name": "RandomForestRegressor",
        "total_predicted_kwh": total_kwh,
        "hourly_predictions": preds,
        "simulated": True,
    }


@router.get("/weekly")
def get_weekly_predictions():
    preds = predictor_service.predict_weekly()
    total_kwh = round(sum(p["predicted_kwh"] for p in preds), 2)
    return {
        "model_name": "RandomForestRegressor",
        "total_predicted_kwh": total_kwh,
        "daily_predictions": preds,
        "simulated": True,
    }


@router.get("/metrics")
def get_metrics():
    return predictor_service.get_metrics()

