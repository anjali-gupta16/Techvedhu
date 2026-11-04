from sqlalchemy import Column, Integer, Float, String, DateTime, func
from app.database.connection import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
    potential_savings_kwh = Column(Float, nullable=True)
    potential_savings_cost = Column(Float, nullable=True)  # ₹
    priority = Column(String(20), default="medium")  # low, medium, high
    category = Column(String(50), nullable=True)  # ac, lighting, standby, scheduling, etc.
    created_at = Column(DateTime, server_default=func.now())
