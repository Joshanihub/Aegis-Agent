FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ai module from project root
COPY ai ./ai

# Copy backend source code
COPY backend .

EXPOSE 8000

# Start server using the port Railway provides, or fallback to 8000
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
