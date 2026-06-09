import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, verify_permission
from app.core.security import verify_password
from app.models.auth import User, Role, Permission
from app.schemas.users import RoleCreate, RoleUpdate, RoleResponse, PermissionResponse, DeleteConfirmation
from app.api.v1.endpoints.history import log_activity

router = APIRouter()

@router.get("", response_model=List[RoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("roles:read")),
) -> List[RoleResponse]:
    stmt = select(Role).options(selectinload(Role.permissions))
    result = await db.execute(stmt)
    roles = result.scalars().all()
    
    return [RoleResponse(
        id=str(r.id),
        name=r.name,
        permissions=[PermissionResponse(id=str(p.id), name=p.name) for p in r.permissions]
    ) for r in roles]

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("roles:read")),
) -> List[PermissionResponse]:
    stmt = select(Permission)
    result = await db.execute(stmt)
    permissions = result.scalars().all()
    return [PermissionResponse(id=str(p.id), name=p.name) for p in permissions]

@router.post("", response_model=RoleResponse)
async def create_role(
    body: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("roles:create")),
) -> RoleResponse:
    stmt = select(Role).where(Role.name == body.name)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )
        
    new_role = Role(name=body.name)
    if body.permission_ids:
        perm_uuids = [uuid.UUID(pid) for pid in body.permission_ids]
        perm_stmt = select(Permission).where(Permission.id.in_(perm_uuids))
        perm_res = await db.execute(perm_stmt)
        new_role.permissions = list(perm_res.scalars().all())
        
    db.add(new_role)
    await db.commit()
    await db.refresh(new_role)
    
    await log_activity(db, current_user.id, "CREATE_ROLE", f"Created role {new_role.name}")
    return RoleResponse(
        id=str(new_role.id),
        name=new_role.name,
        permissions=[PermissionResponse(id=str(p.id), name=p.name) for p in new_role.permissions]
    )

@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("roles:update")),
) -> RoleResponse:
    stmt = select(Role).where(Role.id == uuid.UUID(role_id)).options(selectinload(Role.permissions))
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
        
    if body.name is not None:
        role.name = body.name
        
    if body.permission_ids is not None:
        perm_uuids = [uuid.UUID(pid) for pid in body.permission_ids]
        perm_stmt = select(Permission).where(Permission.id.in_(perm_uuids))
        perm_res = await db.execute(perm_stmt)
        role.permissions = list(perm_res.scalars().all())
        
    await db.commit()
    await db.refresh(role)
    
    await log_activity(db, current_user.id, "UPDATE_ROLE", f"Updated role {role.name}")
    return RoleResponse(
        id=str(role.id),
        name=role.name,
        permissions=[PermissionResponse(id=str(p.id), name=p.name) for p in role.permissions]
    )

@router.post("/{role_id}/confirm-delete")
async def delete_role(
    role_id: str,
    confirmation: DeleteConfirmation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("roles:delete")),
):
    if not verify_password(confirmation.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password confirmation"
        )
        
    stmt = select(Role).where(Role.id == uuid.UUID(role_id))
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
        
    name = role.name
    await db.delete(role)
    await db.commit()
    
    await log_activity(db, current_user.id, "DELETE_ROLE", f"Deleted role {name}")
    return {"success": True}
