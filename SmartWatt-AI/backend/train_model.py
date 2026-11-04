"""
SmartWatt AI - Model Training Script
Loads historical data (or generates if missing) and trains Random Forest model.
"""

import os
from app.simulation.data_generator import generate_historical_dataset
from app.ml.trainer import train_forecasting_model


def main():
    csv_path = "datasets/historical_readings.csv"
    if not os.path.exists(csv_path):
        print("[SmartWatt AI] Dataset not found, generating 180 days of simulated smart meter readings...")
        generate_historical_dataset(days=180, output_path=csv_path)

    metrics = train_forecasting_model(csv_path=csv_path)
    print("\n[SmartWatt AI] Machine Learning Pipeline Execution Completed Successfully.")
    return metrics


if __name__ == "__main__":
    main()

