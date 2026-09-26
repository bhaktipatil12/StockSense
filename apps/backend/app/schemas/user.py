from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    login: str
    email: EmailStr
    name: str = ""
    role: str = "manager"


class UserCreate(UserBase):
    password: str = Field(..., min_length=9)

    @field_validator("login")
    @classmethod
    def valid_login(cls, value: str) -> str:
        if not 6 <= len(value) <= 12 or not value.replace("_", "").isalnum():
            raise ValueError("Login ID must be 6 to 12 letters, numbers, or underscores")
        return value

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        if not any(char.islower() for char in value) or not any(char.isupper() for char in value) or not any(not char.isalnum() for char in value):
            raise ValueError("Password must include uppercase, lowercase, and a symbol")
        return value


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserResponse(UserBase):
    id: str
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    login: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=9)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return UserCreate.strong_password(value)


class PasswordResetResponse(BaseModel):
    message: str
    otp: Optional[str] = None  # Only in dev mode
