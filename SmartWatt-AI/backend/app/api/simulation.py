"""
SmartWatt AI - Virtual Smart Meter Simulation API & WebSockets
Controls simulation loop (start, stop, reset, speed), manages manual overrides,
and streams real-time telemetry over WebSockets.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Body
from app.simulation.engine import simulation_engine
import asyncio

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


@router.get("/status")
def get_status():
    return simulation_engine.get_status()


@router.post("/start")
def start_simulation():
    return simulation_engine.start()


@router.post("/stop")
def stop_simulation():
    return simulation_engine.stop()


@router.post("/reset")
def reset_simulation():
    return simulation_engine.reset()


@router.post("/speed")
def set_simulation_speed(speed: float = Body(..., embed=True)):
    return simulation_engine.set_speed(speed)


@router.post("/appliance/{name}/override")
def override_appliance(name: str, status: bool | None = Body(None, embed=True)):
    simulation_engine.set_appliance_override(name, status)
    return {
        "appliance": name,
        "forced_status": status,
        "simulated": True,
    }


# WebSocket endpoint for real-time live telemetry stream
@router.websocket("/ws")
async def websocket_simulation_stream(websocket: WebSocket):
    await websocket.accept()
    queue = await simulation_engine.add_listener()
    try:
        # Immediately send current snapshot
        if simulation_engine.latest_snapshot:
            await websocket.send_json(simulation_engine.latest_snapshot)
        else:
            tick = simulation_engine.generate_current_tick()
            await websocket.send_json(tick)

        while True:
            # Wait for next simulation tick
            data = await queue.get()
            await websocket.send_json(data)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception as e:
        print(f"[WebSocket] Client disconnected: {e}")
    finally:
        simulation_engine.remove_listener(queue)

