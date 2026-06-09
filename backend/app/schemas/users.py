from typing import List, Optional
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    is_staff: bool = False
    role_ids: List[str] = []

class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_staff: Optional[bool] = None
    role_ids: Optional[List[str]] = None

class DeleteConfirmation(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    admin_password: str
    new_password: str

class RoleCreate(BaseModel):
    name: str
    permission_ids: List[str] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permission_ids: Optional[List[str]] = None

class PermissionResponse(BaseModel):
    id: str
    name: str

class RoleResponse(BaseModel):
    id: str
    name: str
    permissions: List[PermissionResponse]

class UserCRUDResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    is_superuser: bool
    is_staff: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    roles: List[RoleResponse]
