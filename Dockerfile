# PCARDB single-container image: FastAPI backend + built React frontend.
# Suitable for Render/Railway free-tier demos.

# --- Stage 1: build the frontend ---
FROM node:22-slim AS frontend
WORKDIR /app
COPY project/frontend/package*.json ./
RUN npm ci
COPY project/frontend/ ./
RUN npm run build

# --- Stage 2: backend + WeasyPrint runtime ---
FROM python:3.12-slim
WORKDIR /app

# WeasyPrint native dependencies (pango et al.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 libffi8 \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

COPY project/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY project/backend/ ./project/backend/
COPY --from=frontend /app/dist ./project/frontend/dist

WORKDIR /app/project/backend

# Demo defaults; override MANAGER_PASSWORD / OFFICER_PASSWORD in the platform's env settings.
ENV PORT=8000
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
