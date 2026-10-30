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
    review_type: str

# ✅ ฟังก์ชันสร้าง REC Number อัตโนมัติ
def generate_rec_number(db: Session):
    current_year_th = datetime.now().year + 543
    year_short = str(current_year_th)[-2:]
    last_rec = db.query(Project).filter(Project.rec_number.like(f"REC %/{year_short}")).order_by(Project.rec_number.desc()).first()
    
    if last_rec and last_rec.rec_number:
        try:
            last_number = int(last_rec.rec_number.split('/')[0].replace('REC ', ''))
            new_number = last_number + 1
        except:
            new_number = 1
    else:
        new_number = 1
    
    return f"REC {new_number}/{year_short}"

# ✅ ฟังก์ชันสร้างโฟลเดอร์ตาม REC
def get_project_folder(project: Project, version: int = 1):
    year = datetime.now().year + 543
    rec_code = project.rec_number.replace(' ', '-').replace('/', '-') if project.rec_number else f"TEMP-{project.id}"
    folder_path = f"uploads/{year}/{rec_code}/v{version}"
    os.makedirs(folder_path, exist_ok=True)
    return folder_path

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, db: db_dependency, current_user: user_dependency):
    new_project = Project(
        title=project_data.title, 
        review_type=project_data.review_type, 
        owner_id=current_user.id, 
        status="pending_docs"
    )
    
    # ✅ สร้าง REC Number ทันทีที่สร้างโครงการ
    new_project.rec_number = generate_rec_number(db)
    
    db.add(new_project); db.commit(); db.refresh(new_project)
    
    # สร้างโฟลเดอร์เริ่มต้น
    get_project_folder(new_project, version=1)
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

    # ✅ กำหนดเวอร์ชันตามสถานะ
    version = 1
    if project.status == 'needs_revision':
        version = 2
    
    folder_path = get_project_folder(project, version)
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{doc_type}{file_extension}"
    file_path = os.path.join(folder_path, safe_filename)

    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)

    setattr(project, doc_type, file_path)
    db.commit()
    return {"message": f"อัปโหลด {doc_type} สำเร็จ", "path": file_path}

@router.get("/{project_id}/document/{doc_type}", status_code=status.HTTP_200_OK)
async def get_my_project_document(project_id: int, doc_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project: raise HTTPException(status_code=404, detail="ไม่พบโครงการ")
    file_path = getattr(project, doc_type, None)
    if not file_path or not os.path.exists(file_path): raise HTTPException(status_code=404, detail="ไม่พบไฟล์")
    return FileResponse(path=file_path, media_type='application/pdf', filename=os.path.basename(file_path))

@router.post("/{project_id}/request/{request_type}", status_code=status.HTTP_200_OK)
async def submit_project_request(
    project_id: int, 
    request_type: str, 
    db: db_dependency, 
    current_user: user_dependency
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")

    if project.status != 'approved':
        raise HTTPException(status_code=400, detail="สามารถยื่นคำร้องได้เฉพาะโครงการที่อนุมัติแล้วเท่านั้น")

    project.status = "needs_revision"
    
    # ✅ สร้างโฟลเดอร์เวอร์ชันใหม่
    get_project_folder(project, version=2)
    
    db.add(AuditLog(
        user_id=current_user.id, 
        action=f"REQUEST_{request_type.upper()}", 
        target_id=str(project.id), 
        details=f"ผู้วิจัยยื่นคำร้อง: {request_type}"
    ))
    db.commit()
    db.refresh(project)
    
    return {"message": f"ยื่นคำร้อง {request_type} สำเร็จ", "status": project.status}