"""
FastAPI wrapper around the stress prediction model.
Run: uvicorn inference_api:app --host 0.0.0.0 --port 8001
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import numpy as np
import sys, os

# Add parent dir so we can import inference.py / features.py
# ✅ Handle both local (ml_service/inference_api.py) and Docker (/app/inference_api.py) structures
APP_DIR = os.path.dirname(os.path.abspath(__file__))

# If we're in ml_service subfolder (local dev), go up to stress_prediction
# Otherwise we're already at /app (Docker), so use it directly
if os.path.basename(APP_DIR) == "ml_service":
    BASE_DIR = os.path.dirname(APP_DIR)  # Local: stress_prediction/
else:
    BASE_DIR = APP_DIR  # Docker: /app

MODEL_DIR = os.path.join(BASE_DIR, "stress_model")

# Add base directory to Python path (to find inference.py and features.py)
sys.path.insert(0, BASE_DIR)

from inference import StressPredictor

app = FastAPI(title="Stress Prediction Service")

# Load model ONCE at startup
MODEL_DIR = os.environ.get("MODEL_DIR", MODEL_DIR)  # Use env var if set, otherwise use calculated path
predictor = StressPredictor(MODEL_DIR)
print(f"✓ Model loaded from {MODEL_DIR}")


class SensorWindow(BaseModel):
    """60-second sensor window from the watch."""
    heartRate: List[float] = Field(
        ..., description="HR in BPM, ~1 value/sec, 60 values ideal"
    )
    skinTemperature: Optional[List[float]] = Field(
        None, description="Skin temp in °C"
    )
    accelerometer: Optional[Dict] = Field(
        None,
        description='{"x":[],"y":[],"z":[],"samplingRateHz":25}'
    )
    steps: Optional[int] = Field(
        0, description="Steps during this 60-sec window"
    )
    baselineHR: Optional[float] = Field(
        None,
        description=(
            "User's personal long-term average HR in BPM. "
            "When provided, compensates for individuals whose natural "
            "resting HR is above the WESAD training population mean (~72 BPM). "
            "Prevents false-stress classification for high-resting-HR users."
        )
    )




def steps_to_activity_level(steps: int, window_sec: int = 60) -> float:
    """
    Convert step count in a window to activity level (0-10).
    0 steps/min → 0.0 (sedentary)
    ~60 steps/min → 3.0 (slow walk)
    ~120 steps/min → 6.0 (brisk walk)
    ~180+ steps/min → 9.0+ (running)
    """
    steps_per_min = (steps / window_sec) * 60
    return min(10.0, steps_per_min / 20.0)

class PredictionResponse(BaseModel):
    prediction: int
    label: str
    confidence: float
    stress_score: float
    probabilities: Optional[Dict[str, float]] = None
    context_rule: Optional[str] = None
    note: Optional[str] = None

@app.post("/predict", response_model=PredictionResponse)
def predict_stress(data: SensorWindow):
    try:
        # Validate HR data
        if len(data.heartRate) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least 10 HR values, got {len(data.heartRate)}"
            )

        hr = data.heartRate

        # Temperature: use provided or default
        if data.skinTemperature and len(data.skinTemperature) >= 2:
            temp = data.skinTemperature
        else:
            # Default skin temperature (neutral)
            temp = [33.5] * 12

        # Accelerometer or activity level
        acc = None
        activity_level = None
        accel_units = "ms2"

        if (data.accelerometer
                and data.accelerometer.get("x")
                and len(data.accelerometer["x"]) > 10):
            x = np.array(data.accelerometer["x"], dtype=np.float64)
            y = np.array(data.accelerometer["y"], dtype=np.float64)
            z = np.array(data.accelerometer["z"], dtype=np.float64)
            min_len = min(len(x), len(y), len(z))
            acc = np.column_stack([x[:min_len], y[:min_len], z[:min_len]])
            accel_units = "ms2"
        else:
            # Fall back to activity level from steps
            activity_level = steps_to_activity_level(data.steps or 0)

        result = predictor.predict(
            heart_rate=hr,
            temperature=temp,
            accelerometer=acc,
            activity_level=activity_level,
            accel_units=accel_units,
            baseline_hr=data.baselineHR if data.baselineHR and data.baselineHR > 40 else None,
        )

        return PredictionResponse(
            prediction=result.get("prediction", 0),
            label=result.get("label", "non_stress"),
            confidence=result.get("confidence", 0.5),
            stress_score=result.get("stress_score", 0.0),
            probabilities=result.get("probabilities"),
            context_rule=result.get("context_rule"),
            note=result.get("note"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_type": predictor.meta.get("model_type"),
        "features": len(predictor.feat_cols),
    }