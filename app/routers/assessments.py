from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CommitteeReview, User, Project
from app.schemas.assessment import AssessmentCreate, AssessmentResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/assessments", tags=["Assessments"])


# ==========================================
# 1. สร้างผลการประเมินใหม่ (POST)
# ==========================================
@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["committee", "irb_officer", "admin"]:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ในการประเมินโครงการ")

    assessment_details = {
        "section_a": {k: v.dict() for k, v in assessment.section_a.items()},
        "section_b": {k: v.dict() for k, v in assessment.section_b.items()},
        "section_c": {k: v.dict() for k, v in assessment.section_c.items()},
        "section_d": {k: v.dict() for k, v in assessment.section_d.items()},
    }

    new_review = CommitteeReview(
        project_id=assessment.project_id,
        reviewer_id=current_user.id,
        decision=assessment.overall_decision,
        comments=assessment.other_suggestions,
        assessment_details=assessment_details,
        medical_device_risk=assessment.medical_device_risk,
        medical_device_registered=assessment.medical_device_registered,
        medical_device_not_registered=assessment.medical_device_not_registered,
        overall_risk=assessment.overall_risk,
        follow_up_months=assessment.follow_up_months,
        rejection_reason=assessment.rejection_reason
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


# ==========================================
# 2. ดึงผลการประเมินทั้งหมดของโครงการ (GET)
# ==========================================
@router.get("/{project_id}", response_model=list[AssessmentResponse])
def get_assessments_by_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reviews = db.query(CommitteeReview).filter(
        CommitteeReview.project_id == project_id
    ).all()
    return reviews


# ==========================================
# 3. สรุปผลการประเมินภาพรวม (GET Summary)
# ==========================================
@router.get("/summary/{project_id}")
def get_assessment_summary(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["irb_officer", "admin", "committee"]:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ดูสรุปผลการประเมิน")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโครงการ")

    reviews = db.query(CommitteeReview).filter(
        CommitteeReview.project_id == project_id
    ).all()

    # ✅ เพิ่มฟิลด์ final_* ใน project response
    summary = {
        "project": {
            "id": project.id,
            "title": project.title,
            "irb_number": project.irb_number,
            "rec_number": project.rec_number,
            "status": project.status,
            "final_decision": project.final_decision,
            "final_decision_reason": project.final_decision_reason,
            "secretary_final_summary": project.secretary_final_summary,
            "final_medical_device_risk": project.final_medical_device_risk,
            "final_medical_device_registered": project.final_medical_device_registered,
            "final_medical_device_not_registered": project.final_medical_device_not_registered,
            "final_overall_risk": project.final_overall_risk,
            "final_follow_up_months": project.final_follow_up_months,
            "final_other_suggestions": project.final_other_suggestions
        },
        "total_reviews": len(reviews),
        "decisions": {},
        "overall_risks": {},
        "follow_up_months": {},
        "medical_device_risks": {},
        "all_comments": [],
        "all_rejection_reasons": [],
        "all_other_suggestions": [],
        "reviewers": []
    }

    for review in reviews:
        dec = review.decision
        summary["decisions"][dec] = summary["decisions"].get(dec, 0) + 1

        if review.overall_risk:
            risk = review.overall_risk
            summary["overall_risks"][risk] = summary["overall_risks"].get(risk, 0) + 1

        if review.follow_up_months:
            m = review.follow_up_months
            summary["follow_up_months"][m] = summary["follow_up_months"].get(m, 0) + 1

        if review.medical_device_risk:
            md = review.medical_device_risk
            summary["medical_device_risks"][md] = summary["medical_device_risks"].get(md, 0) + 1

        if review.comments:
            summary["all_comments"].append({
                "reviewer_id": review.reviewer_id,
                "comments": review.comments
            })

        if review.rejection_reason:
            summary["all_rejection_reasons"].append({
                "reviewer_id": review.reviewer_id,
                "reason": review.rejection_reason
            })

        if review.assessment_details:
            not_suitable_items = []
            for section_key in ["section_a", "section_b", "section_c", "section_d"]:
                section_data = review.assessment_details.get(section_key, {})
                for item_id, item_data in section_data.items():
                    if item_data.get("status") == "not_suitable" or item_data.get("comment", "").strip():
                        not_suitable_items.append({
                            "section": section_key,
                            "item_id": item_id,
                            "status": item_data.get("status"),
                            "comment": item_data.get("comment", "")
                        })

            if not_suitable_items:
                summary["all_other_suggestions"].append({
                    "reviewer_id": review.reviewer_id,
                    "items": not_suitable_items
                })

        reviewer = db.query(User).filter(User.id == review.reviewer_id).first()
        if reviewer:
            summary["reviewers"].append({
                "id": reviewer.id,
                "username": reviewer.username,
                "first_name": reviewer.first_name,
                "last_name": reviewer.last_name,
                "role": reviewer.role
            })

    return summary


# ==========================================
# 4. แก้ไขผลการประเมินเดิม (PUT)
# ==========================================
@router.put("/{review_id}", response_model=AssessmentResponse)
def update_assessment(
    review_id: int,
    assessment: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(CommitteeReview).filter(
        CommitteeReview.id == review_id
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="ไม่พบผลการประเมิน")

    if review.reviewer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์แก้ไขผลการประเมินนี้")

    assessment_details = {
        "section_a": {k: v.dict() for k, v in assessment.section_a.items()},
        "section_b": {k: v.dict() for k, v in assessment.section_b.items()},
        "section_c": {k: v.dict() for k, v in assessment.section_c.items()},
        "section_d": {k: v.dict() for k, v in assessment.section_d.items()},
    }

    review.decision = assessment.overall_decision
    review.comments = assessment.other_suggestions
    review.assessment_details = assessment_details
    review.medical_device_risk = assessment.medical_device_risk
    review.medical_device_registered = assessment.medical_device_registered
    review.medical_device_not_registered = assessment.medical_device_not_registered
    review.overall_risk = assessment.overall_risk
    review.follow_up_months = assessment.follow_up_months
    review.rejection_reason = assessment.rejection_reason

    db.commit()
    db.refresh(review)

    return review