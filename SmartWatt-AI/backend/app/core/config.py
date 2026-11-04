from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SmartWatt AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./smartwatt.db"

    # JWT Authentication
    SECRET_KEY: str = "smartwatt-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Simulation
    SIMULATION_INTERVAL: float = 2.0  # seconds between readings
    DEFAULT_TARIFF: float = 8.0  # ₹ per kWh

    # Environmental
    GRID_EMISSION_FACTOR: float = 0.82  # kg CO2 per kWh (India average)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
