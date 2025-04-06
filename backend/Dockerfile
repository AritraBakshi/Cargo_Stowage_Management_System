# Use Ubuntu 22.04 as base
FROM ubuntu:22.04

# Avoid interactive timezone setup
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Python & pip
RUN apt update && apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /backend

# Copy code
COPY . .

# Install dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Set PYTHONPATH to root of app so you don't need to use `PYTHONPATH=.` manually
ENV PYTHONPATH="${PYTHONPATH}:/backend"

# Expose port
EXPOSE 8000

# Run server
CMD ["python3", "app/main.py"]
