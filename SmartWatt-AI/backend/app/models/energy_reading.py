from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.database.connection import Base


class EnergyReading(Base):
    __tablename__ = "energy_readings"

    id = Column(Integer, primary_key=True, index=True)
    appliance_id = Column(Integer, ForeignKey("appliances.id"), nullable=False)
    power_watts = Column(Float, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    simulated = Column(Boolean, default=True)

    # Relationships
    appliance = relationship("Appliance", back_populates="energy_readings")

    # Indexes for query performance
    __table_args__ = (
        Index("idx_reading_timestamp", "timestamp"),
        Index("idx_reading_appliance_time", "appliance_id", "timestamp"),
    )
