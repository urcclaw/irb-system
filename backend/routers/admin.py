from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import StreamingResponse

from database import get_db
from models import Project, User, DocumentTemplate
from routers.auth import get_current_user
from utils.certificate_generator import generate_certificate_pdf

router = APIRouter(prefix="/admin", tags=["admin"])


class FinalDecisionRequest(BaseModel):
    final_decision: str
    reason: str = ""
    summary: str = ""
    medical_device_risk: Optional[str] = None
    medical_device_registered: Optional[bool] = False
    medical_device_not_registered: Optional[bool] = False
    overall_risk: Optional[str] = None
    follow_up_months: Optional[int] = None
    other_suggestions: Optional[str] = ""


@router.get("/projects")
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).all()
    result = []
    for p in projects:
        reviews_data = []
        for r in p.reviews:
            reviewer_name = "Unknown"
            if r.reviewer:
                reviewer_name = f"{r.reviewer.first_name} {r.reviewer.last_name}"
            reviews_data.append({
                "id": r.id,
                "reviewer_id": r.reviewer_id,
                "reviewer_name": reviewer_name,
                "decision": r.decision,
                "comments": r.comments
            })

        docs = {
            "doc_proposal": bool(p.doc_proposal),
            "doc_submission_form": bool(p.doc_submission_form),
            "doc_ethics_form": bool(p.doc_ethics_form),
            "doc_self_assessment": bool(p.doc_self_assessment),
            "doc_consent_form": bool(p.doc_consent_form),
            "doc_info_sheet": bool(p.doc_info_sheet),
            "doc_coi_form": bool(p.doc_coi_form),
            "doc_researcher_cv": bool(p.doc_researcher_cv),
            "doc_renewal_form": bool(p.doc_renewal_form),
            "doc_closure_form": bool(p.doc_closure_form),
        }

        result.append({
            "id": p.id,
            "title": p.title,
            "irb_number": p.irb_number,
            "rec_number": p.rec_number,
            "status": p.status,
            "approval_date": p.approval_date.isoformat() if p.approval_date else None,
            "expiry_date": p.expiry_date.isoformat() if p.expiry_date else None,
            "docs": docs,
            "reviews": reviews_data,
            "secretary_summary": p.secretary_summary,
            "final_decision": p.final_decision,
            "final_decision_reason": p.final_decision_reason,
            "secretary_final_summary": p.secretary_final_summary,
            "final_medical_device_risk": p.final_medical_device_risk,
            "final_medical_device_registered": p.final_medical_device_registered,
            "final_medical_device_not_registered": p.final_medical_device_not_registered,
            "final_overall_risk": p.final_overall_risk,
            "final_follow_up_months": p.final_follow_up_months,
            "final_other_suggestions": p.final_other_suggestions
        })
    return result


@router.get("/templates")
def get_all_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    templates = db.query(DocumentTemplate).all()
    return [
        {
            "id": t.id,
            "template_name": t.template_name,
            "html_layout": t.html_layout,
            "fields_json": t.fields_json,
            "created_by": t.created_by,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in templates
    ]


@router.put("/projects/{project_id}/final-decision")
def make_final_decision(
    project_id: int,
    decision_data: FinalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["irb_officer", "admin"]:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ทำการตัดสินใจขั้นสุดท้าย")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")

    project.final_decision = decision_data.final_decision
    project.final_decision_reason = decision_data.reason
    project.secretary_final_summary = decision_data.summary
    project.final_decision_date = datetime.utcnow()

    project.final_medical_device_risk = decision_data.medical_device_risk
    project.final_medical_device_registered = decision_data.medical_device_registered
    project.final_medical_device_not_registered = decision_data.medical_device_not_registered
    project.final_overall_risk = decision_data.overall_risk
    project.final_follow_up_months = decision_data.follow_up_months
    project.final_other_suggestions = decision_data.other_suggestions

    if decision_data.final_decision == "approved":
        project.status = "approved"
    elif decision_data.final_decision == "approved_with_revision":
        project.status = "needs_revision"
    elif decision_data.final_decision == "needs_clarification":
        project.status = "needs_clarification"
    elif decision_data.final_decision == "rejected":
        project.status = "rejected"

    db.commit()
    db.refresh(project)

    return {"message": "บันทึกการตัดสินใจขั้นสุดท้ายเรียบร้อย", "project": {"id": project.id, "status": project.status}}


@router.get("/projects/{project_id}/certificate")
def generate_certificate(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["irb_officer", "admin"]:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")

    if project.final_decision != "approved":
        raise HTTPException(status_code=400, detail="โครงการยังไม่ได้รับการอนุมัติ")

    pdf_buffer = generate_certificate_pdf(project)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificate_{project.rec_number or project.id}.pdf"}
    )