import asyncio
from app.core.database import engine, Base
from app.models.auth import User, Role, Permission

async def recreate_and_seed():
    from app.core.database import SessionLocal
    from app.core.security import hash_password

    async with SessionLocal() as db:
        admin_email = "admin@worklyn.dev"
        admin_pass = "admin123"
        
        perms = [
            Permission(name="users:read"),
            Permission(name="users:create"),
            Permission(name="users:update"),
            Permission(name="users:delete"),
            Permission(name="roles:read"),
            Permission(name="roles:create"),
            Permission(name="roles:update"),
            Permission(name="roles:delete"),
            Permission(name="projects:read"),
            Permission(name="projects:create"),
            Permission(name="projects:update"),
            Permission(name="projects:delete"),
        ]
        db.add_all(perms)
        await db.commit()
        
        admin_role = Role(name="admin", permissions=perms)
        member_role = Role(name="member", permissions=[])
        db.add_all([admin_role, member_role])
        await db.commit()
        
        new_user = User(
            email=admin_email,
            hashed_password=hash_password(admin_pass),
            is_active=True,
            is_superuser=True,
            first_name="Admin",
            last_name="Superuser",
            phone_number="1234567890",
            roles=[admin_role]
        )
        db.add(new_user)
        await db.commit()
        print(f"Superuser seeded successfully. Email: {admin_email}, Password: {admin_pass}")

if __name__ == "__main__":
    asyncio.run(recreate_and_seed())
