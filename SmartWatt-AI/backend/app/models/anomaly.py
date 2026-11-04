from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    appliance_id = Column(Integer, ForeignKey("appliances.id"), nullable=True)
    anomaly_score = Column(Float, nullable=False)
    description = Column(String(500), nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high
    detected_at = Column(DateTime, server_default=func.now())

    # Relationships
    appliance = relationship("Appliance", back_populates="anomalies")
