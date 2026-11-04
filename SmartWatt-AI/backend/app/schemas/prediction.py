from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class PredictionResponse(BaseModel):
    date: str
    predicted_kwh: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None


class DailyPrediction(BaseModel):
    prediction: PredictionResponse
    model_name: str


class WeeklyPrediction(BaseModel):
    predictions: List[PredictionResponse]
    total_predicted_kwh: float
    model_name: str


class ModelMetrics(BaseModel):
    mae: float  # Mean Absolute Error
    rmse: float  # Root Mean Squared Error
    r2_score: float  # R² Score
    training_samples: int
    test_samples: int
    model_name: str
    trained_at: Optional[str] = None
