from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class HomeCreate(BaseModel):
    home_name: str = Field(default="My Home", max_length=100)
    electricity_tariff: float = Field(default=8.0, gt=0)


class HomeUpdate(BaseModel):
    home_name: Optional[str] = None
    electricity_tariff: Optional[float] = None


class HomeResponse(BaseModel):
    id: int
    user_id: int
    home_name: str
    electricity_tariff: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
