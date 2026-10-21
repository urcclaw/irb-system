from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
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

def check_permission(user: User, allowed_roles: list):
    if not user or user.role not in allowed_roles: raise HTTPException(status_code=403, detail='Permission denied')

@router.get("/projects", status_code=status.HTTP_200_OK)
def read_all_projects(user: user_dependency, db: db_dependency):
    check_permission(user, ['irb_officer', 'committee', 'admin'])
    projects = db.query(Project).all()
    result = []
    for p in projects:
        owner = db.query(User).filter(User.id == p.owner_id).first()
        docs = {
            "doc_proposal": bool(p.doc_proposal), "doc_submission_form": bool(p.doc_submission_form),
            "doc_ethics_form": bool(p.doc_ethics_form), "doc_self_assessment": bool(p.doc_self_assessment),
            "doc_consent_form": bool(p.doc_consent_form), "doc_info_sheet": bool(p.doc_info_sheet),
            "doc_coi_form": bool(p.doc_coi_form), "doc_researcher_cv": bool(p.doc_researcher_cv),
            "doc_renewal_form": bool(p.doc_renewal_form), "doc_closure_form": bool(p.doc_closure_form)
        }
        result.append({
            "id": p.id, "title": p.title, "irb_number": p.irb_number,
            "review_type": p.review_type, "status": p.status,
            "approval_date": p.approval_date, "expiry_date": p.expiry_date,
            "certificate_path": p.certificate_path,
            "owner_name": f"{owner.first_name} {owner.last_name}" if owner else "Unknown",
            "docs": docs
        })
    return result

class ProjectAdminUpdate(BaseModel):
    irb_number: str
    approval_date: datetime
    expiry_date: datetime

@router.put("/projects/{project_id}/update", status_code=status.HTTP_200_OK)
def update_project_admin(user: user_dependency, db: db_dependency, project_id: int, data: ProjectAdminUpdate):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    project.irb_number = data.irb_number
    project.approval_date = data.approval_date
    project.expiry_date = data.expiry_date
    db.commit()
    return {"message": "อัปเดตข้อมูลโครงการสำเร็จ"}

@router.put("/projects/{project_id}/forward", status_code=status.HTTP_200_OK)
def forward_to_committee(user: user_dependency, db: db_dependency, project_id: int):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    project.status = "forwarded"
    db.commit()
    return {"message": "ส่งต่อเรียบร้อย"}

class ReviewDecision(BaseModel):
    decision: str
    certificate_url: str = None

@router.put("/projects/{project_id}/review", status_code=status.HTTP_200_OK)
def review_project(user: user_dependency, db: db_dependency, project_id: int, decision: ReviewDecision):
    check_permission(user, ['committee', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')

    project.status = decision.decision
    if decision.decision == "approved":
        project.certificate_path = decision.certificate_url
    db.commit()
    return {"message": f"บันทึกผล: {decision.decision}"}

@router.get("/projects/{project_id}/document/{doc_type}", status_code=status.HTTP_200_OK)
def get_project_document(user: user_dependency, db: db_dependency, project_id: int, doc_type: str):
    check_permission(user, ['irb_officer', 'committee', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    file_path = getattr(project, doc_type, None)
    if not file_path or not os.path.exists(file_path): raise HTTPException(status_code=404, detail='File not found')
    return FileResponse(path=file_path, media_type='application/pdf', filename=os.path.basename(file_path))