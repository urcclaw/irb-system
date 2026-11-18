from typing import Any
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ReviewAssignment, ReviewAssignmentCreate, ReviewAssignmentPublic,
    ReviewAssignmentsPublic, AssignmentStatus, Protocol, User, UserRole,
    ProtocolStatus
)
from app.models import get_datetime_utc

router = APIRouter(prefix="/review-assignments", tags=["review-assignments"])


@router.get("/", response_model=ReviewAssignmentsPublic)
def read_review_assignments(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve review assignments with protocol title and reviewer name.

    - Secretary/Admin see all.
    - Reviewer sees only their own.
    - Researcher has no access.
    """
    # Base query: JOIN Protocol และ User เพื่อดึงชื่อ
    base_statement = (
        select(
            ReviewAssignment,
            Protocol.title.label("protocol_title"),
            User.full_name.label("reviewer_name")
        )
        .join(Protocol, ReviewAssignment.protocol_id == Protocol.id)
        .join(User, ReviewAssignment.reviewer_id == User.id)
    )

    # กรองตาม role
    if current_user.role == UserRole.REVIEWER:
        statement = base_statement.where(
            ReviewAssignment.reviewer_id == current_user.id
        )
    elif current_user.role in [UserRole.SECRETARY, UserRole.ADMIN]:
        statement = base_statement
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # รัน query
    results = session.exec(statement.offset(skip).limit(limit)).all()

    # แปลงผลลัพธ์เป็น list ของ dict
    assignments_data = []
    for row in results:
        assignment = row[0]
        protocol_title = row[1]
        reviewer_name = row[2]
        
        assignment_dict = assignment.model_dump()
        assignment_dict["protocol_title"] = protocol_title
        assignment_dict["reviewer_name"] = reviewer_name
        assignments_data.append(assignment_dict)

    count = len(assignments_data)
    return ReviewAssignmentsPublic(data=assignments_data, count=count)


@router.post("/", response_model=ReviewAssignmentPublic)
def create_review_assignment(
    *, session: SessionDep, current_user: CurrentUser, assignment_in: ReviewAssignmentCreate
) -> Any:
    """
    Create a new review assignment (Secretary only).
    """
    # 1. ตรวจสอบสิทธิ์ว่าเป็นเลขาฯ หรือแอดมิน
    if current_user.role not in [UserRole.SECRETARY, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only secretary can assign reviewers")

    # 2. ตรวจสอบว่า Protocol มีอยู่จริงและอยู่ในสถานะที่พร้อม Assign
    protocol = session.get(Protocol, assignment_in.protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    if protocol.status != ProtocolStatus.PENDING_ASSIGNMENT:
        raise HTTPException(
            status_code=400,
            detail=f"Protocol is not ready for assignment. Current status: {protocol.status}"
        )

    # 3. ตรวจสอบว่า Reviewer มีอยู่จริงและมี Role เป็น REVIEWER
    reviewer = session.get(User, assignment_in.reviewer_id)
    if not reviewer or reviewer.role != UserRole.REVIEWER:
        raise HTTPException(status_code=400, detail="Invalid reviewer. User must have REVIEWER role.")

    # 4. สร้าง Assignment
    assignment = ReviewAssignment.model_validate(
        assignment_in,
        update={
            "assigned_by_id": current_user.id,
            "assigned_at": get_datetime_utc()
        }
    )
    session.add(assignment)

    # 5. อัปเดตสถานะ Protocol เป็น UNDER_REVIEW
    protocol.status = ProtocolStatus.UNDER_REVIEW
    session.add(protocol)
    session.commit()
    session.refresh(assignment)
    
    # 6. ส่งกลับพร้อมชื่อ (สำหรับ frontend)
    return ReviewAssignmentPublic(
        id=assignment.id,
        protocol_id=assignment.protocol_id,
        reviewer_id=assignment.reviewer_id,
        assigned_by_id=assignment.assigned_by_id,
        due_date=assignment.due_date,
        status=assignment.status,
        assigned_at=assignment.assigned_at,
        protocol_title=protocol.title,
        reviewer_name=reviewer.full_name or reviewer.email
    )


@router.get("/{id}", response_model=ReviewAssignmentPublic)
def read_review_assignment(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get review assignment by ID.
    """
    assignment = session.get(ReviewAssignment, id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # ตรวจสอบสิทธิ์การเข้าถึง
    if current_user.role == UserRole.REVIEWER and assignment.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if current_user.role not in [UserRole.REVIEWER, UserRole.SECRETARY, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # ดึงชื่อมาเพิ่มด้วย
    protocol = session.get(Protocol, assignment.protocol_id)
    reviewer = session.get(User, assignment.reviewer_id)
    
    return ReviewAssignmentPublic(
        id=assignment.id,
        protocol_id=assignment.protocol_id,
        reviewer_id=assignment.reviewer_id,
        assigned_by_id=assignment.assigned_by_id,
        due_date=assignment.due_date,
        status=assignment.status,
        assigned_at=assignment.assigned_at,
        protocol_title=protocol.title if protocol else None,
        reviewer_name=reviewer.full_name if reviewer else None
    )