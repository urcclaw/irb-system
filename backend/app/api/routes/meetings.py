import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Meeting,
    MeetingCreate,
    MeetingUpdate,
    MeetingPublic,
    MeetingsPublic,
    MeetingProtocol,
    MeetingProtocolCreate,
    MeetingProtocolPublic,
    MeetingProtocolsPublic,
    MeetingDetailPublic,
    MeetingDecisionUpdate,
    MeetingAttendance,
    MeetingStatus,
    MeetingType,
    Protocol,
    ProtocolStatus,
    User,
    OverallDecision,
    SecretarySummary,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


# ==========================================
# Helper Functions
# ==========================================

def check_secretary_or_admin(current_user: CurrentUser) -> None:
    """ตรวจสอบว่าเป็น SECRETARY หรือ ADMIN"""
    if current_user.role.value not in ["SECRETARY", "ADMIN"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions. Only SECRETARY or ADMIN can manage meetings.")


def get_meeting_or_404(session: Session, meeting_id: uuid.UUID) -> Meeting:
    """ดึง Meeting หรือ raise 404"""
    meeting = session.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


def count_meeting_protocols(session: Session, meeting_id: uuid.UUID) -> int:
    """นับจำนวนโปรโตคอลในการประชุม"""
    count = session.exec(
        select(func.count()).select_from(MeetingProtocol).where(MeetingProtocol.meeting_id == meeting_id)
    ).one()
    return count


def count_meeting_attendance(session: Session, meeting_id: uuid.UUID) -> tuple[int, int]:
    """นับจำนวนกรรมการทั้งหมดและที่มาประชุม"""
    total = session.exec(
        select(func.count()).select_from(MeetingAttendance).where(MeetingAttendance.meeting_id == meeting_id)
    ).one()
    present = session.exec(
        select(func.count()).select_from(MeetingAttendance).where(
            MeetingAttendance.meeting_id == meeting_id,
            MeetingAttendance.is_present == True
        )
    ).one()
    return total, present


# ==========================================
# Meeting CRUD
# ==========================================

@router.post("/", response_model=MeetingPublic)
def create_meeting(
    *, session: SessionDep, current_user: CurrentUser, meeting_in: MeetingCreate
) -> Any:
    """สร้างการประชุมใหม่ (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    
    meeting = Meeting(
        **meeting_in.model_dump(),
        created_by_id=current_user.id
    )
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    
    return meeting


@router.get("/", response_model=MeetingsPublic)
def read_meetings(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: MeetingStatus | None = None,
    meeting_type: MeetingType | None = None,
) -> Any:
    """ดูรายการการประชุมทั้งหมด (filter ตาม status และ type)"""
    count_statement = select(func.count()).select_from(Meeting)
    statement = select(Meeting)
    
    # Filter ตาม status
    if status is not None:
        count_statement = count_statement.where(Meeting.status == status)
        statement = statement.where(Meeting.status == status)
    
    # Filter ตาม meeting_type
    if meeting_type is not None:
        count_statement = count_statement.where(Meeting.meeting_type == meeting_type)
        statement = statement.where(Meeting.meeting_type == meeting_type)
    
    # เรียงตามวันที่ประชุม (ใหม่สุดก่อน)
    statement = statement.order_by(col(Meeting.meeting_date).desc()).offset(skip).limit(limit)
    
    count = session.exec(count_statement).one()
    meetings = session.exec(statement).all()
    
    # เพิ่มข้อมูล protocol_count, attendance_count, present_count
    meetings_data = []
    for meeting in meetings:
        protocol_count = count_meeting_protocols(session, meeting.id)
        attendance_count, present_count = count_meeting_attendance(session, meeting.id)
        
        meeting_dict = meeting.model_dump()
        meeting_dict["protocol_count"] = protocol_count
        meeting_dict["attendance_count"] = attendance_count
        meeting_dict["present_count"] = present_count
        
        meetings_data.append(MeetingPublic.model_validate(meeting_dict))
    
    return MeetingsPublic(data=meetings_data, count=count)


@router.get("/{meeting_id}", response_model=MeetingDetailPublic)
def read_meeting(
    meeting_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """ดูรายละเอียดการประชุม (พร้อมรายการโปรโตคอลและจำนวนกรรมการ)"""
    meeting = get_meeting_or_404(session, meeting_id)
    
    # ดึงโปรโตคอลทั้งหมดในการประชุมนี้
    protocols = session.exec(
        select(MeetingProtocol)
        .where(MeetingProtocol.meeting_id == meeting_id)
        .order_by(col(MeetingProtocol.agenda_order).asc())
    ).all()
    
    # ดึงข้อมูลโปรโตคอลเพิ่มเติม (title, status, risk_level, pi_name)
    protocols_data = []
    for mp in protocols:
        protocol = session.get(Protocol, mp.protocol_id)
        if protocol:
            pi = session.get(User, protocol.pi_id)
            protocol_dict = mp.model_dump()
            protocol_dict["protocol_title"] = protocol.title
            protocol_dict["protocol_status"] = protocol.status
            protocol_dict["protocol_risk_level"] = protocol.risk_level
            protocol_dict["pi_name"] = pi.full_name if pi else None
            protocols_data.append(MeetingProtocolPublic.model_validate(protocol_dict))
    
    # นับจำนวนกรรมการ
    attendance_count, present_count = count_meeting_attendance(session, meeting_id)
    
    # สร้าง response
    meeting_dict = meeting.model_dump()
    meeting_dict["protocol_count"] = len(protocols_data)
    meeting_dict["attendance_count"] = attendance_count
    meeting_dict["present_count"] = present_count
    meeting_dict["protocols"] = protocols_data
    
    return MeetingDetailPublic.model_validate(meeting_dict)


@router.patch("/{meeting_id}", response_model=MeetingPublic)
def update_meeting(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    meeting_id: uuid.UUID,
    meeting_in: MeetingUpdate,
) -> Any:
    """แก้ไขข้อมูลการประชุม (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    meeting = get_meeting_or_404(session, meeting_id)
    
    update_data = meeting_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(meeting, key, value)
    
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """ยกเลิกการประชุม (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    meeting = get_meeting_or_404(session, meeting_id)
    
    # ตรวจสอบว่ามีโปรโตคอลในการประชุมนี้หรือไม่
    protocol_count = count_meeting_protocols(session, meeting_id)
    if protocol_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete meeting with protocols. Remove all protocols first."
        )
    
    session.delete(meeting)
    session.commit()
    
    return {"message": "Meeting deleted successfully"}


# ==========================================
# Meeting Protocol Management (Agenda)
# ==========================================

@router.post("/{meeting_id}/protocols", response_model=MeetingProtocolPublic)
def add_protocol_to_meeting(
    meeting_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    protocol_in: MeetingProtocolCreate,
) -> Any:
    """เพิ่มโปรโตคอลเข้าวาระการประชุม (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    meeting = get_meeting_or_404(session, meeting_id)
    
    # ตรวจสอบว่าโปรโตคอลมีอยู่จริง
    protocol = session.get(Protocol, protocol_in.protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    # ตรวจสอบว่าโปรโตคอลนี้อยู่ในการประชุมนี้แล้วหรือไม่
    existing = session.exec(
        select(MeetingProtocol).where(
            MeetingProtocol.meeting_id == meeting_id,
            MeetingProtocol.protocol_id == protocol_in.protocol_id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Protocol already in this meeting")
    
    # สร้าง MeetingProtocol
    meeting_protocol = MeetingProtocol(
        meeting_id=meeting_id,
        protocol_id=protocol_in.protocol_id,
        agenda_order=protocol_in.agenda_order,
    )
    session.add(meeting_protocol)
    session.commit()
    session.refresh(meeting_protocol)
    
    # ดึงข้อมูลโปรโตคอลเพิ่มเติม
    pi = session.get(User, protocol.pi_id)
    result_dict = meeting_protocol.model_dump()
    result_dict["protocol_title"] = protocol.title
    result_dict["protocol_status"] = protocol.status
    result_dict["protocol_risk_level"] = protocol.risk_level
    result_dict["pi_name"] = pi.full_name if pi else None
    
    return MeetingProtocolPublic.model_validate(result_dict)


@router.get("/{meeting_id}/protocols", response_model=MeetingProtocolsPublic)
def read_meeting_protocols(
    meeting_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """ดูรายการโปรโตคอลในการประชุม (เรียงตาม agenda_order)"""
    meeting = get_meeting_or_404(session, meeting_id)
    
    protocols = session.exec(
        select(MeetingProtocol)
        .where(MeetingProtocol.meeting_id == meeting_id)
        .order_by(col(MeetingProtocol.agenda_order).asc())
    ).all()
    
    protocols_data = []
    for mp in protocols:
        protocol = session.get(Protocol, mp.protocol_id)
        if protocol:
            pi = session.get(User, protocol.pi_id)
            protocol_dict = mp.model_dump()
            protocol_dict["protocol_title"] = protocol.title
            protocol_dict["protocol_status"] = protocol.status
            protocol_dict["protocol_risk_level"] = protocol.risk_level
            protocol_dict["pi_name"] = pi.full_name if pi else None
            protocols_data.append(MeetingProtocolPublic.model_validate(protocol_dict))
    
    return MeetingProtocolsPublic(data=protocols_data, count=len(protocols_data))


@router.delete("/{meeting_id}/protocols/{protocol_id}")
def remove_protocol_from_meeting(
    meeting_id: uuid.UUID,
    protocol_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """ถอนโปรโตคอลออกจากวาระการประชุม (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    get_meeting_or_404(session, meeting_id)
    
    meeting_protocol = session.exec(
        select(MeetingProtocol).where(
            MeetingProtocol.meeting_id == meeting_id,
            MeetingProtocol.protocol_id == protocol_id
        )
    ).first()
    
    if not meeting_protocol:
        raise HTTPException(status_code=404, detail="Protocol not found in this meeting")
    
    # ตรวจสอบว่ามีการพิจารณาแล้วหรือไม่
    if meeting_protocol.decision is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove protocol that has been reviewed"
        )
    
    session.delete(meeting_protocol)
    session.commit()
    
    return {"message": "Protocol removed from meeting successfully"}


# ==========================================
# Meeting Attendance (เช็กชื่อกรรมการ)
# ==========================================

@router.post("/{meeting_id}/attendance")
def check_in_attendance(
    meeting_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
    is_present: bool = True,
    is_chairperson: bool = False,
) -> Any:
    """เช็กชื่อกรรมการที่มาประชุม (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    get_meeting_or_404(session, meeting_id)
    
    # ตรวจสอบว่ามี user นี้จริง
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # ตรวจสอบว่ามี attendance record อยู่แล้วหรือไม่
    attendance = session.exec(
        select(MeetingAttendance).where(
            MeetingAttendance.meeting_id == meeting_id,
            MeetingAttendance.user_id == user_id
        )
    ).first()
    
    if attendance:
        # อัปเดตข้อมูลเดิม
        attendance.is_present = is_present
        attendance.is_chairperson = is_chairperson
        if is_present and not attendance.checked_in_at:
            attendance.checked_in_at = datetime.now(UTC)
        session.add(attendance)
    else:
        # สร้าง record ใหม่
        attendance = MeetingAttendance(
            meeting_id=meeting_id,
            user_id=user_id,
            is_present=is_present,
            is_chairperson=is_chairperson,
            checked_in_at=datetime.now(UTC) if is_present else None,
        )
        session.add(attendance)
    
    session.commit()
    
    return {"message": "Attendance recorded successfully"}


@router.get("/{meeting_id}/attendance")
def read_meeting_attendance(
    meeting_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """ดูรายชื่อกรรมการที่มาประชุม"""
    get_meeting_or_404(session, meeting_id)
    
    attendances = session.exec(
        select(MeetingAttendance).where(MeetingAttendance.meeting_id == meeting_id)
    ).all()
    
    attendance_data = []
    for att in attendances:
        user = session.get(User, att.user_id)
        attendance_data.append({
            "id": att.id,
            "user_id": att.user_id,
            "user_name": user.full_name if user else None,
            "is_present": att.is_present,
            "is_chairperson": att.is_chairperson,
            "checked_in_at": att.checked_in_at,
        })
    
    return attendance_data


# ==========================================
# Review & Decision APIs (Phase 2.4)
# ==========================================

@router.patch("/{meeting_id}/protocols/{protocol_id}/review", response_model=MeetingProtocolPublic)
def review_protocol_in_meeting(
    meeting_id: uuid.UUID,
    protocol_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    review_in: MeetingDecisionUpdate,
) -> Any:
    """บันทึกผลการพิจารณาโปรโตคอลในการประชุม (SECRETARY/ADMIN เท่านั้น)"""
    check_secretary_or_admin(current_user)
    meeting = get_meeting_or_404(session, meeting_id)
    
    # ตรวจสอบว่าการประชุมยังไม่ finalize
    if meeting.status == MeetingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Cannot review protocols in a completed meeting"
        )
    
    # หา MeetingProtocol
    meeting_protocol = session.exec(
        select(MeetingProtocol).where(
            MeetingProtocol.meeting_id == meeting_id,
            MeetingProtocol.protocol_id == protocol_id
        )
    ).first()
    
    if not meeting_protocol:
        raise HTTPException(status_code=404, detail="Protocol not found in this meeting")
    
    # อัปเดตผลการพิจารณา
    meeting_protocol.decision = review_in.decision
    meeting_protocol.comments = review_in.comments
    meeting_protocol.reviewed_at = datetime.now(UTC)
    
    session.add(meeting_protocol)
    session.commit()
    session.refresh(meeting_protocol)
    
    # ดึงข้อมูลโปรโตคอลเพิ่มเติม
    protocol = session.get(Protocol, protocol_id)
    pi = session.get(User, protocol.pi_id) if protocol else None
    
    result_dict = meeting_protocol.model_dump()
    result_dict["protocol_title"] = protocol.title if protocol else None
    result_dict["protocol_status"] = protocol.status if protocol else None
    result_dict["protocol_risk_level"] = protocol.risk_level if protocol else None
    result_dict["pi_name"] = pi.full_name if pi else None
    
    return MeetingProtocolPublic.model_validate(result_dict)


@router.get("/{meeting_id}/quorum-status")
def get_quorum_status(
    meeting_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """ตรวจสอบสถานะองค์ประชุม"""
    meeting = get_meeting_or_404(session, meeting_id)
    
    # นับจำนวนกรรมการที่มาประชุม
    attendance_count, present_count = count_meeting_attendance(session, meeting_id)
    
    # ตรวจสอบว่าผ่านองค์ประชุมหรือไม่
    quorum_met = present_count >= meeting.quorum_required
    
    return {
        "meeting_id": meeting_id,
        "quorum_required": meeting.quorum_required,
        "total_attendance": attendance_count,
        "present_count": present_count,
        "quorum_met": quorum_met,
        "status": meeting.status,
    }


@router.post("/{meeting_id}/finalize", response_model=MeetingDetailPublic)
def finalize_meeting(
    meeting_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Finalize การประชุม (SECRETARY/ADMIN เท่านั้น)
    
    การดำเนินการ:
    1. ตรวจสอบองค์ประชุม (quorum)
    2. ตรวจสอบว่าทุกโปรโตคอลได้รับการพิจารณาแล้ว
    3. อัปเดตสถานะการประชุมเป็น COMPLETED
    4. อัปเดตสถานะ Protocol ตามผลการพิจารณา
    5. สร้าง SecretarySummary สำหรับแต่ละโปรโตคอล
    """
    check_secretary_or_admin(current_user)
    meeting = get_meeting_or_404(session, meeting_id)
    
    # ตรวจสอบว่าการประชุมยังไม่ finalize
    if meeting.status == MeetingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Meeting already finalized"
        )
    
    # 1. ตรวจสอบองค์ประชุม
    attendance_count, present_count = count_meeting_attendance(session, meeting_id)
    if present_count < meeting.quorum_required:
        raise HTTPException(
            status_code=400,
            detail=f"Quorum not met. Required: {meeting.quorum_required}, Present: {present_count}"
        )
    
    # 2. ดึงโปรโตคอลทั้งหมดในการประชุม
    meeting_protocols = session.exec(
        select(MeetingProtocol).where(MeetingProtocol.meeting_id == meeting_id)
    ).all()
    
    if len(meeting_protocols) == 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot finalize meeting with no protocols"
        )
    
    # 3. ตรวจสอบว่าทุกโปรโตคอลได้รับการพิจารณาแล้ว
    unreviewed = [mp for mp in meeting_protocols if mp.decision is None]
    if len(unreviewed) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{len(unreviewed)} protocol(s) have not been reviewed yet"
        )
    
    # 4. อัปเดตสถานะการประชุมเป็น COMPLETED
    meeting.status = MeetingStatus.COMPLETED
    session.add(meeting)
    
    # 5. อัปเดตสถานะ Protocol และสร้าง SecretarySummary
    status_mapping = {
        "APPROVE": ProtocolStatus.APPROVED,
        "REVISE": ProtocolStatus.REVISION_REQUIRED,
        "REJECT": ProtocolStatus.REJECTED,
        "DEFER": ProtocolStatus.AWAITING_DECISION,
    }
    
    overall_decision_mapping = {
        "APPROVE": OverallDecision.APPROVE,
        "REVISE": OverallDecision.APPROVE_WITH_REVISION,
        "REJECT": OverallDecision.REJECT,
        "DEFER": OverallDecision.REQUEST_CLARIFICATION,
    }
    
    for mp in meeting_protocols:
        protocol = session.get(Protocol, mp.protocol_id)
        if not protocol:
            continue
        
        # แปลง DecisionType เป็น ProtocolStatus
        new_status = status_mapping.get(mp.decision.value if mp.decision else None)
        if new_status:
            protocol.status = new_status
            if mp.decision.value == "APPROVE":
                protocol.approved_at = datetime.now(UTC)
            session.add(protocol)
        
        # แปลง DecisionType เป็น OverallDecision สำหรับ SecretarySummary
        overall_decision = overall_decision_mapping.get(mp.decision.value if mp.decision else None)
        
        # ตรวจสอบว่ามี SecretarySummary อยู่แล้วหรือไม่ (unique constraint on protocol_id)
        existing_summary = session.exec(
            select(SecretarySummary).where(SecretarySummary.protocol_id == protocol.id)
        ).first()
        
        if existing_summary:
            # อัปเดต SecretarySummary เดิม
            existing_summary.meeting_id = meeting_id
            existing_summary.final_decision = overall_decision
            existing_summary.decision_reason = mp.comments or ""
            existing_summary.summary_to_researcher = mp.comments or ""
            existing_summary.updated_at = datetime.now(UTC)
            session.add(existing_summary)
        else:
            # สร้าง SecretarySummary ใหม่
            summary = SecretarySummary(
                protocol_id=protocol.id,
                meeting_id=meeting_id,
                final_decision=overall_decision,
                decision_reason=mp.comments or "",
                summary_to_researcher=mp.comments or "",
                conditions=[],
                required_revisions=[],
                created_by_id=current_user.id,
            )
            session.add(summary)
    
    session.commit()
    session.refresh(meeting)
    
    # 6. สร้าง response
    protocols = session.exec(
        select(MeetingProtocol)
        .where(MeetingProtocol.meeting_id == meeting_id)
        .order_by(col(MeetingProtocol.agenda_order).asc())
    ).all()
    
    protocols_data = []
    for mp in protocols:
        protocol = session.get(Protocol, mp.protocol_id)
        if protocol:
            pi = session.get(User, protocol.pi_id)
            protocol_dict = mp.model_dump()
            protocol_dict["protocol_title"] = protocol.title
            protocol_dict["protocol_status"] = protocol.status
            protocol_dict["protocol_risk_level"] = protocol.risk_level
            protocol_dict["pi_name"] = pi.full_name if pi else None
            protocols_data.append(MeetingProtocolPublic.model_validate(protocol_dict))
    
    attendance_count, present_count = count_meeting_attendance(session, meeting_id)
    
    meeting_dict = meeting.model_dump()
    meeting_dict["protocol_count"] = len(protocols_data)
    meeting_dict["attendance_count"] = attendance_count
    meeting_dict["present_count"] = present_count
    meeting_dict["protocols"] = protocols_data
    
    return MeetingDetailPublic.model_validate(meeting_dict)