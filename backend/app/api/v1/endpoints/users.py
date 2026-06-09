import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, verify_permission
from app.core.security import hash_password, verify_password
from app.models.auth import User, Role
from app.schemas.users import UserCreate, UserUpdate, UserCRUDResponse, DeleteConfirmation, RoleResponse, PermissionResponse, ChangePasswordRequest
from app.api.v1.endpoints.history import log_activity

router = APIRouter()

@router.get("", response_model=List[UserCRUDResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("users:read")),
) -> List[UserCRUDResponse]:
    if current_user.is_staff and not current_user.is_superuser:
        stmt = select(User).where(User.id == current_user.id).options(selectinload(User.roles).selectinload(Role.permissions))
    else:
        stmt = select(User).options(selectinload(User.roles).selectinload(Role.permissions))
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    response_list = []
    for u in users:
        roles_data = []
        for r in u.roles:
            perms_data = [PermissionResponse(id=str(p.id), name=p.name) for p in r.permissions]
            roles_data.append(RoleResponse(id=str(r.id), name=r.name, permissions=perms_data))
            
        response_list.append(UserCRUDResponse(
            id=str(u.id),
            email=u.email,
            username=u.username,
            is_active=u.is_active,
            is_superuser=u.is_superuser,
            is_staff=u.is_staff,
            first_name=u.first_name,
            last_name=u.last_name,
            phone_number=u.phone_number,
            roles=roles_data
        ))
    return response_list

@router.post("", response_model=UserCRUDResponse)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("users:create")),
) -> UserCRUDResponse:
    stmt = select(User).where(User.email == body.email.lower())
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email already exists"
        )
    
    if not current_user.is_superuser:
        body.is_superuser = False
        body.is_staff = False

    import re
    # Extract base username from email and clean it
    base_username = body.email.split("@")[0].lower()
    base_username = re.sub(r'[^a-zA-Z0-9_\-]', '', base_username)
    if not base_username:
        base_username = "user"
    username = base_username
    counter = 1
    while True:
        check_stmt = select(User).where(User.username == username)
        check_res = await db.execute(check_stmt)
        if not check_res.scalar_one_or_none():
            break
        username = f"{base_username}{counter}"
        counter += 1

    new_user = User(
        email=body.email.lower(),
        username=username,
        hashed_password=hash_password(body.password),
        is_active=body.is_active,
        is_superuser=body.is_superuser,
        is_staff=body.is_staff,
        first_name=body.first_name,
        last_name=body.last_name,
        phone_number=body.phone_number
    )
    
    if body.role_ids:
        role_uuids = [uuid.UUID(rid) for rid in body.role_ids]
        role_stmt = select(Role).where(Role.id.in_(role_uuids))
        role_res = await db.execute(role_stmt)
        new_user.roles = list(role_res.scalars().all())

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    await log_activity(db, current_user.id, "CREATE_USER", f"Created user {new_user.email}")
    
    roles_data = []
    for r in new_user.roles:
        perms_data = [PermissionResponse(id=str(p.id), name=p.name) for p in r.permissions]
        roles_data.append(RoleResponse(id=str(r.id), name=r.name, permissions=perms_data))

    return UserCRUDResponse(
        id=str(new_user.id),
        email=new_user.email,
        username=new_user.username,
        is_active=new_user.is_active,
        is_superuser=new_user.is_superuser,
        is_staff=new_user.is_staff,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone_number=new_user.phone_number,
        roles=roles_data
    )

@router.put("/{user_id}", response_model=UserCRUDResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("users:update")),
) -> UserCRUDResponse:
    if current_user.is_staff and not current_user.is_superuser:
        if uuid.UUID(user_id) != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff members can only update their own profile"
            )
        # Prevent staff from altering their own privilege roles
        body.is_superuser = None
        body.is_staff = None

    stmt = select(User).where(User.id == uuid.UUID(user_id)).options(selectinload(User.roles).selectinload(Role.permissions))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if body.email is not None:
        user.email = body.email.lower()
    if body.first_name is not None:
        user.first_name = body.first_name
    if body.last_name is not None:
        user.last_name = body.last_name
    if body.phone_number is not None:
        user.phone_number = body.phone_number
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.is_superuser is not None:
        user.is_superuser = body.is_superuser
    if body.is_staff is not None:
        user.is_staff = body.is_staff
        
    if body.role_ids is not None:
        role_uuids = [uuid.UUID(rid) for rid in body.role_ids]
        role_stmt = select(Role).where(Role.id.in_(role_uuids))
        role_res = await db.execute(role_stmt)
        user.roles = list(role_res.scalars().all())
        
    await db.commit()
    await db.refresh(user)
    
    await log_activity(db, current_user.id, "UPDATE_USER", f"Updated user {user.email}")
    
    roles_data = []
    for r in user.roles:
        perms_data = [PermissionResponse(id=str(p.id), name=p.name) for p in r.permissions]
        roles_data.append(RoleResponse(id=str(r.id), name=r.name, permissions=perms_data))
 
    return UserCRUDResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        is_staff=user.is_staff,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        roles=roles_data
    )

@router.post("/{user_id}/confirm-delete")
async def delete_user(
    user_id: str,
    confirmation: DeleteConfirmation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("users:delete")),
):
    if current_user.is_staff and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff members cannot delete users"
        )

    if not verify_password(confirmation.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password confirmation"
        )
        
    target_uuid = uuid.UUID(user_id)
    if current_user.id == target_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self deletion is not permitted"
        )

    stmt = select(User).where(User.id == target_uuid)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    email = user.email
    await db.delete(user)
    await db.commit()
    
    await log_activity(db, current_user.id, "DELETE_USER", f"Deleted user {email}")
    return {"success": True}

@router.post("/{user_id}/change-password")
async def change_user_password(
    user_id: str,
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_permission("users:update")),
):
    if not verify_password(body.admin_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password confirmation"
        )
        
    stmt = select(User).where(User.id == uuid.UUID(user_id))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    
    await log_activity(db, current_user.id, "CHANGE_USER_PASSWORD", f"Changed password for user {user.email}")
    return {"success": True}
