from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class UserMinResponse(BaseModel):
    id: UUID
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    owner_id: UUID
    owner: Optional[UserMinResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Task Schemas ---
class TaskCreate(BaseModel):
    project_id: UUID
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None
    assignee_id: Optional[UUID] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[UUID] = None

class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    assignee_id: Optional[UUID] = None
    assignee: Optional[UserMinResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
