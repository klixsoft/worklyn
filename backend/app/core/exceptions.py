from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
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
        content={"success": False, "errors": {"non_field_errors": exc.message}},
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Standardizes validation error responses to key them by their failing fields.
    """
    errors = {}
    for error in exc.errors():
        loc = error.get("loc", [])
        field_name = str(loc[-1]) if loc else "non_field_errors"
        errors[field_name] = error.get("msg", "Validation error")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "errors": errors},
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Standardizes HTTP exception responses into non-field error payloads.
    """
    detail = exc.detail if isinstance(exc.detail, str) else "An error occurred"
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "errors": {"non_field_errors": detail}},
    )
