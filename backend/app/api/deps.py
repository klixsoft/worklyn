from typing import AsyncGenerator
import aio_pika
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import SessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields a database session and closes it when the request is completed.
    """
    async with SessionLocal() as session:
        yield session


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    """
    Yields a Redis client connection and closes it upon completion.
    """
    client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.close()


async def get_rabbitmq() -> AsyncGenerator[aio_pika.abc.AbstractConnection, None]:
    """
    Yields a robust RabbitMQ connection and closes it upon completion.
    """
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    try:
        yield connection
    finally:
        await connection.close()


def verify_permission(required_permission: str):
    """
    Validates request custom headers to verify permission capabilities.
    """
    from fastapi import Header, HTTPException, status
    from typing import Optional

    def dependency(
        x_user_id: Optional[str] = Header(None),
        x_user_role: Optional[str] = Header(None),
        x_user_permissions: Optional[str] = Header(None),
    ) -> bool:
        if not x_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        permissions = x_user_permissions.split(",") if x_user_permissions else []
        if x_user_role == "admin" or "*" in permissions:
            return True
        if required_permission in permissions:
            return True
        parts = required_permission.split(":")
        if len(parts) > 1:
            resource = parts[0]
            if f"{resource}:*" in permissions:
                return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted",
        )

    return dependency

