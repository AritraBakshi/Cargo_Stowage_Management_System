# Use Ubuntu 22.04 as base image
FROM ubuntu:22.04

# Disable interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Python and pip
RUN apt update && apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy only the backend folder into the container
COPY backend/ /app/

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Set PYTHONPATH to make sure internal imports work
ENV PYTHONPATH="${PYTHONPATH}:/app"

# Expose FastAPI default port
EXPOSE 8000

# Run the FastAPI app
CMD ["python3", "app/main.py"]
