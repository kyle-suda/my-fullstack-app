FROM python:3.9-slim

# System deps needed by LightGBM and XGBoost
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer-cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and assets
COPY src/     ./src/
COPY models/  ./models/
COPY data/    ./data/

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Railway sets PORT dynamically; default to 8000 if not set
ENV PORT=8000
EXPOSE 8000

# Use sh -c so ${PORT} is expanded at runtime
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 4 --timeout 120 --preload src.api:app"]
