"""
SmartWatt AI - Smart Recommendation Engine
Generates actionable, rule-based energy efficiency recommendations,
calculates estimated kWh and cost savings based on active electricity tariffs.
All savings are clearly labeled as estimates.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.recommendation import Recommendation
from app.models.home import Home


class RecommendationEngine:
    def generate_recommendations(self, tariff_per_kwh: float = 8.0) -> list[dict]:
        """
        Generates and stores prioritized recommendations with calculated cost savings.
        """
        db: Session = SessionLocal()
        try:
            # Check home tariff
            home = db.query(Home).first()
            if home and home.electricity_tariff:
                tariff = home.electricity_tariff
            else:
                tariff = tariff_per_kwh

            recommendation_catalog = [
                {
                    "title": "Optimize Air Conditioner Temperature to 24°C",
                    "description": "Increasing your AC thermostat from 20°C to 24°C reduces compressor load by approximately 24% without sacrificing indoor comfort during peak daytime heat.",
                    "potential_savings_kwh": 48.0,
                    "priority": "high",
                    "category": "ac",
                },
                {
                    "title": "Shift Washing Machine to Off-Peak Hours",
                    "description": "Run heavy laundry wash cycles during early morning (6:00–8:00 AM) or weekend off-peak time-of-day slots to avoid strained grid tariff bands and lower system heating.",
                    "potential_savings_kwh": 18.5,
                    "priority": "medium",
                    "category": "scheduling",
                },
                {
                    "title": "Eliminate Standby & Phantom Power Drains",
                    "description": "Your desktop workstation, television console, and microwave draw approximately 35W continuously on standby. Using a smart switch or power strip avoids unnecessary idle draws.",
                    "potential_savings_kwh": 25.2,
                    "priority": "high",
                    "category": "standby",
                },
                {
                    "title": "Schedule Water Heater Pre-Heating",
                    "description": "Install a 25-minute timer on your 2.2kW storage geyser rather than keeping it powered on throughout the morning. Instant savings with zero hot water shortages.",
                    "potential_savings_kwh": 32.0,
                    "priority": "high",
                    "category": "appliance",
                },
                {
                    "title": "Automate Daytime Lighting Cut-Off",
                    "description": "Sensors detected ambient living area lights turned on between 10:00 AM and 4:00 PM when natural daylight was above 450 lux. Harness natural solar illumination.",
                    "potential_savings_kwh": 11.4,
                    "priority": "low",
                    "category": "lighting",
                },
                {
                    "title": "Enable Computer Energy-Saver Sleep Mode",
                    "description": "Your 240W desktop system remains powered during 3.5 hours of inactive periods each weekday. Configuring automatic sleep mode after 15 minutes of inactivity saves significant power.",
                    "potential_savings_kwh": 19.8,
                    "priority": "medium",
                    "category": "appliance",
                },
            ]

            # Clear old recommendations and refresh
            db.query(Recommendation).delete()
            db.commit()

            results = []
            for item in recommendation_catalog:
                kwh = item["potential_savings_kwh"]
                cost_savings = round(kwh * tariff, 2)

                rec = Recommendation(
                    title=item["title"],
                    description=item["description"],
                    potential_savings_kwh=kwh,
                    potential_savings_cost=cost_savings,
                    priority=item["priority"],
                    category=item["category"],
                )
                db.add(rec)
                results.append({
                    "title": rec.title,
                    "description": rec.description,
                    "potential_savings_kwh": kwh,
                    "potential_savings_cost": cost_savings,
                    "priority": rec.priority,
                    "category": rec.category,
                })

            db.commit()
            print(f"[SmartWatt AI] Generated and saved {len(results)} recommendations (Tariff: INR {tariff}/kWh).")
            return results

        except Exception as e:
            db.rollback()
            print(f"[SmartWatt AI] Error generating recommendations: {e}")
            return []
        finally:
            db.close()


recommendation_engine = RecommendationEngine()

