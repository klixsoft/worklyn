import asyncio
from app.core.database import engine, Base
from app.models.auth import User, Role, Permission

async def recreate_and_seed():
    async with engine.begin() as conn:
        # Drop all tables first
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables (will include the new is_superuser column)
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables recreated successfully.")

    from app.core.database import SessionLocal
    from app.core.security import hash_password

    async with SessionLocal() as db:
        admin_email = "admin@worklyn.dev"
        admin_pass = "admin123"
        
        new_user = User(
            email=admin_email,
            hashed_password=hash_password(admin_pass),
            is_active=True,
            is_superuser=True,
            first_name="Admin",
            last_name="Superuser",
            phone_number="1234567890"
        )
        db.add(new_user)
        await db.commit()
        print(f"Superuser seeded successfully. Email: {admin_email}, Password: {admin_pass}")

if __name__ == "__main__":
    asyncio.run(recreate_and_seed())
