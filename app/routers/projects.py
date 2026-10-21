from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os, shutil
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
    review_type: str

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, db: db_dependency, current_user: user_dependency):
    new_project = Project(
        title=project_data.title, 
        review_type=project_data.review_type, 
        owner_id=current_user.id, 
        status="pending_docs"
    )
    db.add(new_project); db.commit(); db.refresh(new_project)
    return new_project

@router.get("/")
async def get_my_projects(db: db_dependency, current_user: user_dependency):
    return db.query(Project).filter(Project.owner_id == current_user.id).all()

@router.post("/{project_id}/upload/{doc_type}", status_code=status.HTTP_200_OK)
async def upload_project_document(
    project_id: int, doc_type: str, file: UploadFile = File(...), 
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project: raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    if file.content_type != "application/pdf": raise HTTPException(status_code=400, detail="รับเฉพาะไฟล์ PDF")

    valid_docs = ['doc_proposal', 'doc_submission_form', 'doc_ethics_form', 'doc_self_assessment',
                  'doc_consent_form', 'doc_info_sheet', 'doc_coi_form', 'doc_researcher_cv',
                  'doc_renewal_form', 'doc_closure_form']
    if doc_type not in valid_docs: raise HTTPException(status_code=400, detail="ประเภทเอกสารไม่ถูกต้อง")

    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{project.id}_{doc_type}{file_extension}"
    file_path = f"uploads/{safe_filename}"

    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)

    setattr(project, doc_type, file_path)
    db.commit()
    return {"message": f"อัปโหลด {doc_type} สำเร็จ"}

@router.get("/{project_id}/document/{doc_type}", status_code=status.HTTP_200_OK)
async def get_my_project_document(project_id: int, doc_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project: raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    file_path = getattr(project, doc_type, None)
    if not file_path or not os.path.exists(file_path): raise HTTPException(status_code=404, detail="ไม่พบไฟล์")
    return FileResponse(path=file_path, media_type='application/pdf', filename=os.path.basename(file_path))