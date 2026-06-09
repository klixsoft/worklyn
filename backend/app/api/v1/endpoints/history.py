import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.history import AuditLog

async def log_activity(db: AsyncSession, user_id: uuid.UUID, action: str, details: str):
    log = AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    await db.commit()
