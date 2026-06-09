from typing import List, Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    permissions: List[str]
    is_superuser: bool
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
