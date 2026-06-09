from fastapi import Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    """
    Base exception class for all custom application errors.
    """

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    """
    Raised when a requested database or system resource is not found.
    """

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(AppException):
    """
    Raised when user fails authentication checks.
    """

    def __init__(self, message: str = "Unauthorized access") -> None:
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Formats response structure for custom application exceptions.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "status": "error"},
    )
