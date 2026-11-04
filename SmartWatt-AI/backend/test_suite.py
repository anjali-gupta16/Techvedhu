"""
SmartWatt AI - Comprehensive Backend Test Suite
Executes end-to-end integration tests on all REST API endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_all():
    print("[TEST] 1. Root and Health...")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("  -> Root & Health OK")

    print("[TEST] 2. Authentication Flow...")
    # Login with demo user
    r = client.post("/api/auth/login", json={"email": "demo@smartwatt.ai", "password": "password123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200, f"Me failed: {r.text}"
    print("  -> Auth & JWT verification OK")

    print("[TEST] 3. Dashboard APIs...")
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200, f"Summary failed: {r.text}"
    data = r.json()
    assert "today_consumption_kwh" in data
    assert "monthly_consumption_kwh" in data
    assert "predicted_consumption_kwh" in data
    assert "estimated_bill" in data
    assert data["simulated"] is True

    r = client.get("/api/dashboard/consumption?period=daily")
    assert r.status_code == 200, f"Daily consumption failed: {r.text}"
    assert len(r.json()["labels"]) == 24
    print("  -> Dashboard Summary & Consumption OK")

    print("[TEST] 4. Simulation Engine APIs...")
    r = client.get("/api/simulation/status")
    assert r.status_code == 200
    r = client.post("/api/simulation/speed", json={"speed": 5.0})
    assert r.status_code == 200
    r = client.post("/api/simulation/appliance/Air Conditioner/override", json={"status": True})
    assert r.status_code == 200
    r = client.post("/api/simulation/stop")
    assert r.status_code == 200
    r = client.post("/api/simulation/start")
    assert r.status_code == 200
    print("  -> Simulation controls OK")

    print("[TEST] 5. Appliances CRUD...")
    r = client.get("/api/appliances")
    assert r.status_code == 200
    apps = r.json()
    assert len(apps) >= 8

    # Create test appliance
    r = client.post("/api/appliances", json={"appliance_name": "Test Fan", "rated_power": 75.0})
    assert r.status_code == 201
    new_id = r.json()["id"]

    # Update
    r = client.put(f"/api/appliances/{new_id}", json={"rated_power": 80.0, "status": False})
    assert r.status_code == 200
    assert r.json()["rated_power"] == 80.0

    # Delete
    r = client.delete(f"/api/appliances/{new_id}")
    assert r.status_code == 204
    print("  -> Appliances CRUD OK")

    print("[TEST] 6. Machine Learning Predictions...")
    r = client.get("/api/predictions/daily")
    assert r.status_code == 200
    daily_preds = r.json()
    assert len(daily_preds["hourly_predictions"]) == 24
    assert daily_preds["total_predicted_kwh"] > 0

    r = client.get("/api/predictions/weekly")
    assert r.status_code == 200
    weekly_preds = r.json()
    assert len(weekly_preds["daily_predictions"]) == 7

    r = client.get("/api/predictions/metrics")
    assert r.status_code == 200
    metrics = r.json()
    assert "mae" in metrics and "rmse" in metrics and "r2_score" in metrics
    print(f"  -> Predictions & Metrics OK (MAE: {metrics['mae']}, RMSE: {metrics['rmse']}, R2: {metrics['r2_score']})")

    print("[TEST] 7. Anomaly Detection...")
    r = client.get("/api/anomalies")
    assert r.status_code == 200
    r = client.post("/api/anomalies/scan")
    assert r.status_code == 200
    print("  -> Isolation Forest Anomaly Detection OK")

    print("[TEST] 8. Smart Recommendations...")
    r = client.get("/api/recommendations")
    assert r.status_code == 200
    recs = r.json()
    assert len(recs) >= 5
    r = client.post("/api/recommendations/refresh")
    assert r.status_code == 200
    print("  -> Recommendation Engine OK")

    print("[TEST] 9. Reports & Exports...")
    r = client.get("/api/reports/daily")
    assert r.status_code == 200
    r = client.get("/api/reports/weekly")
    assert r.status_code == 200
    r = client.get("/api/reports/monthly")
    assert r.status_code == 200

    r = client.get("/api/reports/export/csv?days=30")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    assert len(r.content) > 100

    r = client.get("/api/reports/export/pdf?days=30")
    assert r.status_code == 200
    assert "application/pdf" in r.headers["content-type"]
    assert len(r.content) > 1000
    print("  -> Reports, CSV Export & PDF Export OK")

    print("[TEST] 10. Environmental Impact...")
    r = client.get("/api/environmental/impact")
    assert r.status_code == 200
    impact = r.json()
    assert "estimated_co2_emissions_kg" in impact
    assert "trees_equivalent_needed" in impact
    assert impact["is_estimate"] is True
    print("  -> Environmental Impact OK")

    print("\n=======================================================")
    print("ALL 10 TEST SUITES PASSED WITH ZERO ERRORS (100% SUCCESS)")
    print("=======================================================")


if __name__ == "__main__":
    test_all()

