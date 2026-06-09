from typing import List
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """
    Pydantic schema representing authentication credentials.
    """

    email: str
    password: str


class UserResponse(BaseModel):
    """
    Pydantic schema representing returned user information, including tokens.
    """

    id: str
    email: str
    role: str
    permissions: List[str]
    access_token: str
    refresh_token: str


class TokenRefreshRequest(BaseModel):
    """
    Pydantic schema representing token refresh requests.
    """

    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """
    Pydantic schema representing refreshed token results.
    """

    access_token: str
    refresh_token: str
