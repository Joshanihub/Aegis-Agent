FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code (build context is already backend/ because of Railway rootDirectory)
COPY . .

EXPOSE 8000

# Start server using the port Railway provides, or fallback to 8000
CMD sh -c "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
