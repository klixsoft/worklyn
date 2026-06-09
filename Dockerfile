# ─────────────────────────────────────────────
# Stage 1: Build Backend
# ─────────────────────────────────────────────
FROM python:3.13-slim AS backend-builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app/backend

# Copy dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies into /app/backend/.venv
RUN uv sync --frozen --no-dev --no-install-project

# ─────────────────────────────────────────────
# Stage 2: Install Frontend Dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# ─────────────────────────────────────────────
# Stage 3: Build Frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────
# Stage 4: Lean Unified Runner
# ─────────────────────────────────────────────
FROM python:3.13-slim AS runner

# Install Node.js 20
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Backend app and virtualenv
COPY --from=backend-builder /app/backend/.venv /app/backend/.venv
COPY backend/ /app/backend

# Copy Frontend compiled assets
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

# Setup entrypoint script
COPY docker/entrypoint-unified.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PATH="/app/backend/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 3000
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
