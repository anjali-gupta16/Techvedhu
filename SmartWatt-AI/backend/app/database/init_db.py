from app.database.connection import engine, Base
from app.models import user, home, appliance, energy_reading, prediction, anomaly, recommendation


def init_database():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
    print("[SmartWatt AI] Database tables created successfully.")
