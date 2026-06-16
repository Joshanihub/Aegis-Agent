FROM python:3.11-slim

WORKDIR /app

# Install dependencies
# Build context is repo root when dockerfilePath is used in railway.toml
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code into /app
COPY backend/ .

# Expose port
EXPOSE 8000

# Start server — uses $PORT env var if set (Railway injects this), else defaults to 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
