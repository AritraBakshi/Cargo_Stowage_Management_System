# Use Ubuntu 22.04 as base image
FROM ubuntu:22.04

# Disable interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Python and MongoDB
RUN apt update && apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Add MongoDB GPG key and repo
RUN curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt update && apt install -y mongodb-org

# Create MongoDB data directory
RUN mkdir -p /data/db

# Set working directory
WORKDIR /app

# Copy backend code
COPY backend/ /app/

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Set Pythonpath
ENV PYTHONPATH="${PYTHONPATH}:/app"

# Expose FastAPI port
EXPOSE 8000

# Start MongoDB then run FastAPI
CMD mongod --fork --logpath /var/log/mongod.log && python3 app/main.py
