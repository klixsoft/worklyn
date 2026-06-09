import uuid
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.storage import Folder, File
from app.schemas.storage import (
    FolderCreate,
    FolderUpdate,
    FolderResponse,
    FileCreateRequest,
    PresignedUploadResponse,
    FileConfirmUpload,
    FileResponse,
    FolderContentsResponse,
)
from app.core.boto import (
    generate_presigned_upload_url,
    generate_presigned_download_url,
    get_s3_client
)
from app.core.config import settings
from app.api.v1.endpoints.history import log_activity

router = APIRouter()

async def get_or_create_user_root_folder(db: AsyncSession, user: User) -> Folder:
    """
    Finds or creates a personal root folder named after the user's username.
    """
    stmt = select(Folder).where(
        Folder.parent_id == None,
        Folder.owner_id == user.id,
        Folder.name == user.username
    )
    res = await db.execute(stmt)
    root = res.scalars().first()
    if not root:
        root = Folder(
            name=user.username,
            parent_id=None,
            owner_id=user.id,
            is_public=False
        )
        db.add(root)
        await db.commit()
        await db.refresh(root)
    return root

@router.get("/folders", response_model=List[FolderResponse])
async def list_folders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[FolderResponse]:
    # Return folders owned by user, or public folders.
    stmt = select(Folder).where(
        (Folder.owner_id == current_user.id) | (Folder.is_public == True)
    )
    res = await db.execute(stmt)
    folders = res.scalars().all()
    # Always ensure root folder exists
    await get_or_create_user_root_folder(db, current_user)
    return list(folders)

@router.post("/folders", response_model=FolderResponse)
async def create_folder(
    body: FolderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FolderResponse:
    parent_id = None
    if body.parent_id:
        parent_id = uuid.UUID(body.parent_id)
        # Verify parent exists and is accessible
        parent_stmt = select(Folder).where(Folder.id == parent_id)
        parent_res = await db.execute(parent_stmt)
        parent = parent_res.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
        if parent.owner_id != current_user.id and not parent.is_public:
            raise HTTPException(status_code=403, detail="Access denied to parent folder")
    else:
        # If no parent_id, default parent is the user's root folder
        root = await get_or_create_user_root_folder(db, current_user)
        parent_id = root.id

    new_folder = Folder(
        name=body.name,
        parent_id=parent_id,
        owner_id=current_user.id,
        is_public=False
    )
    db.add(new_folder)
    await db.commit()
    await db.refresh(new_folder)
    await log_activity(db, current_user.id, "CREATE_FOLDER", f"Created folder {new_folder.name}")
    return new_folder

@router.get("/folders/{folder_id}/contents", response_model=FolderContentsResponse)
async def get_folder_contents(
    folder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FolderContentsResponse:
    # If "root", resolve to user's root folder
    if folder_id == "root":
        folder = await get_or_create_user_root_folder(db, current_user)
        f_id = folder.id
    else:
        f_id = uuid.UUID(folder_id)
        stmt = select(Folder).where(Folder.id == f_id)
        res = await db.execute(stmt)
        folder = res.scalar_one_or_none()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        # Check permissions
        if folder.owner_id != current_user.id and not folder.is_public:
            raise HTTPException(status_code=403, detail="Access denied")

    # Load subfolders
    sub_stmt = select(Folder).where(Folder.parent_id == f_id)
    sub_res = await db.execute(sub_stmt)
    subfolders = sub_res.scalars().all()

    # Load files
    files_stmt = select(File).where(File.folder_id == f_id)
    files_res = await db.execute(files_stmt)
    files = files_res.scalars().all()

    # Generate presigned download URLs for files
    file_responses = []
    for f in files:
        # Check download permission (owner or public)
        url = None
        if f.owner_id == current_user.id or f.is_public or folder.is_public:
            try:
                url = generate_presigned_download_url(f.s3_key, f.name)
            except Exception as s3_err:
                print(f"Error generating download URL for {f.s3_key}: {s3_err}")
        
        file_responses.append(FileResponse(
            id=str(f.id),
            name=f.name,
            folder_id=str(f.folder_id) if f.folder_id else None,
            owner_id=str(f.owner_id),
            size=f.size,
            mime_type=f.mime_type,
            s3_key=f.s3_key,
            is_public=f.is_public,
            created_at=f.created_at,
            download_url=url
        ))

    return FolderContentsResponse(
        folder=FolderResponse.from_orm(folder),
        subfolders=[FolderResponse.from_orm(sf) for sf in subfolders],
        files=file_responses
    )

@router.put("/folders/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    body: FolderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FolderResponse:
    f_id = uuid.UUID(folder_id)
    stmt = select(Folder).where(Folder.id == f_id)
    res = await db.execute(stmt)
    folder = res.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only folder owner can edit properties")

    # Prevent renaming the root folder
    if folder.parent_id is None:
        if body.name is not None and body.name != folder.name:
            raise HTTPException(status_code=400, detail="Cannot rename user root folder")

    if body.name is not None:
        folder.name = body.name
    if body.is_public is not None:
        folder.is_public = body.is_public
        
    await db.commit()
    await db.refresh(folder)
    await log_activity(db, current_user.id, "UPDATE_FOLDER", f"Updated folder {folder.name}")
    return folder

@router.post("/files/presign-upload", response_model=PresignedUploadResponse)
async def presign_file_upload(
    body: FileCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PresignedUploadResponse:
    if body.folder_id:
        f_id = uuid.UUID(body.folder_id)
        # Check folder accessibility
        stmt = select(Folder).where(Folder.id == f_id)
        res = await db.execute(stmt)
        folder = res.scalar_one_or_none()
        if not folder:
            raise HTTPException(status_code=404, detail="Destination folder not found")
        if folder.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot upload to folder you do not own")
    else:
        root = await get_or_create_user_root_folder(db, current_user)
        f_id = root.id

    file_id = uuid.uuid4()
    # Clean the filename to be S3 key safe
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', body.name)
    s3_key = f"{f_id}/{file_id}-{clean_name}"
    
    try:
        upload_url = generate_presigned_upload_url(s3_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 client failed to generate presigned upload url: {str(e)}")
        
    return PresignedUploadResponse(upload_url=upload_url, s3_key=s3_key)

@router.post("/files/confirm-upload", response_model=FileResponse)
async def confirm_file_upload(
    body: FileConfirmUpload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FileResponse:
    if body.folder_id:
        f_id = uuid.UUID(body.folder_id)
    else:
        root = await get_or_create_user_root_folder(db, current_user)
        f_id = root.id

    # Create file record
    new_file = File(
        name=body.name,
        folder_id=f_id,
        owner_id=current_user.id,
        size=body.size,
        mime_type=body.mime_type,
        s3_key=body.s3_key,
        is_public=False
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    await log_activity(db, current_user.id, "UPLOAD_FILE", f"Uploaded file {new_file.name}")
    
    # Generate download url
    download_url = None
    try:
        download_url = generate_presigned_download_url(new_file.s3_key, new_file.name)
    except Exception as s3_err:
        print(f"Error generating download URL for {new_file.s3_key}: {s3_err}")
        
    return FileResponse(
        id=str(new_file.id),
        name=new_file.name,
        folder_id=str(new_file.folder_id),
        owner_id=str(new_file.owner_id),
        size=new_file.size,
        mime_type=new_file.mime_type,
        s3_key=new_file.s3_key,
        is_public=new_file.is_public,
        created_at=new_file.created_at,
        download_url=download_url
    )

@router.put("/files/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: str,
    is_public: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> FileResponse:
    fid = uuid.UUID(file_id)
    stmt = select(File).where(File.id == fid)
    res = await db.execute(stmt)
    file_obj = res.scalar_one_or_none()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    if file_obj.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_obj.is_public = is_public
    await db.commit()
    await db.refresh(file_obj)
    await log_activity(db, current_user.id, "UPDATE_FILE", f"Updated file {file_obj.name} visibility to public={is_public}")
    
    download_url = None
    try:
        download_url = generate_presigned_download_url(file_obj.s3_key, file_obj.name)
    except Exception as s3_err:
        print(f"Error generating download URL for {file_obj.s3_key}: {s3_err}")
        
    return FileResponse(
        id=str(file_obj.id),
        name=file_obj.name,
        folder_id=str(file_obj.folder_id) if file_obj.folder_id else None,
        owner_id=str(file_obj.owner_id),
        size=file_obj.size,
        mime_type=file_obj.mime_type,
        s3_key=file_obj.s3_key,
        is_public=file_obj.is_public,
        created_at=file_obj.created_at,
        download_url=download_url
    )

@router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fid = uuid.UUID(file_id)
    stmt = select(File).options(selectinload(File.folder)).where(File.id == fid)
    res = await db.execute(stmt)
    file_obj = res.scalar_one_or_none()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check accessibility: owner OR file public OR parent folder public
    accessible = (
        file_obj.owner_id == current_user.id 
        or file_obj.is_public 
        or (file_obj.folder is not None and file_obj.folder.is_public)
    )
    if not accessible:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        url = generate_presigned_download_url(file_obj.s3_key, file_obj.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 client failed to generate download url: {str(e)}")
        
    return {"url": url}

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fid = uuid.UUID(file_id)
    stmt = select(File).where(File.id == fid)
    res = await db.execute(stmt)
    file_obj = res.scalar_one_or_none()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
    if file_obj.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete file")

    # Delete from S3
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=settings.S3_BUCKET, Key=file_obj.s3_key)
    except Exception as e:
        print(f"Failed to delete object from S3: {e}")

    await db.delete(file_obj)
    await db.commit()
    await log_activity(db, current_user.id, "DELETE_FILE", f"Deleted file {file_obj.name}")
    return {"success": True}

@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    f_id = uuid.UUID(folder_id)
    stmt = select(Folder).where(Folder.id == f_id)
    res = await db.execute(stmt)
    folder = res.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete folder")
    if folder.parent_id is None:
        raise HTTPException(status_code=400, detail="Cannot delete user root folder")

    # Helper function to delete S3 objects recursively for this folder and all subfolders
    async def delete_s3_objects_recursive(fid: uuid.UUID):
        # Delete files in this folder
        f_stmt = select(File).where(File.folder_id == fid)
        f_res = await db.execute(f_stmt)
        files = f_res.scalars().all()
        s3 = get_s3_client()
        for f in files:
            try:
                s3.delete_object(Bucket=settings.S3_BUCKET, Key=f.s3_key)
            except Exception as e:
                print(f"S3 Delete failed for key {f.s3_key}: {e}")
                
        # Find subfolders and recurse
        sf_stmt = select(Folder).where(Folder.parent_id == fid)
        sf_res = await db.execute(sf_stmt)
        subfolders = sf_res.scalars().all()
        for sf in subfolders:
            await delete_s3_objects_recursive(sf.id)

    await delete_s3_objects_recursive(f_id)
    
    # Delete folder from DB
    await db.delete(folder)
    await db.commit()
    await log_activity(db, current_user.id, "DELETE_FOLDER", f"Deleted folder {folder.name} and its contents")
    return {"success": True}
