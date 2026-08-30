# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy shared contracts and backend code
COPY contracts/ ./contracts/
COPY backend/ ./backend/

# Expose port
EXPOSE 8001

# Command is typically overridden in docker-compose for worker vs api
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8001"]
