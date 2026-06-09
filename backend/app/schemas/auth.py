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
    Pydantic schema representing returned user information, including roles and permission lists.
    """

    id: str
    email: str
    role: str
    permissions: List[str]
