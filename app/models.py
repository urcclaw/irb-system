from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String)
    
    # เปลี่ยน Role เป็น pi, irb_officer, admin
    role = Column(String, default="pi") 
    
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True) # สำหรับ MFA ในอนาคต
    
    # ความสัมพันธ์
    projects = relationship("Project", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False) 
    irb_number = Column(String, unique=True, index=True, nullable=False) 
    approval_date = Column(DateTime, nullable=False) 
    expiry_date = Column(DateTime, nullable=False) 
    
    # สถานะ: pending, approved, suspended, completed
    status = Column(String, default="pending") 
    document_path = Column(String, nullable=True) # เก็บ path ของไฟล์ PDF
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="projects")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False) 
    target_id = Column(String, nullable=True) 
    details = Column(Text, nullable=True) 
    timestamp = Column(DateTime, default=datetime.utcnow) 

    user = relationship("User", back_populates="audit_logs")