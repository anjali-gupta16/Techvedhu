from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ApplianceCreate(BaseModel):
    appliance_name: str = Field(..., max_length=100)
    rated_power: float = Field(..., gt=0, description="Rated power in watts")


class ApplianceUpdate(BaseModel):
    appliance_name: Optional[str] = None
    rated_power: Optional[float] = None
    status: Optional[bool] = None


class ApplianceResponse(BaseModel):
    id: int
    home_id: int
    appliance_name: str
    rated_power: float
    status: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
