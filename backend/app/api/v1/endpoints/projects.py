import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.project_task import Project
from app.schemas.project_task import ProjectCreate, ProjectUpdate, ProjectResponse
from app.api.v1.endpoints.history import log_activity

router = APIRouter()

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ProjectResponse]:
    stmt = select(Project).options(selectinload(Project.owner)).order_by(Project.created_at.desc())
    res = await db.execute(stmt)
    projects = res.scalars().all()
    return list(projects)

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ProjectResponse:
    new_project = Project(
        name=body.name,
        description=body.description,
        owner_id=current_user.id
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    # Reload with owner details
    stmt = select(Project).options(selectinload(Project.owner)).where(Project.id == new_project.id)
    res = await db.execute(stmt)
    project = res.scalar_one()
    
    await log_activity(db, current_user.id, "CREATE_PROJECT", f"Created project {project.name}")
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ProjectResponse:
    pid = uuid.UUID(project_id)
    stmt = select(Project).options(selectinload(Project.owner)).where(Project.id == pid)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ProjectResponse:
    pid = uuid.UUID(project_id)
    stmt = select(Project).options(selectinload(Project.owner)).where(Project.id == pid)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
        
    await db.commit()
    await db.refresh(project)
    await log_activity(db, current_user.id, "UPDATE_PROJECT", f"Updated project {project.name}")
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pid = uuid.UUID(project_id)
    stmt = select(Project).where(Project.id == pid)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    name = project.name
    await db.delete(project)
    await db.commit()
    await log_activity(db, current_user.id, "DELETE_PROJECT", f"Deleted project {name}")
    return {"success": True}
