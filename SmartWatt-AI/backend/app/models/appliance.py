from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    home_id = Column(Integer, ForeignKey("homes.id"), nullable=False)
    appliance_name = Column(String(100), nullable=False)
    rated_power = Column(Float, nullable=False)  # watts
    status = Column(Boolean, default=False)  # True = on, False = off
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    home = relationship("Home", back_populates="appliances")
    energy_readings = relationship("EnergyReading", back_populates="appliance", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="appliance", cascade="all, delete-orphan")
