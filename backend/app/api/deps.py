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
