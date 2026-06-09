from fastapi import APIRouter, Response, status
import aio_pika
import asyncpg
import redis.asyncio as redis
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check(response: Response):
    """
    Performs connectivity tests to database, cache, and message queue.
    """
    details = {}
    is_healthy = True

    try:
        pg_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(pg_url, timeout=3.0)
        await conn.execute("SELECT 1")
        await conn.close()
        details["database"] = "healthy"
    except Exception as e:
        details["database"] = f"unhealthy: {str(e)}"
        is_healthy = False

    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=3.0)
        await r.ping()
        await r.close()
        details["redis"] = "healthy"
    except Exception as e:
        details["redis"] = f"unhealthy: {str(e)}"
        is_healthy = False

    if settings.APP_ENV != "development":
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL, timeout=3.0)
            await connection.close()
            details["rabbitmq"] = "healthy"
        except Exception as e:
            details["rabbitmq"] = f"unhealthy: {str(e)}"
            is_healthy = False
    else:
        details["rabbitmq"] = "skipped (development)"

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {"status": "healthy" if is_healthy else "unhealthy", "details": details}
