from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    generate_otp, hash_otp, verify_otp, get_current_user
)
from app.models import User, PasswordResetChallenge
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, LoginRequest, LoginResponse,
    PasswordResetRequest, PasswordResetVerify, PasswordResetResponse
)
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.login == user_data.login)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or login already exists"
        )
    
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        login=user_data.login,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return token"""
    user = db.query(User).filter((User.login == credentials.login) | (User.email == credentials.login)).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password"
        )
    
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(data={"sub": user.id})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/password-reset/request", response_model=PasswordResetResponse)
def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset OTP"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal whether email exists
        return PasswordResetResponse(
            message="If the email exists, an OTP has been sent"
        )
    
    # Generate OTP
    otp = generate_otp()
    otp_hashed = hash_otp(otp)
    
    # Create challenge
    challenge = PasswordResetChallenge(
        id=str(uuid.uuid4()),
        user_id=user.id,
        otp_hash=otp_hashed,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        attempts="0"
    )
    
    db.add(challenge)
    db.commit()
    
    # TODO: Send OTP via email
    # For dev mode, return OTP in response
    return PasswordResetResponse(
        message="OTP sent to email",
        otp=otp  # Remove this in production
    )


@router.post("/password-reset/verify", response_model=PasswordResetResponse)
def verify_password_reset(request: PasswordResetVerify, db: Session = Depends(get_db)):
    """Verify OTP and reset password"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request"
        )
    
    # Get latest challenge
    challenge = db.query(PasswordResetChallenge).filter(
        PasswordResetChallenge.user_id == user.id,
        PasswordResetChallenge.consumed == False
    ).order_by(PasswordResetChallenge.created_at.desc()).first()
    
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active reset request found"
        )
    
    # Check expiry
    if datetime.utcnow() > challenge.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )
    
    # Check attempts
    attempts = int(challenge.attempts)
    if attempts >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts"
        )
    
    # Verify OTP
    if not verify_otp(request.otp, challenge.otp_hash):
        challenge.attempts = str(attempts + 1)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # Reset password
    user.password_hash = get_password_hash(request.new_password)
    challenge.consumed = True
    
    db.commit()
    
    return PasswordResetResponse(message="Password reset successful")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_current_user(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.name is None or not data.name.strip():
        raise HTTPException(status_code=400, detail="Display name is required")
    current_user.name = data.name.strip()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout():
    """Logout user (client should delete token)"""
    return {"message": "Logged out successfully"}
