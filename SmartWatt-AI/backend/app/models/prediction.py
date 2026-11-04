from sqlalchemy import Column, Integer, Float, String, DateTime, Date, func
from app.database.connection import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    predicted_energy = Column(Float, nullable=False)  # kWh
    prediction_date = Column(Date, nullable=False)
    model_name = Column(String(100), default="RandomForestRegressor")
    confidence_lower = Column(Float, nullable=True)  # lower bound of error range
    confidence_upper = Column(Float, nullable=True)  # upper bound of error range
    created_at = Column(DateTime, server_default=func.now())
