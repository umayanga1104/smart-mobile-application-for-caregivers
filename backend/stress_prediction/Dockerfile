FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the necessary files for inference
# Exclude WESAD dataset (only needed for training)
COPY inference.py .
COPY features.py .
COPY ml_service/inference_api.py .
COPY ml_service/requirements.txt ./ml_service/
COPY stress_model/ ./stress_model/

EXPOSE 8001

CMD ["uvicorn", "inference_api:app", "--host", "0.0.0.0", "--port", "8001"]
