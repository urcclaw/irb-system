from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.responses import FileResponse
from ..models import Project, User, AuditLog
from ..database import SessionLocal
from .auth import get_current_user
import os

router = APIRouter(prefix='/admin', tags=['admin'])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[User, Depends(get_current_user)]

def check_if_irb_or_admin(user: User):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    if user.role not in ['irb_officer', 'admin']:
        raise HTTPException(status_code=403, detail='You must be an IRB Officer or Admin to visit this page')

def create_audit_log(db: Session, user_id: int, action: str, target_id: str, details: str):
    log = AuditLog(user_id=user_id, action=action, target_id=target_id, details=details)
    db.add(log)
    db.commit()

@router.get("/projects", status_code=status.HTTP_200_OK)
def read_all_projects(user: user_dependency, db: db_dependency):
    check_if_irb_or_admin(user)
    projects = db.query(Project).all()
    result = []
    for p in projects:
        owner = db.query(User).filter(User.id == p.owner_id).first()
        result.append({
            "id": p.id, "title": p.title, "irb_number": p.irb_number,
            "status": p.status, "document_path": p.document_path,
            "owner_name": f"{owner.first_name} {owner.last_name}" if owner else "Unknown"
        })
    return result

@router.put("/projects/{project_id}/approve", status_code=status.HTTP_200_OK)
def approve_project(user: user_dependency, db: db_dependency, project_id: int = Path(gt=0)):
    check_if_irb_or_admin(user)
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail='Project not found.')
    if project.owner_id == user.id:
        raise HTTPException(status_code=403, detail='คุณไม่สามารถอนุมัติโครงการของคุณเองได้')

    project.status = "approved"
    db.commit()
    db.refresh(project)

    create_audit_log(db, user.id, "APPROVE_PROJECT", str(project.id), f"Approved project: {project.title}")
    return {"message": f"Project {project_id} approved successfully", "status": project.status}

@router.get("/users", status_code=status.HTTP_200_OK)
def read_all_users(user: user_dependency, db: db_dependency):
    check_if_irb_or_admin(user)
    return db.query(User).all()

# ดึงไฟล์ PDF สำหรับเจ้าหน้าที่ IRB
@router.get("/projects/{project_id}/document", status_code=status.HTTP_200_OK)
def get_project_document(user: user_dependency, db: db_dependency, project_id: int = Path(gt=0)):
    check_if_irb_or_admin(user)
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail='Project not found.')
    if not project.document_path or not os.path.exists(project.document_path):
        raise HTTPException(status_code=404, detail='No document attached or file not found.')

    return FileResponse(
        path=project.document_path, 
        media_type='application/pdf', 
        filename=os.path.basename(project.document_path)
    )