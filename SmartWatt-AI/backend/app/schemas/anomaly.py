from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AnomalyResponse(BaseModel):
    id: int
    appliance_id: Optional[int] = None
    appliance_name: Optional[str] = None
    anomaly_score: float
    description: str
    severity: str
    detected_at: Optional[datetime] = None

    class Config:
        from_attributes = True
