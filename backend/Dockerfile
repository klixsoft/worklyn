# ─────────────────────────────────────────────
# Stage 1: builder — install deps with uv
# ─────────────────────────────────────────────
FROM python:3.13-slim AS builder

# Install uv (fast Python package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies into /app/.venv (no system install)
RUN uv sync --frozen --no-dev --no-install-project

# ─────────────────────────────────────────────
# Stage 2: runner — lean production image
# ─────────────────────────────────────────────
FROM python:3.13-slim AS runner

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser

WORKDIR /app

# Copy the virtualenv from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source
COPY . .

# Copy entrypoint
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Activate venv by prepending to PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER appuser

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
