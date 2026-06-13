FROM python:3.11-slim

# Install git since the worker needs to clone repositories
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# We don't set a CMD here because we will override it in docker-compose.yml
# depending on whether this container is acting as the API or the Worker.
