FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the whole backend directory maintaining structure
COPY backend/ backend/

# Set working directory to the backend folder where main.py lives
WORKDIR /app/backend

EXPOSE 8000

# Start server using the port Railway provides, or fallback to 8000
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
