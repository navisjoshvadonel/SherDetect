# ai_engine/Dockerfile
FROM python:3.11-slim

# Install system dependencies for OpenCV and Tesseract
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY ai_engine/requirements.txt ./ai_engine/
RUN pip install --no-cache-dir -r ai_engine/requirements.txt

# Copy shared contracts and ai_engine code
COPY contracts/ ./contracts/
COPY ai_engine/ ./ai_engine/

# Expose port
EXPOSE 8000

# Run FastAPI using uvicorn
CMD ["uvicorn", "ai_engine.server:app", "--host", "0.0.0.0", "--port", "8000"]
