from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RecommendationResponse(BaseModel):
    id: int
    title: str
    description: str
    potential_savings_kwh: Optional[float] = None
    potential_savings_cost: Optional[float] = None
    priority: str
    category: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
