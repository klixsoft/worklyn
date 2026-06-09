from typing import List, Optional
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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    phone_number: Optional[str] = None
    document_url: Optional[str] = None
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
