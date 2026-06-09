from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, UserResponse

router = APIRouter()

MOCK_USERS = {
    "admin@worklyn.dev": {
        "id": "1",
        "email": "admin@worklyn.dev",
        "password": "password123",
        "role": "admin",
        "permissions": ["*"],
    },
    "member@worklyn.dev": {
        "id": "2",
        "email": "member@worklyn.dev",
        "password": "password123",
        "role": "member",
        "permissions": ["view_dashboard", "view_projects", "create_projects"],
    },
    "viewer@worklyn.dev": {
        "id": "3",
        "email": "viewer@worklyn.dev",
        "password": "password123",
        "role": "viewer",
        "permissions": ["view_dashboard", "view_projects"],
    },
}


@router.post("/login", response_model=UserResponse)
def login(credentials: LoginRequest) -> UserResponse:
    """
    Validates user credentials and returns the user's role and permission metadata.
    """
    user = MOCK_USERS.get(credentials.email.lower())
    if not user or user["password"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        permissions=user["permissions"],
    )
