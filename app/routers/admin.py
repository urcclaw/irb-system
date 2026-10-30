from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..models import Project, User, AuditLog, CommitteeReview, DocumentTemplate, SystemSetting
from ..database import SessionLocal
from .auth import get_current_user
import os, io, shutil, json
from xhtml2pdf import pisa
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, Frame, Table, TableStyle, SimpleDocTemplate, Spacer
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER

router = APIRouter(prefix='/admin', tags=['admin'])

# ลงทะเบียนฟอนต์และตราครุฑ
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
font_path = os.path.join(base_dir, 'THSarabunNew.ttf')
garuda_path = os.path.join(base_dir, 'garuda.png')

try: 
    pdfmetrics.registerFont(TTFont('THSarabun', font_path))
except: 
    pass

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[User, Depends(get_current_user)]

def check_permission(user: User, allowed_roles: list):
    if not user or user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail='Permission denied')

def create_audit_log(db: Session, user_id: int, action: str, target_id: str, details: str):
    db.add(AuditLog(user_id=user_id, action=action, target_id=target_id, details=details))
    db.commit()

# ✅ ฟังก์ชันดึงค่าตั้งต้น
def get_setting_value(db: Session, key: str, default: str = ""):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return setting.value if setting else default

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

# ==========================================
# 1. จัดการโครงการ
# ==========================================

@router.get("/projects", status_code=status.HTTP_200_OK)
def read_all_projects(user: user_dependency, db: db_dependency):
    check_permission(user, ['irb_officer', 'committee', 'admin'])
    projects = db.query(Project).all()
    result = []
    for p in projects:
        owner = db.query(User).filter(User.id == p.owner_id).first()
        docs = {k: bool(getattr(p, k)) for k in ['doc_proposal', 'doc_submission_form', 'doc_ethics_form', 'doc_self_assessment', 'doc_consent_form', 'doc_info_sheet', 'doc_coi_form', 'doc_researcher_cv', 'doc_renewal_form', 'doc_closure_form']}
        
        reviews = db.query(CommitteeReview).filter(CommitteeReview.project_id == p.id).all()
        review_list = [
            {
                "reviewer_id": r.reviewer_id, 
                "reviewer_name": f"{r.reviewer.first_name} {r.reviewer.last_name}", 
                "decision": r.decision, 
                "comments": r.comments
            } for r in reviews
        ]
        
        result.append({
            "id": p.id, "title": p.title, "irb_number": p.irb_number, "rec_number": p.rec_number,
            "review_type": p.review_type, "status": p.status,
            "approval_date": p.approval_date, "expiry_date": p.expiry_date,
            "certificate_path": p.certificate_path, "secretary_summary": p.secretary_summary,
            "owner_name": f"{owner.first_name} {owner.last_name}" if owner else "Unknown",
            "docs": docs, "reviews": review_list
        })
    return result

class ProjectAdminUpdate(BaseModel):
    irb_number: str = None
    approval_date: datetime
    expiry_date: datetime

@router.put("/projects/{project_id}/update", status_code=status.HTTP_200_OK)
def update_project_admin(user: user_dependency, db: db_dependency, project_id: int, data: ProjectAdminUpdate):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    if data.irb_number: project.irb_number = data.irb_number
    if not project.rec_number: project.rec_number = generate_rec_number(db)
    
    project.approval_date = data.approval_date
    project.expiry_date = data.expiry_date
    db.commit()
    
    get_project_folder(project, version=1)
    
    create_audit_log(db, user.id, "UPDATE_PROJECT_INFO", str(project.id), f"Updated REC: {project.rec_number}")
    return {"message": f"อัปเดตข้อมูลสำเร็จ (REC: {project.rec_number})", "rec_number": project.rec_number}

@router.put("/projects/{project_id}/forward", status_code=status.HTTP_200_OK)
def forward_to_committee(user: user_dependency, db: db_dependency, project_id: int):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    project.status = "forwarded"
    db.commit()
    return {"message": "ส่งต่อเรียบร้อย"}

# ✅ API อนุมัติแบบยกเว้น
class ExemptApproval(BaseModel):
    approval_date: datetime
    expiry_date: datetime

@router.post("/projects/{project_id}/approve-exempt", status_code=status.HTTP_200_OK)
def approve_exempt(user: user_dependency, db: db_dependency, project_id: int, data: ExemptApproval):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    if project.status not in ['pending_docs', 'under_review']:
        raise HTTPException(status_code=400, detail='โครงการนี้ไม่อยู่ในสถานะที่สามารถอนุมัติแบบยกเว้นได้')
    
    project.status = "approved"
    project.approval_date = data.approval_date
    project.expiry_date = data.expiry_date
    db.commit()
    
    get_project_folder(project, version=1)
    
    create_audit_log(db, user.id, "APPROVE_EXEMPT", str(project.id), f"Approved exempt for {project.rec_number}")
    return {"message": f"อนุมัติแบบยกเว้นสำเร็จ (REC: {project.rec_number})"}

# ==========================================
# 2. กรรมการพิจารณา
# ==========================================

class CommitteeComment(BaseModel):
    decision: str
    comments: str

@router.post("/projects/{project_id}/comment", status_code=status.HTTP_201_CREATED)
def submit_committee_comment(user: user_dependency, db: db_dependency, project_id: int, data: CommitteeComment):
    check_permission(user, ['committee'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    existing = db.query(CommitteeReview).filter(
        CommitteeReview.project_id == project_id, 
        CommitteeReview.reviewer_id == user.id
    ).first()
    
    if existing:
        existing.decision = data.decision
        existing.comments = data.comments
        existing.created_at = datetime.utcnow()
    else:
        new_review = CommitteeReview(
            project_id=project_id, reviewer_id=user.id,
            decision=data.decision, comments=data.comments
        )
        db.add(new_review)
    
    db.commit()
    return {"message": "บันทึกความเห็นส่วนตัวเรียบร้อย"}

class SecretarySummary(BaseModel):
    summary: str
    final_decision: str

@router.put("/projects/{project_id}/summary", status_code=status.HTTP_200_OK)
def summarize_reviews(user: user_dependency, db: db_dependency, project_id: int, data: SecretarySummary):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')

    project.secretary_summary = data.summary
    project.status = data.final_decision 
    if data.final_decision == "approved":
        project.certificate_path = f"certificate_{project.id}.pdf"
        
    db.commit()
    return {"message": f"เลขาสรุปผลเป็น: {data.final_decision}"}

# ==========================================
# 3. จัดการเอกสาร
# ==========================================

@router.get("/projects/{project_id}/document/{doc_type}", status_code=status.HTTP_200_OK)
def get_project_document(user: user_dependency, db: db_dependency, project_id: int, doc_type: str):
    check_permission(user, ['irb_officer', 'committee', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    file_path = getattr(project, doc_type, None)
    if not file_path or not os.path.exists(file_path): raise HTTPException(status_code=404, detail='File not found')
    return FileResponse(path=file_path, media_type='application/pdf', filename=os.path.basename(file_path))

@router.post("/projects/{project_id}/upload-certificate", status_code=status.HTTP_200_OK)
async def upload_signed_certificate(
    project_id: int, file: UploadFile = File(...), 
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    if file.content_type != "application/pdf": raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    folder_path = get_project_folder(project, version=1)
    file_path = os.path.join(folder_path, "certificate_signed.pdf")
    
    with open(file_path, "wb") as buffer: 
        shutil.copyfileobj(file.file, buffer)

    project.certificate_path = file_path
    db.commit()
    create_audit_log(db, user.id, "UPLOAD_CERT", str(project.id), f"Uploaded signed certificate")
    return {"message": "อัปโหลดใบรับรองสำเร็จ", "path": file_path}

# ==========================================
# 4. พิมพ์ใบรับรอง (Certificate)
# ==========================================

@router.get("/projects/{project_id}/certificate", status_code=status.HTTP_200_OK)
def generate_certificate(user: user_dependency, db: db_dependency, project_id: int):
    check_permission(user, ['irb_officer', 'committee', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Project not found')
    if project.status != 'approved': raise HTTPException(status_code=400, detail='โครงการยังไม่ได้รับการอนุมัติ')

    president_name = get_setting_value(db, "president_name", "นางสาวมาณิดา พิทักษ์")
    hospital_name = get_setting_value(db, "hospital_name", "โรงพยาบาลมะเร็งลพบุรี")
    committee_name = get_setting_value(db, "committee_name", "คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")
    
    owner = db.query(User).filter(User.id == project.owner_id).first()
    owner_name = f"{owner.first_name} {owner.last_name}" if owner else "ไม่ระบุ"

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    try:
        if os.path.exists(garuda_path):
            p.drawImage(ImageReader(garuda_path), (width - 85) / 2, height - 130, width=85, height=85, mask='auto')
    except: pass

    p.setFont("THSarabun", 24)
    p.drawCentredString(width / 2, height - 180, "หนังสือรับรองการอนุมัติโครงการวิจัย")
    p.setFont("THSarabun", 18)
    p.drawCentredString(width / 2, height - 210, committee_name)
    p.drawCentredString(width / 2, height - 240, hospital_name)
    p.line(50, height - 260, width - 50, height - 260)

    p.setFont("THSarabun", 16)
    p.drawString(50, height - 300, f"ชื่อโครงการ: {project.title}")
    p.drawString(50, height - 330, f"เลขที่ REC: {project.rec_number or '-'}")
    p.drawString(50, height - 360, f"ผู้วิจัยหลัก: {owner_name}")
    p.drawString(50, height - 390, f"วันที่อนุมัติ: {project.approval_date.strftime('%d/%m/%Y') if project.approval_date else '-'}")
    p.drawString(50, height - 420, f"วันหมดอายุ: {project.expiry_date.strftime('%d/%m/%Y') if project.expiry_date else '-'}")

    p.drawString(50, height - 480, "ขอรับรองว่าโครงการวิจัยข้างต้น ได้ผ่านการพิจารณาและอนุมัติ")
    p.drawString(50, height - 500, "จากคณะกรรมการจริยธรรมการวิจัยในคนแล้ว")

    p.drawString(50, height - 600, "ลงชื่อ ...................................................")
    p.drawString(50, height - 630, f"({president_name})")
    p.drawString(50, height - 660, f"ประธาน{committee_name}")
    p.drawString(50, height - 690, hospital_name)
    
    p.showPage(); p.save(); buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=certificate_{project.rec_number.replace('/', '-') if project.rec_number else project.id}.pdf"})

# ==========================================
# 5. ตั้งค่าระบบ (System Settings)
# ==========================================

class SettingUpdate(BaseModel):
    key: str
    value: str

@router.get("/settings")
def get_settings(user: user_dependency, db: db_dependency):
    check_permission(user, ['admin', 'irb_officer'])
    settings = db.query(SystemSetting).all()
    return {s.key: s.value for s in settings}

@router.post("/settings")
def update_setting(user: user_dependency, db: db_dependency, data: SettingUpdate):
    check_permission(user, ['admin'])
    setting = db.query(SystemSetting).filter(SystemSetting.key == data.key).first()
    if setting:
        setting.value = data.value
    else:
        setting = SystemSetting(key=data.key, value=data.value)
        db.add(setting)
    db.commit()
    return {"message": f"อัปเดต {data.key} สำเร็จ"}

# ==========================================
# 6. จัดการผู้ใช้งาน (User Management)
# ==========================================

@router.get("/users")
def get_all_users(user: user_dependency, db: db_dependency):
    check_permission(user, ['admin'])
    users = db.query(User).all()
    return [
        {
            "id": u.id, "username": u.username, "email": u.email,
            "first_name": u.first_name, "last_name": u.last_name,
            "role": u.role, "is_active": u.is_active
        } for u in users
    ]

class UserRoleUpdate(BaseModel):
    role: str

@router.put("/users/{user_id}/role")
def update_user_role(user: user_dependency, db: db_dependency, user_id: int, data: UserRoleUpdate):
    check_permission(user, ['admin'])
    target_user = db.get(User, user_id)
    if not target_user: raise HTTPException(status_code=404, detail='User not found')
    
    valid_roles = ['admin', 'irb_officer', 'committee', 'pi', 'assistant']
    if data.role not in valid_roles:
        raise HTTPException(status_code=400, detail='Invalid role')
    
    target_user.role = data.role
    db.commit()
    return {"message": f"อัปเดต Role ของ {target_user.username} เป็น {data.role} สำเร็จ"}

@router.delete("/users/{user_id}")
def delete_user(user: user_dependency, db: db_dependency, user_id: int):
    check_permission(user, ['admin'])
    target_user = db.get(User, user_id)
    if not target_user: raise HTTPException(status_code=404, detail='User not found')
    
    if target_user.id == user.id:
        raise HTTPException(status_code=400, detail='ไม่สามารถลบตัวเองได้')
    
    db.delete(target_user)
    db.commit()
    return {"message": f"ลบผู้ใช้ {target_user.username} สำเร็จ"}

# ==========================================
# 7. สำรองข้อมูล (Backup)
# ==========================================

@router.get("/backup")
def backup_database(user: user_dependency):
    check_permission(user, ['admin'])
    
    import subprocess
    from datetime import datetime
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"backup_{timestamp}.sql"
    filepath = f"/tmp/{filename}"
    
    try:
        db_host = os.getenv("DB_HOST", "db")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("POSTGRES_DB", "appdb")
        db_user = os.getenv("POSTGRES_USER", "app")
        db_pass = os.getenv("POSTGRES_PASSWORD", "secret")
        
        env = os.environ.copy()
        env["PGPASSWORD"] = db_pass
        
        subprocess.run(
            ["pg_dump", "-h", db_host, "-p", db_port, "-U", db_user, "-d", db_name, "-f", filepath],
            check=True, env=env
        )
        
        return FileResponse(path=filepath, media_type='application/sql', filename=filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

# ==========================================
# 8. นำเข้าข้อมูล (Restore) และดูข้อมูล (View Data)
# ==========================================

@router.post("/restore")
async def restore_database(user: user_dependency, file: UploadFile = File(...)):
    check_permission(user, ['admin'])
    
    if not file.filename.endswith('.sql'):
        raise HTTPException(status_code=400, detail="รับเฉพาะไฟล์ .sql เท่านั้น")
    
    temp_path = f"/tmp/restore_{datetime.now().timestamp()}.sql"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        db_host = os.getenv("DB_HOST", "db")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("POSTGRES_DB", "appdb")
        db_user = os.getenv("POSTGRES_USER", "app")
        db_pass = os.getenv("POSTGRES_PASSWORD", "secret")
        
        env = os.environ.copy()
        env["PGPASSWORD"] = db_pass
        
        # ✅ ล้างข้อมูลเก่าและนำเข้าใหม่
        subprocess.run(
            ["psql", "-h", db_host, "-p", db_port, "-U", db_user, "-d", db_name, "-c", 
             "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"],
            check=True, env=env
        )
        
        subprocess.run(
            ["psql", "-h", db_host, "-p", db_port, "-U", db_user, "-d", db_name, "-f", temp_path],
            check=True, env=env
        )
        
        os.remove(temp_path)
        return {"message": "นำเข้าข้อมูลสำเร็จ! กรุณารีเฟรชหน้าเว็บ"}
    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@router.get("/view-data/{table_name}")
def view_table_data(user: user_dependency, db: db_dependency, table_name: str):
    check_permission(user, ['admin'])
    
    allowed_tables = {
        "users": User,
        "projects": Project,
        "committee_reviews": CommitteeReview,
        "audit_logs": AuditLog,
        "document_templates": DocumentTemplate,
        "system_settings": SystemSetting
    }
    
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail="ไม่สามารถเข้าถึงตารางนี้ได้")
    
    model = allowed_tables[table_name]
    records = db.query(model).limit(100).all()
    
    result = []
    for r in records:
        row = {}
        for column in r.__table__.columns:
            val = getattr(r, column.name)
            if isinstance(val, datetime):
                val = val.strftime('%d/%m/%Y %H:%M')
            row[column.name] = val
        result.append(row)
    
    return result