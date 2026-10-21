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
    role = Column(String, default="pi") 
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True)
    
    projects = relationship("Project", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False) 
    irb_number = Column(String, unique=True, index=True, nullable=True)
    review_type = Column(String, default="exempt")
    status = Column(String, default="pending_docs") 
    
    approval_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    
    # ฟิลด์สำหรับเก็บไฟล์เอกสารทั้ง 10 ประเภท
    doc_proposal = Column(String, nullable=True)
    doc_submission_form = Column(String, nullable=True)
    doc_ethics_form = Column(String, nullable=True)
    doc_self_assessment = Column(String, nullable=True)
    doc_consent_form = Column(String, nullable=True)
    doc_info_sheet = Column(String, nullable=True)
    doc_coi_form = Column(String, nullable=True)
    doc_researcher_cv = Column(String, nullable=True)
    doc_renewal_form = Column(String, nullable=True)
    doc_closure_form = Column(String, nullable=True)
    certificate_path = Column(String, nullable=True)
    
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