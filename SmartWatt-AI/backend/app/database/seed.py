"""
SmartWatt AI - Database Seeder
Seeds default demo user, home, 8 appliances, and historical energy readings.
"""

from datetime import datetime, timezone
import os
import pandas as pd
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.connection import SessionLocal, engine
from app.database.init_db import init_database
from app.models.user import User
from app.models.home import Home
from app.models.appliance import Appliance
from app.models.energy_reading import EnergyReading
from app.simulation.appliances import DEFAULT_APPLIANCE_PROFILES


def seed_database():
    print("[SmartWatt AI] Initializing database schema...")
    init_database()

    db: Session = SessionLocal()
    try:
        # 1. Create or retrieve demo user
        demo_user = db.query(User).filter(User.email == "demo@smartwatt.ai").first()
        if not demo_user:
            print("[SmartWatt AI] Creating demo user: demo@smartwatt.ai / password123")
            demo_user = User(
                name="Anjali Sharma",
                email="demo@smartwatt.ai",
                password_hash=hash_password("password123"),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        else:
            print(f"[SmartWatt AI] Demo user already exists (id={demo_user.id})")

        # 2. Create or retrieve demo home
        home = db.query(Home).filter(Home.user_id == demo_user.id).first()
        if not home:
            print("[SmartWatt AI] Creating home profile 'Smart Home Eco' (tariff: INR 8.0/kWh)")
            home = Home(
                user_id=demo_user.id,
                home_name="Smart Home Eco",
                electricity_tariff=8.0,
            )
            db.add(home)
            db.commit()
            db.refresh(home)

        # 3. Create 8 appliances
        existing_appliances = {a.appliance_name: a for a in db.query(Appliance).filter(Appliance.home_id == home.id).all()}
        appliance_map = {}

        for name, profile in DEFAULT_APPLIANCE_PROFILES.items():
            if name not in existing_appliances:
                app = Appliance(
                    home_id=home.id,
                    appliance_name=name,
                    rated_power=profile.rated_power,
                    status=True,
                )
                db.add(app)
                db.commit()
                db.refresh(app)
                appliance_map[name] = app
            else:
                appliance_map[name] = existing_appliances[name]

        print(f"[SmartWatt AI] Verified {len(appliance_map)} connected appliances.")

        # 4. Populate energy readings from CSV if readings count is low
        readings_count = db.query(EnergyReading).count()
        csv_path = "datasets/historical_readings.csv"

        if readings_count < 1000 and os.path.exists(csv_path):
            print(f"[SmartWatt AI] Seeding database with historical energy readings from {csv_path}...")
            df = pd.read_csv(csv_path)

            col_map = {
                "Air Conditioner": "ac_watts",
                "Refrigerator": "fridge_watts",
                "Television": "tv_watts",
                "Washing Machine": "washer_watts",
                "Lights": "lights_watts",
                "Water Heater": "heater_watts",
                "Microwave": "microwave_watts",
                "Computer": "computer_watts",
            }

            batch = []
            for _, row in df.iterrows():
                dt = datetime.fromisoformat(row["timestamp"])
                for app_name, app_obj in appliance_map.items():
                    col = col_map.get(app_name)
                    power = float(row[col]) if col and col in row else app_obj.rated_power * 0.2
                    energy_kwh = round((power * 1.0) / 1000.0, 5)

                    batch.append(
                        EnergyReading(
                            appliance_id=app_obj.id,
                            power_watts=power,
                            energy_kwh=energy_kwh,
                            timestamp=dt,
                            simulated=True,
                        )
                    )

                    if len(batch) >= 2000:
                        db.bulk_save_objects(batch)
                        db.commit()
                        batch = []

            if batch:
                db.bulk_save_objects(batch)
                db.commit()

            total_readings = db.query(EnergyReading).count()
            print(f"[SmartWatt AI] Successfully seeded {total_readings} energy readings.")
        else:
            print(f"[SmartWatt AI] Database already contains {readings_count} energy readings.")

    except Exception as e:
        db.rollback()
        print(f"[SmartWatt AI] Seeding error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
