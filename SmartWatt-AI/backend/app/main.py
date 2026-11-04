"""
SmartWatt AI - Main FastAPI Application
Registers all routers, CORS middleware, lifespan events, and simulation loop.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.init_db import init_database
from app.simulation.engine import simulation_engine

# Import API Routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.simulation import router as simulation_router
from app.api.appliances import router as appliances_router
from app.api.energy import router as energy_router
from app.api.predictions import router as predictions_router
from app.api.anomalies import router as anomalies_router
from app.api.recommendations import router as recommendations_router
from app.api.reports import router as reports_router
from app.api.environmental import router as environmental_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print(f"[{settings.APP_NAME}] Initializing database tables...")
    init_database()

    # Start simulation engine background loop
    print(f"[{settings.APP_NAME}] Starting virtual smart meter simulation loop...")
    sim_task = asyncio.create_task(simulation_engine.run_loop())

    yield

    # Shutdown
    print(f"[{settings.APP_NAME}] Cancelling simulation task...")
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass
    print(f"[{settings.APP_NAME}] Shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-Stack AI Smart Home Energy Monitoring & Prediction System (Virtual Smart Meter Simulation)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(simulation_router)
app.include_router(appliances_router)
app.include_router(energy_router)
app.include_router(predictions_router)
app.include_router(anomalies_router)
app.include_router(recommendations_router)
app.include_router(reports_router)
app.include_router(environmental_router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "documentation": "/docs",
        "simulation_mode": "virtual_smart_meter",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "simulation_running": simulation_engine.is_running,
        "ticks_generated": simulation_engine.readings_count,
    }
