import os
from fastapi import FastAPI, status, Response
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import redis.asyncio as redis
import aio_pika

app = FastAPI(title="Project Management API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/postgres")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")


@app.get("/health")
async def health_check(response: Response):
    details = {}
    is_healthy = True

    try:
        pg_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(pg_url, timeout=3.0)
        await conn.execute("SELECT 1")
        await conn.close()
        details["database"] = "healthy"
    except Exception as e:
        details["database"] = f"unhealthy: {str(e)}"
        is_healthy = False

    try:
        r = redis.from_url(REDIS_URL, socket_timeout=3.0)
        await r.ping()
        await r.close()
        details["redis"] = "healthy"
    except Exception as e:
        details["redis"] = f"unhealthy: {str(e)}"
        is_healthy = False

    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL, timeout=3.0)
        await connection.close()
        details["rabbitmq"] = "healthy"
    except Exception as e:
        details["rabbitmq"] = f"unhealthy: {str(e)}"
        is_healthy = False

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "details": details
    }


@app.get("/")
def root():
    return {"message": "Project Management API"}
