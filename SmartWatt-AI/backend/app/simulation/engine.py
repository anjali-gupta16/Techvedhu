"""
SmartWatt AI - Real-Time Virtual Smart Meter Simulation Engine
Simulates continuous smart meter readings, manages state, supports speed throttling,
and broadcasts live telemetry to WebSocket clients.
All readings are clearly identified as simulated.
"""

import asyncio
from datetime import datetime, timezone
import random
from typing import Dict, Any, List, Set
from sqlalchemy.orm import Session

from app.core.config import settings
from app.simulation.appliances import DEFAULT_APPLIANCE_PROFILES
from app.simulation.data_generator import simulate_temperature
from app.database.connection import SessionLocal
from app.models.appliance import Appliance
from app.models.energy_reading import EnergyReading
from app.models.home import Home


class SimulationEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SimulationEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.is_running: bool = True
        self.speed: float = 1.0  # 1x, 2x, 5x, 10x
        self.base_interval: float = settings.SIMULATION_INTERVAL  # default 2.0 sec
        self.manual_overrides: Dict[str, bool] = {}  # forced on/off states
        self.listeners: Set[asyncio.Queue] = set()
        self.task: asyncio.Task | None = None
        self.readings_count: int = 0
        self.started_at: datetime = datetime.now(timezone.utc)
        self.latest_snapshot: Dict[str, Any] = {}
        self._initialized = True

    def start(self):
        self.is_running = True
        return self.get_status()

    def stop(self):
        self.is_running = False
        return self.get_status()

    def reset(self):
        self.readings_count = 0
        self.manual_overrides.clear()
        self.speed = 1.0
        self.started_at = datetime.now(timezone.utc)
        return self.get_status()

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(20.0, speed))
        return self.get_status()

    def set_appliance_override(self, appliance_name: str, status: bool | None):
        if status is None:
            self.manual_overrides.pop(appliance_name, None)
        else:
            self.manual_overrides[appliance_name] = status

    def get_status(self) -> Dict[str, Any]:
        return {
            "running": self.is_running,
            "speed": self.speed,
            "readings_count": self.readings_count,
            "started_at": self.started_at.isoformat(),
            "latest_reading": self.latest_snapshot,
            "simulated": True,
        }

    async def add_listener(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        self.listeners.add(q)
        return q

    def remove_listener(self, q: asyncio.Queue):
        self.listeners.discard(q)

    async def broadcast(self, data: Dict[str, Any]):
        for q in list(self.listeners):
            try:
                if q.full():
                    try:
                        q.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                await q.put(data)
            except Exception:
                self.listeners.discard(q)

    def generate_current_tick(self) -> Dict[str, Any]:
        """Calculates instantaneous power for current wall-clock moment."""
        now = datetime.now(timezone.utc)
        hour = now.hour
        day_of_week = now.weekday()
        is_weekend = day_of_week in [5, 6]
        day_of_year = now.timetuple().tm_yday
        temperature = simulate_temperature(day_of_year, hour)

        appliance_readings = []
        total_power = 0.0

        for name, model in DEFAULT_APPLIANCE_PROFILES.items():
            forced = self.manual_overrides.get(name)
            power, active = model.calculate_power(
                hour=hour,
                is_weekend=is_weekend,
                temperature=temperature,
                forced_status=forced,
            )
            # Simulated energy increment for this interval
            # interval in hours: (interval_seconds / 3600)
            elapsed_hours = self.base_interval / 3600.0
            energy_kwh = round((power * elapsed_hours) / 1000.0, 6)

            appliance_readings.append({
                "appliance_name": name,
                "power_watts": power,
                "energy_kwh": energy_kwh,
                "status": active,
                "rated_power": model.rated_power,
            })
            total_power += power

        # Background base load
        base_standby = round(random.uniform(25.0, 45.0), 1)
        total_power += base_standby
        total_energy_kwh = round((total_power * (self.base_interval / 3600.0)) / 1000.0, 6)

        snapshot = {
            "timestamp": now.isoformat(),
            "temperature": temperature,
            "total_power_watts": round(total_power, 2),
            "total_energy_kwh": total_energy_kwh,
            "appliances": appliance_readings,
            "active_count": sum(1 for a in appliance_readings if a["status"]),
            "simulated": True,
        }
        self.latest_snapshot = snapshot
        self.readings_count += 1
        return snapshot

    def persist_readings_to_db(self, snapshot: Dict[str, Any]):
        """Saves current tick to the database so DB reflects active usage."""
        db: Session = SessionLocal()
        try:
            # Query appliances to map names to ids
            appliances = {a.appliance_name: a for a in db.query(Appliance).all()}
            if not appliances:
                return

            now = datetime.fromisoformat(snapshot["timestamp"])
            for item in snapshot["appliances"]:
                app = appliances.get(item["appliance_name"])
                if app:
                    app.status = item["status"]
                    reading = EnergyReading(
                        appliance_id=app.id,
                        power_watts=item["power_watts"],
                        energy_kwh=item["energy_kwh"],
                        timestamp=now,
                        simulated=True,
                    )
                    db.add(reading)
            db.commit()
        except Exception as e:
            db.rollback()
            # Non-fatal during simulation tick
        finally:
            db.close()

    async def run_loop(self):
        """Main async simulation loop."""
        while True:
            try:
                if self.is_running:
                    tick_data = self.generate_current_tick()
                    # Persist reading occasionally (e.g. every 5 ticks to keep DB performant)
                    if self.readings_count % 5 == 0:
                        self.persist_readings_to_db(tick_data)
                    await self.broadcast(tick_data)

                delay = max(0.1, self.base_interval / self.speed)
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SimulationEngine] Error in loop: {e}")
                await asyncio.sleep(2.0)


# Global singleton instance
simulation_engine = SimulationEngine()

