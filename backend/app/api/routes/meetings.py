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
    MeetingAttendance,
    MeetingStatus,
    MeetingType,
    Protocol,
    User,
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
    
    # ตรวจสอบว่ามีการโปรโตคอลในการประชุมนี้หรือไม่
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