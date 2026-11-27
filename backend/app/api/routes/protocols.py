import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    InstitutionSetting,
    Protocol,
    ProtocolCreate,
    ProtocolPublic,
    ProtocolStatus,
    ProtocolUpdate,
    ProtocolsPublic,
    ProtocolSubmission,
    SubmissionCreate,
    SubmissionPublic,
    SubmissionStatus,
    SubmissionType,
)

router = APIRouter(prefix="/protocols", tags=["protocols"])


# ==========================================
# Helper Functions
# ==========================================

def generate_irb_number(session: Session) -> str:
    """สร้างเลข IRB อัตโนมัติ เช่น REC 001/69"""
    inst = session.exec(select(InstitutionSetting)).first()
    if not inst:
        raise HTTPException(status_code=500, detail="InstitutionSetting not configured")
    
    # คำนวณปี พ.ศ. ปัจจุบัน
    current_year = datetime.now(UTC).year + 543
    
    # รีเซ็ต counter ถ้าเปลี่ยนปี
    if inst.current_year != current_year:
        inst.current_year = current_year
        inst.sequence_counter = 0
    
    inst.sequence_counter += 1
    session.add(inst)
    session.commit()
    session.refresh(inst)
    
    # ใช้ template: "{prefix} {seq:03d}/{year}"
    irb_number = inst.irb_format.format(
        prefix=inst.irb_prefix,
        seq=inst.sequence_counter,
        year=str(current_year)[-2:]
    )
    return irb_number


# ==========================================
# Protocol CRUD
# ==========================================

@router.post("/", response_model=ProtocolPublic)
def create_protocol(
    *, session: SessionDep, current_user: CurrentUser, protocol_in: ProtocolCreate
) -> Any:
    """สร้างโครงการวิจัยใหม่ (Researcher)"""
    # ✅ แก้ไขแล้ว: ลบ status=ProtocolStatus.DRAFT ออก เพราะ model_dump() ส่งมาให้อยู่แล้ว
    protocol = Protocol(
        **protocol_in.model_dump(),
        pi_id=current_user.id
    )
    session.add(protocol)
    session.commit()
    session.refresh(protocol)
    return protocol


@router.get("/", response_model=ProtocolsPublic)
def read_protocols(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: ProtocolStatus | None = None,
) -> Any:
    """ดูรายการโครงการวิจัย (filter ตาม role)"""
    # Researcher เห็นเฉพาะของตัวเอง, คนอื่นเห็นทั้งหมด
    if current_user.role.value == "RESEARCHER" and not current_user.is_superuser:
        count_statement = select(func.count()).select_from(Protocol).where(
            Protocol.pi_id == current_user.id
        )
        statement = select(Protocol).where(Protocol.pi_id == current_user.id)
    else:
        count_statement = select(func.count()).select_from(Protocol)
        statement = select(Protocol)
    
    if status is not None:
        count_statement = count_statement.where(Protocol.status == status)
        statement = statement.where(Protocol.status == status)
    
    statement = statement.order_by(col(Protocol.created_at).desc()).offset(skip).limit(limit)
    
    count = session.exec(count_statement).one()
    protocols = session.exec(statement).all()
    
    return ProtocolsPublic(
        data=[ProtocolPublic.model_validate(p) for p in protocols],
        count=count
    )


@router.get("/{protocol_id}", response_model=ProtocolPublic)
def read_protocol(
    protocol_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """ดูรายละเอียดโครงการวิจัย"""
    protocol = session.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    # Researcher เห็นเฉพาะของตัวเอง
    if (
        current_user.role.value == "RESEARCHER"
        and not current_user.is_superuser
        and protocol.pi_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return protocol


@router.patch("/{protocol_id}", response_model=ProtocolPublic)
def update_protocol(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    protocol_id: uuid.UUID,
    protocol_in: ProtocolUpdate,
) -> Any:
    """แก้ไขโครงการวิจัย (เฉพาะ DRAFT หรือ REVISION_REQUIRED)"""
    protocol = session.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    # ตรวจสอบสิทธิ์
    if (
        current_user.role.value == "RESEARCHER"
        and not current_user.is_superuser
        and protocol.pi_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # อนุญาตให้แก้ไขเฉพาะสถานะ DRAFT หรือ REVISION_REQUIRED
    if protocol.status not in [ProtocolStatus.DRAFT, ProtocolStatus.REVISION_REQUIRED]:
        raise HTTPException(
            status_code=400,
            detail="Can only edit protocols in DRAFT or REVISION_REQUIRED status"
        )
    
    update_data = protocol_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(protocol, key, value)
    
    session.add(protocol)
    session.commit()
    session.refresh(protocol)
    return protocol


# ==========================================
# Submit Protocol (สร้าง Submission แรก)
# ==========================================

@router.post("/{protocol_id}/submit", response_model=SubmissionPublic)
def submit_protocol(
    protocol_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """ยื่นโครงการวิจัยครั้งแรก (สร้าง IRB number + submission แรก)"""
    protocol = session.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    # ตรวจสอบสิทธิ์
    if (
        current_user.role.value == "RESEARCHER"
        and not current_user.is_superuser
        and protocol.pi_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # ตรวจสอบสถานะ
    if protocol.status != ProtocolStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Can only submit protocols in DRAFT status"
        )
    
    # สร้าง IRB number
    irb_number = generate_irb_number(session)
    protocol.irb_number = irb_number
    protocol.status = ProtocolStatus.SUBMITTED
    protocol.submitted_at = datetime.now(UTC)
    session.add(protocol)
    
    # สร้าง Submission แรก (INITIAL)
    submission = ProtocolSubmission(
        protocol_id=protocol.id,
        submission_number=1,
        submission_type=SubmissionType.INITIAL,
        status=SubmissionStatus.SUBMITTED,
        submission_year=datetime.now(UTC).year + 543,
        created_by_id=current_user.id,
        submitted_at=datetime.now(UTC),
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    
    return submission


# ==========================================
# Create New Submission (Amendment/Renewal/Closure)
# ==========================================

@router.post("/{protocol_id}/submissions", response_model=SubmissionPublic)
def create_submission(
    protocol_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    submission_in: SubmissionCreate,
) -> Any:
    """ยื่นโครงการครั้งใหม่ (Amendment/Renewal/Closure)"""
    protocol = session.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    # ตรวจสอบสิทธิ์
    if (
        current_user.role.value == "RESEARCHER"
        and not current_user.is_superuser
        and protocol.pi_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # ตรวจสอบสถานะ protocol (ต้องเป็น ACTIVE หรือ APPROVED)
    if protocol.status not in [ProtocolStatus.ACTIVE, ProtocolStatus.APPROVED]:
        raise HTTPException(
            status_code=400,
            detail="Can only create new submissions for ACTIVE or APPROVED protocols"
        )
    
    # นับ submission_number
    existing_submissions = session.exec(
        select(ProtocolSubmission).where(ProtocolSubmission.protocol_id == protocol_id)
    ).all()
    next_number = len(existing_submissions) + 1
    
    # สร้าง Submission ใหม่
    submission = ProtocolSubmission(
        protocol_id=protocol.id,
        submission_number=next_number,
        submission_type=submission_in.submission_type,
        status=SubmissionStatus.SUBMITTED,
        meeting_id=submission_in.meeting_id,
        submission_year=datetime.now(UTC).year + 543,
        created_by_id=current_user.id,
        submitted_at=datetime.now(UTC),
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    
    return submission


@router.get("/{protocol_id}/submissions", response_model=list[SubmissionPublic])
def read_submissions(
    protocol_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """ดูรายการ submission ทั้งหมดของโครงการ"""
    protocol = session.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    # ตรวจสอบสิทธิ์
    if (
        current_user.role.value == "RESEARCHER"
        and not current_user.is_superuser
        and protocol.pi_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    submissions = session.exec(
        select(ProtocolSubmission)
        .where(ProtocolSubmission.protocol_id == protocol_id)
        .order_by(col(ProtocolSubmission.submission_number).desc())
    ).all()
    
    return [SubmissionPublic.model_validate(s) for s in submissions]


# ==========================================
# Archive (เรื่องเก่า)
# ==========================================

@router.get("/archive/list", response_model=ProtocolsPublic)
def read_archived_protocols(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    year: int | None = None,
    status: ProtocolStatus | None = None,
) -> Any:
    """ดูรายการโครงการเก่า (CLOSED, REJECTED)"""
    # ตรวจสอบสิทธิ์ (เฉพาะ Secretary, Admin, Reviewer)
    if current_user.role.value == "RESEARCHER" and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    count_statement = select(func.count()).select_from(Protocol)
    statement = select(Protocol)
    
    # Filter ตามสถานะ (CLOSED, REJECTED)
    archive_statuses = [ProtocolStatus.CLOSED, ProtocolStatus.REJECTED]
    if status:
        count_statement = count_statement.where(Protocol.status == status)
        statement = statement.where(Protocol.status == status)
    else:
        count_statement = count_statement.where(Protocol.status.in_(archive_statuses))
        statement = statement.where(Protocol.status.in_(archive_statuses))
    
    # Filter ตามปี
    if year:
        count_statement = count_statement.where(
            func.extract('year', Protocol.created_at) == year
        )
        statement = statement.where(
            func.extract('year', Protocol.created_at) == year
        )
    
    statement = statement.order_by(col(Protocol.created_at).desc()).offset(skip).limit(limit)
    
    count = session.exec(count_statement).one()
    protocols = session.exec(statement).all()
    
    return ProtocolsPublic(
        data=[ProtocolPublic.model_validate(p) for p in protocols],
        count=count
    )