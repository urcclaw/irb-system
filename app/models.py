from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
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

    # ✅ เพิ่ม 3 ฟิลด์สำหรับข้อมูลใบรับรอง
    department = Column(String, nullable=True)   # หน่วยงาน/แผนก
    position = Column(String, nullable=True)     # ตำแหน่ง
    hospital = Column(String, nullable=True)     # โรงพยาบาล/สังกัด

    projects = relationship("Project", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")
    reviews = relationship("CommitteeReview", back_populates="reviewer")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    irb_number = Column(String, unique=True, index=True, nullable=True)
    rec_number = Column(String, unique=True, nullable=True)
    review_type = Column(String, default="exempt")
    status = Column(String, default="pending_docs")
    approval_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)

    # เอกสาร 10 ประเภท (มีเพียงครั้งเดียว)
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
    secretary_summary = Column(Text, nullable=True)

    # คอลัมน์สำหรับการตัดสินใจขั้นสุดท้ายของเจ้าหน้าที่ IRB
    final_decision = Column(String, nullable=True)
    final_decision_reason = Column(Text, nullable=True)
    final_decision_date = Column(DateTime, nullable=True)
    secretary_final_summary = Column(Text, nullable=True)

    # คอลัมน์เพิ่มเติมจาก PDF แบบฟอร์ม
    final_medical_device_risk = Column(String, nullable=True)
    final_medical_device_registered = Column(Boolean, default=False)
    final_medical_device_not_registered = Column(Boolean, default=False)
    final_overall_risk = Column(String, nullable=True)
    final_follow_up_months = Column(Integer, nullable=True)
    final_other_suggestions = Column(Text, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    owner = relationship("User", back_populates="projects")
    reviews = relationship("CommitteeReview", back_populates="project")


class CommitteeReview(Base):
    __tablename__ = "committee_reviews"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    decision = Column(String, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # คอลัมน์ใหม่สำหรับแบบประเมิน 44 ข้อ
    assessment_details = Column(JSONB, nullable=True)
    medical_device_risk = Column(String, nullable=True)
    medical_device_registered = Column(Boolean, default=False)
    medical_device_not_registered = Column(Boolean, default=False)
    overall_risk = Column(String, nullable=True)
    follow_up_months = Column(Integer, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    project = relationship("Project", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    target_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class DocumentTemplate(Base):
    __tablename__ = "document_templates"
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String, nullable=False)
    html_layout = Column(Text, nullable=False)
    fields_json = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)