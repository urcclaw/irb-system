from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..models import Project, User, AuditLog, CommitteeReview, DocumentTemplate
from ..database import SessionLocal
from .auth import get_current_user
import os
import io
import json
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

# ---------------------------------------------------------
# ลงทะเบียนฟอนต์และตราครุฑ
# ---------------------------------------------------------
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

# ==========================================
# 1. จัดการโครงการ (Projects)
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
        review_list = [{"reviewer_name": f"{r.reviewer.first_name} {r.reviewer.last_name}", "decision": r.decision, "comments": r.comments} for r in reviews]
        
        result.append({
            "id": p.id, "title": p.title, "irb_number": p.irb_number,
            "review_type": p.review_type, "status": p.status,
            "approval_date": p.approval_date, "expiry_date": p.expiry_date,
            "certificate_path": p.certificate_path, "secretary_summary": p.secretary_summary,
            "owner_name": f"{owner.first_name} {owner.last_name}" if owner else "Unknown",
            "docs": docs, "reviews": review_list
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
    create_audit_log(db, user.id, "UPDATE_PROJECT_INFO", str(project.id), f"Updated IRB info: {project.irb_number}")
    return {"message": "อัปเดตข้อมูลโครงการสำเร็จ"}

@router.put("/projects/{project_id}/forward", status_code=status.HTTP_200_OK)
def forward_to_committee(user: user_dependency, db: db_dependency, project_id: int):
    check_permission(user, ['irb_officer', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    project.status = "forwarded"
    db.commit()
    create_audit_log(db, user.id, "FORWARD_PROJECT", str(project.id), "Forwarded to committee")
    return {"message": "ส่งต่อเรียบร้อย"}

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
    create_audit_log(db, user.id, "SUBMIT_COMMENT", str(project.id), f"Committee comment: {data.decision}")
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
    create_audit_log(db, user.id, f"SECRETARY_SUMMARY_{data.final_decision.upper()}", str(project.id), f"Secretary summarized: {data.final_decision}")
    return {"message": f"เลขาสรุปผลเป็น: {data.final_decision}"}

# ==========================================
# 2. ดึงเอกสาร (Documents)
# ==========================================

@router.get("/projects/{project_id}/document/{doc_type}", status_code=status.HTTP_200_OK)
def get_project_document(user: user_dependency, db: db_dependency, project_id: int, doc_type: str):
    check_permission(user, ['irb_officer', 'committee', 'admin'])
    project = db.get(Project, project_id)
    if not project: raise HTTPException(status_code=404, detail='Not found')
    
    file_path = getattr(project, doc_type, None)
    if not file_path or not os.path.exists(file_path): raise HTTPException(status_code=404, detail='File not found')
    return FileResponse(path=file_path, media_type='application/pdf', filename=os.path.basename(file_path))

# ==========================================
# 3. สร้างหนังสือเชิญประชุม (Meeting Invitation)
# ==========================================

class MeetingInvitationRequest(BaseModel):
    doc_type: str 
    meeting_date: str 
    time_start: str
    time_end: str 
    location: str     
    agenda: str       
    doc_number: str = "" 
    doc_date: str = ""   

@router.post("/generate-meeting-invitation", status_code=status.HTTP_200_OK)
def generate_meeting_invitation(user: user_dependency, data: MeetingInvitationRequest):
    check_permission(user, ['irb_officer', 'admin'])

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    p.setFont("THSarabun", 16)

    def format_time(t_str):
        return t_str.replace(':', '.')
    time_display = f"{format_time(data.time_start)} – {format_time(data.time_end)} น."

    def draw_garuda(x, y, size):
        try:
            if os.path.exists(garuda_path):
                p.drawImage(ImageReader(garuda_path), x, y, width=size, height=size, mask='auto')
        except Exception as e:
            print(f"Error drawing Garuda: {e}")

    styles = getSampleStyleSheet()
    style = ParagraphStyle(name='ThaiStyle', fontName='THSarabun', fontSize=16, leading=24, alignment=TA_JUSTIFY, firstLineIndent=40)

    if data.doc_type == 'internal':
        draw_garuda(50, height - 80, 42)
        p.setFont("THSarabun", 28)
        p.drawCentredString(width / 2, height - 80, "บันทึกข้อความ")

        p.setFont("THSarabun", 16)
        p.drawString(50, height - 130, "ส่วนราชการ  คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัย โรงพยาบาลมะเร็งลพบุรี โทร. ๑๒๕")
        p.drawString(50, height - 160, f"ที่  {data.doc_number}")
        p.drawString(350, height - 160, f"วันที่ {data.doc_date}")
        p.drawString(50, height - 190, f"เรื่อง  ขอเชิญประชุม")
        p.setLineWidth(1)
        p.line(50, height - 200, width - 50, height - 200)
        p.drawString(50, height - 230, "เรียน  คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")
        
        content_text = f"""
        ตามที่ โรงพยาบาลมะเร็งลพบุรี ได้มีคำสั่งแต่งตั้งคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์ เพื่อให้การดำเนินงานวิจัย เป็นไปด้วยความเรียบร้อย มีประสิทธิภาพ และบรรลุวัตถุประสงค์ นั้น<br/><br/>
        ในการนี้ จึงขอเชิญคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์ เข้าร่วมประชุมพร้อมกันในวันที่ {data.meeting_date} เวลา {time_display} ณ {data.location}<br/><br/>
        จึงเรียนมาเพื่อโปรดทราบ และเข้าร่วมประชุมพร้อมกันในวันและเวลาดังกล่าวต่อไปด้วย
        """
        if data.agenda:
            content_text += "<br/><br/>วาระการประชุม:<br/>"
            for line in data.agenda.split('\n'):
                content_text += f"&nbsp;&nbsp;&nbsp;&nbsp;{line}<br/>"

        p_paragraph = Paragraph(content_text, style)
        frame = Frame(50, height - 550, width - 100, 300, showBoundary=0)
        frame.addFromList([p_paragraph], p)

        signer_name = f"({user.first_name} {user.last_name})"
        p.drawString(350, height - 580, "ลงชื่อ ...................................................")
        p.drawString(350, height - 610, signer_name)
        p.drawString(350, height - 640, "ประธานคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")
    else:
        draw_garuda((width - 85) / 2, height - 130, 85)
        p.setFont("THSarabun", 20)
        p.drawCentredString(width / 2, height - 180, "ขอเชิญประชุม")
        p.drawCentredString(width / 2, height - 210, "คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")
        p.setFont("THSarabun", 16)
        p.drawString(50, height - 260, f"วันที่ {data.meeting_date}")
        p.drawString(50, height - 300, "เรียน คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")
        
        content_text = f"""
        ด้วยโรงพยาบาลได้กำหนดจัดการประชุมคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์ ในวันที่ {data.meeting_date} เวลา {time_display} ณ {data.location}<br/><br/>
        จึงเรียนมาเพื่อโปรดทราบและเข้าร่วมประชุมตามวันและเวลาดังกล่าว
        """
        if data.agenda:
            content_text += "<br/><br/>วาระการประชุม:<br/>"
            for line in data.agenda.split('\n'):
                content_text += f"&nbsp;&nbsp;&nbsp;&nbsp;{line}<br/>"

        p_paragraph = Paragraph(content_text, style)
        frame = Frame(50, height - 550, width - 100, 250, showBoundary=0)
        frame.addFromList([p_paragraph], p)

        signer_name = f"({user.first_name} {user.last_name})"
        p.drawString(50, height - 600, "ลงชื่อ ...................................................")
        p.drawString(50, height - 630, signer_name)
        p.drawString(50, height - 660, "ประธานคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")

    p.showPage(); p.save(); buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=meeting_invitation.pdf"})

# ==========================================
# 4. Template Builder (สร้างแม่แบบหนังสือ)
# ==========================================

class TemplateCreate(BaseModel):
    template_name: str
    html_layout: str
    fields_json: str

@router.post("/templates", status_code=status.HTTP_201_CREATED)
def create_template(user: user_dependency, db: db_dependency, data: TemplateCreate):
    check_permission(user, ['admin'])
    new_tpl = DocumentTemplate(
        template_name=data.template_name,
        html_layout=data.html_layout,
        fields_json=data.fields_json,
        created_by=user.id
    )
    db.add(new_tpl); db.commit(); db.refresh(new_tpl)
    return new_tpl

@router.get("/templates")
def get_templates(user: user_dependency, db: db_dependency):
    check_permission(user, ['irb_officer', 'admin'])
    return db.query(DocumentTemplate).all()

@router.post("/templates/{template_id}/generate")
def generate_pdf_from_template(
    template_id: int, 
    form_data: dict,
    user: user_dependency, 
    db: db_dependency
):
    check_permission(user, ['irb_officer', 'admin'])
    template = db.query(DocumentTemplate).filter(DocumentTemplate.id == template_id).first()
    if not template: raise HTTPException(404, "Template not found")

    html_content = template.html_layout
    for key, value in form_data.items():
        html_content = html_content.replace(f"{{{{{key}}}}}", str(value) if value else "")

    buffer = io.BytesIO()
    font_url = f"file://{os.path.abspath(font_path)}"
    css = f"""
    <style>
        @font-face {{ font-family: 'THSarabun'; src: url('{font_url}'); }}
        body {{ font-family: 'THSarabun', sans-serif; font-size: 16pt; line-height: 1.5; padding: 20px; }}
        h1, h2, h3 {{ margin: 5px 0; }}
        table {{ width: 100%; }}
        .text-center {{ text-align: center; }}
        .text-right {{ text-align: right; }}
        .text-justify {{ text-align: justify; }}
        .indent {{ text-indent: 50px; }}
    </style>
    """
    full_html = f"<html><head>{css}</head><body>{html_content}</body></html>"
    
    pisa_status = pisa.CreatePDF(full_html, dest=buffer)
    if pisa_status.err: raise HTTPException(500, "Error generating PDF")

    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=document.pdf"})

# ==========================================
# 5. Reports (รายงาน)
# ==========================================

@router.get("/reports/project-status", status_code=status.HTTP_200_OK)
def generate_project_status_report(user: user_dependency, db: db_dependency):
    check_permission(user, ['irb_officer', 'admin'])
    projects = db.query(Project).all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name='Title', fontName='THSarabun', fontSize=24, alignment=TA_CENTER)
    elements.append(Paragraph("รายงานสถานะโครงการวิจัยทั้งหมด", title_style))
    elements.append(Paragraph(f"วันที่พิมพ์: {datetime.now().strftime('%d/%m/%Y')}", ParagraphStyle(name='Date', fontName='THSarabun', fontSize=16)))
    elements.append(Spacer(1, 20))

    data = [["ชื่อโครงการ", "เลข IRB", "สถานะ", "ผู้วิจัย"]]
    for proj in projects:
        owner = db.query(User).filter(User.id == proj.owner_id).first()
        owner_name = f"{owner.first_name} {owner.last_name}" if owner else "-"
        title = proj.title if len(proj.title) < 50 else proj.title[:47] + "..."
        data.append([title, proj.irb_number or "-", proj.status, owner_name])

    table = Table(data, colWidths=[220, 80, 100, 120])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'THSarabun'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F81BD')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=project_status_report.pdf"})

@router.get("/reports/expiring-projects", status_code=status.HTTP_200_OK)
def generate_expiring_report(user: user_dependency, db: db_dependency):
    check_permission(user, ['irb_officer', 'admin'])
    warning_date = datetime.utcnow() + timedelta(days=90)
    expiring_projects = db.query(Project).filter(
        Project.status == 'approved',
        Project.expiry_date <= warning_date,
        Project.expiry_date >= datetime.utcnow()
    ).all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name='Title', fontName='THSarabun', fontSize=24, alignment=TA_CENTER)
    elements.append(Paragraph("รายงานโครงการที่ใกล้หมดอายุ (ภายใน 90 วัน)", title_style))
    elements.append(Paragraph(f"วันที่พิมพ์: {datetime.now().strftime('%d/%m/%Y')}", ParagraphStyle(name='Date', fontName='THSarabun', fontSize=16)))
    elements.append(Spacer(1, 20))

    if not expiring_projects:
        elements.append(Paragraph("ไม่มีโครงการที่ใกล้หมดอายุในช่วง 90 วันนี้", ParagraphStyle(name='Normal', fontName='THSarabun', fontSize=16)))
    else:
        data = [["ชื่อโครงการ", "เลข IRB", "วันหมดอายุ", "ผู้วิจัย"]]
        for proj in expiring_projects:
            owner = db.query(User).filter(User.id == proj.owner_id).first()
            owner_name = f"{owner.first_name} {owner.last_name}" if owner else "-"
            exp_date = proj.expiry_date.strftime('%d/%m/%Y') if proj.expiry_date else "-"
            title = proj.title if len(proj.title) < 50 else proj.title[:47] + "..."
            data.append([title, proj.irb_number or "-", exp_date, owner_name])

        table = Table(data, colWidths=[220, 80, 100, 120])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'THSarabun'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#C0504D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=expiring_projects_report.pdf"})

@router.get("/reports/meeting-agenda", status_code=status.HTTP_200_OK)
def generate_meeting_agenda_report(user: user_dependency, db: db_dependency):
    check_permission(user, ['irb_officer', 'admin'])
    forwarded_projects = db.query(Project).filter(Project.status == 'forwarded').all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=30, bottomMargin=30)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name='Title', fontName='THSarabun', fontSize=24, alignment=TA_CENTER)
    elements.append(Paragraph("วาระการประชุมพิจารณาจริยธรรมการวิจัย", title_style))
    elements.append(Paragraph(f"วันที่พิมพ์: {datetime.now().strftime('%d/%m/%Y')}", ParagraphStyle(name='Date', fontName='THSarabun', fontSize=16)))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("เรื่องพิจารณา (โครงการที่รอการพิจารณา):", ParagraphStyle(name='Heading', fontName='THSarabun', fontSize=18, leading=24)))
    elements.append(Spacer(1, 10))

    if not forwarded_projects:
        elements.append(Paragraph("ไม่มีโครงการที่รอการพิจารณาในขณะนี้", ParagraphStyle(name='Normal', fontName='THSarabun', fontSize=16)))
    else:
        for idx, proj in enumerate(forwarded_projects):
            owner = db.query(User).filter(User.id == proj.owner_id).first()
            owner_name = f"{owner.first_name} {owner.last_name}" if owner else "-"
            text = f"<b>{idx + 1}. {proj.title}</b><br/>"
            text += f"เลขที่ IRB: {proj.irb_number or 'รอระบุ'} | ผู้วิจัย: {owner_name} | ประเภท: {proj.review_type.upper()}<br/><br/>"
            elements.append(Paragraph(text, ParagraphStyle(name='Item', fontName='THSarabun', fontSize=16, leading=22)))

    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=meeting_agenda_report.pdf"})