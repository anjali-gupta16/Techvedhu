"""
SmartWatt AI - Machine Learning Model Trainer
Trains Random Forest Regressor on chronological historical energy consumption data,
computes evaluation metrics (MAE, RMSE, R²), and serializes trained artifact with joblib.
"""

from datetime import datetime, timezone
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.ml.feature_engineering import prepare_features


def train_forecasting_model(
    csv_path: str = "datasets/historical_readings.csv",
    model_dir: str = "trained_models",
) -> dict:
    print(f"[SmartWatt AI] Loading training dataset from {csv_path}...")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    df = pd.read_csv(csv_path)
    X, y, feature_cols = prepare_features(df)

    # Chronological Split: 80% train, 20% test (strict temporal ordering, no leakage)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    print(f"[SmartWatt AI] Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    print("[SmartWatt AI] Training RandomForestRegressor (n_estimators=100)...")

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # Evaluate on held-out chronological test set
    y_pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))

    metrics = {
        "model_name": "RandomForestRegressor",
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": feature_cols,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "confidence_method": "Ensemble decision-tree standard error deviation (empirically calculated)",
    }

    print("\n--- Model Evaluation Results ---")
    print(f"  MAE      : {metrics['mae']:.4f} kWh")
    print(f"  RMSE     : {metrics['rmse']:.4f} kWh")
    print(f"  R² Score : {metrics['r2_score']:.4f}")
    print("--------------------------------\n")

    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "energy_predictor.joblib")
    metrics_path = os.path.join(model_dir, "metrics.json")

    joblib.dump(model, model_path)
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[SmartWatt AI] Model saved to {model_path}")
    print(f"[SmartWatt AI] Metrics saved to {metrics_path}")

    return metrics


if __name__ == "__main__":
    train_forecasting_model()

