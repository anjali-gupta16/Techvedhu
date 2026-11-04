"""
SmartWatt AI - Appliance CRUD API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.appliance import Appliance
from app.models.home import Home
from app.schemas.appliance import ApplianceCreate, ApplianceUpdate, ApplianceResponse

router = APIRouter(prefix="/api/appliances", tags=["Appliances"])


@router.get("", response_model=List[ApplianceResponse])
def get_appliances(db: Session = Depends(get_db)):
    appliances = db.query(Appliance).all()
    return appliances


@router.post("", response_model=ApplianceResponse, status_code=status.HTTP_201_CREATED)
def create_appliance(appliance_in: ApplianceCreate, db: Session = Depends(get_db)):
    home = db.query(Home).first()
    if not home:
        raise HTTPException(status_code=400, detail="No active home profile found to attach appliance.")

    app = Appliance(
        home_id=home.id,
        appliance_name=appliance_in.appliance_name,
        rated_power=appliance_in.rated_power,
        status=True,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.put("/{appliance_id}", response_model=ApplianceResponse)
def update_appliance(appliance_id: int, updates: ApplianceUpdate, db: Session = Depends(get_db)):
    app = db.query(Appliance).filter(Appliance.id == appliance_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appliance not found")

    if updates.appliance_name is not None:
        app.appliance_name = updates.appliance_name
    if updates.rated_power is not None:
        app.rated_power = updates.rated_power
    if updates.status is not None:
        app.status = updates.status

    db.commit()
    db.refresh(app)
    return app


@router.delete("/{appliance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appliance(appliance_id: int, db: Session = Depends(get_db)):
    app = db.query(Appliance).filter(Appliance.id == appliance_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appliance not found")

    db.delete(app)
    db.commit()
    return None

