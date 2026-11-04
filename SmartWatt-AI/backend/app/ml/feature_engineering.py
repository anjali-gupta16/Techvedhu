"""
SmartWatt AI - Machine Learning Feature Engineering
Extracts temporal, environmental, lag, and rolling statistics for energy forecasting.
"""

import pandas as pd
import numpy as np


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Transforms raw simulated readings into ML features with lag and rolling metrics.
    Ensures chronological ordering with no future data leakage.
    """
    df = df.copy()
    if not np.issubdtype(df["timestamp"].dtype, np.datetime64):
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    df = df.sort_values("timestamp").reset_index(drop=True)

    # 1. Cyclical time encoding (hour and month)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)

    # 2. Lag features (previous 1h, 24h, 168h)
    target = df["total_energy_kwh"]
    df["lag_1h"] = target.shift(1)
    df["lag_24h"] = target.shift(24)
    df["lag_168h"] = target.shift(168)  # exactly 1 week ago

    # 3. Rolling window statistics
    df["rolling_mean_24h"] = target.shift(1).rolling(window=24, min_periods=1).mean()
    df["rolling_std_24h"] = target.shift(1).rolling(window=24, min_periods=1).std().fillna(0)

    # Backfill warm-up periods for initial lags
    df["lag_1h"] = df["lag_1h"].bfill()
    df["lag_24h"] = df["lag_24h"].bfill()
    df["lag_168h"] = df["lag_168h"].bfill()

    feature_cols = [
        "hour",
        "day_of_week",
        "month",
        "is_weekend",
        "temperature",
        "hour_sin",
        "hour_cos",
        "month_sin",
        "month_cos",
        "lag_1h",
        "lag_24h",
        "lag_168h",
        "rolling_mean_24h",
        "rolling_std_24h",
    ]

    X = df[feature_cols].copy()
    y = df["total_energy_kwh"].copy()

    return X, y, feature_cols

