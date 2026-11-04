from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Home(Base):
    __tablename__ = "homes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    home_name = Column(String(100), nullable=False, default="My Home")
    electricity_tariff = Column(Float, nullable=False, default=8.0)  # ₹ per kWh
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="homes")
    appliances = relationship("Appliance", back_populates="home", cascade="all, delete-orphan")
