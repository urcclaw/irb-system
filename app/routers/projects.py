from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
import os
import shutil

from ..models import Project, User, AuditLog
from .auth import get_current_user
from ..database import SessionLocal

router = APIRouter(prefix="/projects", tags=["projects"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[User, Depends(get_current_user)]

class ProjectCreate(BaseModel):
    title: str
    irb_number: str
    approval_date: datetime
    expiry_date: datetime

def create_audit_log(db: Session, user_id: int, action: str, target_id: str, details: str):
    log = AuditLog(user_id=user_id, action=action, target_id=target_id, details=details)
    db.add(log)
    db.commit()

# 1. สร้างโครงการใหม่
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, db: db_dependency, current_user: user_dependency):
    new_project = Project(
        title=project_data.title,
        irb_number=project_data.irb_number,
        approval_date=project_data.approval_date,
        expiry_date=project_data.expiry_date,
        owner_id=current_user.id,
        status="pending"
    )
    if db.query(Project).filter(Project.irb_number == project_data.irb_number).first():
        raise HTTPException(status_code=400, detail="IRB number already exists")

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    create_audit_log(db, current_user.id, "CREATE_PROJECT", str(new_project.id), f"Created project: {new_project.title}")
    return new_project

# 2. ดูรายการโครงการของตัวเอง
@router.get("/")
async def get_my_projects(db: db_dependency, current_user: user_dependency):
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return projects

# 3. อัปโหลดไฟล์ PDF
@router.post("/{project_id}/upload", status_code=status.HTTP_200_OK)
async def upload_project_document(
    project_id: int,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you don't have permission")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"project_{project.id}_{project.irb_number}{file_extension}"
    file_path = f"uploads/{safe_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    project.document_path = file_path
    db.commit()
    db.refresh(project)

    create_audit_log(db, current_user.id, "UPLOAD_DOC", str(project.id), f"Uploaded file: {safe_filename}")
    return {"message": "File uploaded successfully", "file_path": file_path}

# 4. ดึงไฟล์ PDF ของตัวเอง (สำหรับผู้วิจัย)
@router.get("/{project_id}/document", status_code=status.HTTP_200_OK)
async def get_my_project_document(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ หรือคุณไม่มีสิทธิ์เข้าถึง")
    if not project.document_path or not os.path.exists(project.document_path):
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์เอกสารสำหรับโครงการนี้")

    return FileResponse(
        path=project.document_path, 
        media_type='application/pdf', 
        filename=os.path.basename(project.document_path)
    )