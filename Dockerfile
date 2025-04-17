# Use Node.js as base image for multi-stage build
FROM node:18-alpine as frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy frontend files
COPY frontend/ /app/frontend/

# Install frontend dependencies and build
RUN npm install
RUN npm run build

# Use Ubuntu 22.04 as the final image
FROM ubuntu:22.04

# Disable interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Python, MongoDB, and Node.js
RUN apt update && apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    gnupg \
    nginx \
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
COPY backend/ /app/backend/

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Install Python dependencies
RUN pip3 install --no-cache-dir -r backend/requirements.txt

# Set Pythonpath
ENV PYTHONPATH="${PYTHONPATH}:/app/backend"

# Configure nginx to serve frontend and proxy API requests
RUN echo 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
\n\
    # Serve frontend files\n\
    location / {\n\
        root /app/frontend/dist;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Proxy API requests to FastAPI backend\n\
    location /api/ {\n\
        proxy_pass http://localhost:8000;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}' > /etc/nginx/sites-available/default

# Expose ports
EXPOSE 80 8000

# Create startup script
RUN echo '#!/bin/bash\n\
# Start MongoDB in background\n\
mongod --logpath /var/log/mongod.log --bind_ip_all &\n\
\n\
# Start FastAPI in background\n\
cd /app/backend && python3 app/main.py &\n\
\n\
# Start nginx in foreground\n\
nginx -g "daemon off;"\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run the services
CMD ["/app/start.sh"]
