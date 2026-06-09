from datetime import timedelta
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db
from app.core.security import create_token, decode_token, verify_password
from app.models.auth import Role, User
from app.schemas.auth import (
    LoginRequest,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserResponse,
)

router = APIRouter()


@router.post("/login", response_model=UserResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)) -> UserResponse:
    stmt = (
        select(User)
        .where(User.email == credentials.email.lower(), User.is_active == True)
        .options(selectinload(User.roles).selectinload(Role.permissions))
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    permissions = set()
    roles_list = []
    for role in user.roles:
        roles_list.append(role.name)
        for perm in role.permissions:
            permissions.add(perm.name)

    access_token = create_token(user.id, timedelta(minutes=30), "access")
    refresh_token = create_token(user.id, timedelta(days=7), "refresh")

    primary_role = roles_list[0] if roles_list else "member"

    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        role=primary_role,
        permissions=list(permissions),
        is_superuser=user.is_superuser,
        is_staff=user.is_staff,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar=user.avatar,
        phone_number=user.phone_number,
        document_url=user.document_url,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh(
    body: TokenRefreshRequest, db: AsyncSession = Depends(get_db)
) -> TokenRefreshResponse:
    """
    Verifies refresh token and generates fresh access/refresh tokens.
    """
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
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
            detail="Refresh token has expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    stmt = select(User).where(User.id == user_id, User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    new_access_token = create_token(user.id, timedelta(minutes=30), "access")
    new_refresh_token = create_token(user.id, timedelta(days=7), "refresh")

    return TokenRefreshResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )
