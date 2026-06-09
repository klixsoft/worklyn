from typing import AsyncGenerator, Optional
import aio_pika
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Header
from app.core.config import settings
from app.core.database import SessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.close()


async def get_rabbitmq() -> AsyncGenerator[Optional[aio_pika.abc.AbstractConnection], None]:
    if settings.APP_ENV == "development":
        yield None
        return
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    try:
        yield connection
    finally:
        await connection.close()


def verify_permission(required_permission: str):
    import jwt
    from fastapi import Depends, Header, HTTPException, status
    from typing import Optional
    from sqlalchemy.future import select
    from sqlalchemy.orm import selectinload
    from app.core.security import decode_token
    from app.models.auth import User, Role

    async def dependency(
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        token = authorization.replace("Bearer ", "")
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token subject",
                )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        stmt = (
            select(User)
            .where(User.id == user_id, User.is_active == True)
            .options(selectinload(User.roles).selectinload(Role.permissions))
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        if user.is_superuser:
            return user

        if user.is_staff and required_permission in ["users:read", "users:update"]:
            return user

        permissions = set()
        user_roles_list = []
        for role in user.roles:
            user_roles_list.append(role.name)
            for perm in role.permissions:
                permissions.add(perm.name)

        if "admin" in user_roles_list or "*" in permissions:
            return user

        if required_permission in permissions:
            return user

        parts = required_permission.split(":")
        if len(parts) > 1:
            resource = parts[0]
            if f"{resource}:*" in permissions:
                return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted",
        )

    return dependency


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> "User":
    from fastapi import Header, HTTPException, status
    import jwt
    import uuid
    from app.core.security import decode_token
    from app.models.auth import User
    from sqlalchemy.future import select

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    stmt = select(User).where(User.id == uuid.UUID(user_id) if isinstance(user_id, str) else user_id, User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user




