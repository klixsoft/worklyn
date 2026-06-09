from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None

class FolderResponse(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID] = None
    owner_id: UUID
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FileCreateRequest(BaseModel):
    name: str
    mime_type: str
    size: int
    folder_id: Optional[UUID] = None

class PresignedUploadResponse(BaseModel):
    upload_url: str
    s3_key: str

class FileConfirmUpload(BaseModel):
    name: str
    mime_type: str
    size: int
    s3_key: str
    folder_id: Optional[UUID] = None

class FileResponse(BaseModel):
    id: UUID
    name: str
    folder_id: Optional[UUID] = None
    owner_id: UUID
    size: int
    mime_type: str
    s3_key: str
    is_public: bool
    created_at: datetime
    download_url: Optional[str] = None

    class Config:
        from_attributes = True

class FolderContentsResponse(BaseModel):
    folder: Optional[FolderResponse] = None
    subfolders: List[FolderResponse]
    files: List[FileResponse]
