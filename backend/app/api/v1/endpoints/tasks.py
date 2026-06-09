import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.project_task import Task, Project
from app.schemas.project_task import TaskCreate, TaskUpdate, TaskResponse
from app.api.v1.endpoints.history import log_activity

router = APIRouter()

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    project_id: Optional[str] = None,
    assignee_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[TaskResponse]:
    stmt = select(Task).options(selectinload(Task.assignee))
    
    if project_id:
        pid = uuid.UUID(project_id)
        stmt = stmt.where(Task.project_id == pid)
        
    if assignee_id:
        aid = uuid.UUID(assignee_id)
        stmt = stmt.where(Task.assignee_id == aid)
        
    stmt = stmt.order_by(Task.created_at.asc())
    res = await db.execute(stmt)
    tasks = res.scalars().all()
    return list(tasks)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> TaskResponse:
    p_stmt = select(Project).where(Project.id == body.project_id)
    p_res = await db.execute(p_stmt)
    project = p_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_task = Task(
        project_id=body.project_id,
        title=body.title,
        description=body.description,
        status=body.status or "todo",
        priority=body.priority or "medium",
        due_date=body.due_date,
        assignee_id=body.assignee_id
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    
    stmt = select(Task).options(selectinload(Task.assignee)).where(Task.id == new_task.id)
    res = await db.execute(stmt)
    task = res.scalar_one()
    
    await log_activity(db, current_user.id, "CREATE_TASK", f"Created task '{task.title}' in project '{project.name}'")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> TaskResponse:
    tid = uuid.UUID(task_id)
    stmt = select(Task).options(selectinload(Task.assignee)).where(Task.id == tid)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.status is not None:
        task.status = body.status
    if body.priority is not None:
        task.priority = body.priority
    if body.due_date is not None:
        # Pydantic may pass due_date as timezone-aware, strip it to match SQLite/Postgres local DateTime storage
        task.due_date = body.due_date.replace(tzinfo=None) if body.due_date else None
    if body.assignee_id is not None:
        task.assignee_id = body.assignee_id
        
    await db.commit()
    await db.refresh(task)
    
    stmt = select(Task).options(selectinload(Task.assignee)).where(Task.id == task.id)
    res = await db.execute(stmt)
    task = res.scalar_one()
    
    await log_activity(db, current_user.id, "UPDATE_TASK", f"Updated task '{task.title}'")
    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tid = uuid.UUID(task_id)
    stmt = select(Task).where(Task.id == tid)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    title = task.title
    await db.delete(task)
    await db.commit()
    await log_activity(db, current_user.id, "DELETE_TASK", f"Deleted task '{title}'")
    return {"success": True}
