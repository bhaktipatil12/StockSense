from sqlalchemy import Column, String, Boolean, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    login = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, default="")
    role = Column(String, nullable=False, default="manager")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_operations = relationship("Operation", foreign_keys="Operation.creator_id", back_populates="creator")
    responsible_operations = relationship("Operation", foreign_keys="Operation.responsible_id", back_populates="responsible")
    movements = relationship("StockMovement", back_populates="actor")
    
    __table_args__ = (
        CheckConstraint("role IN ('manager', 'staff')", name="check_user_role"),
    )


class PasswordResetChallenge(Base):
    __tablename__ = "password_reset_challenges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(String, default="0")
    consumed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
