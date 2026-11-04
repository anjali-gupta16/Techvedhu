"""
SmartWatt AI - Anomaly Detection API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.anomaly import Anomaly
from app.models.appliance import Appliance
from app.schemas.anomaly import AnomalyResponse
from app.ml.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


@router.get("", response_model=List[AnomalyResponse])
def get_anomalies(db: Session = Depends(get_db)):
    appliances = {a.id: a.appliance_name for a in db.query(Appliance).all()}
    anomalies = db.query(Anomaly).order_by(Anomaly.detected_at.desc()).all()

    if not anomalies:
        # Auto-scan if none exist
        anomaly_detector.scan_and_record_anomalies()
        anomalies = db.query(Anomaly).order_by(Anomaly.detected_at.desc()).all()

    results = []
    for a in anomalies:
        results.append({
            "id": a.id,
            "appliance_id": a.appliance_id,
            "appliance_name": appliances.get(a.appliance_id, "Smart System"),
            "anomaly_score": a.anomaly_score,
            "description": a.description,
            "severity": a.severity,
            "detected_at": a.detected_at,
        })
    return results


@router.post("/scan")
def trigger_scan():
    detected = anomaly_detector.scan_and_record_anomalies()
    return {
        "status": "success",
        "anomalies_detected": len(detected),
        "items": detected,
        "simulated": True,
    }

