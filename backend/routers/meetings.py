from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import CommitteeMeeting, MeetingAgenda, MeetingAttendance, Project, User

# ✅ แก้ไขตรงนี้: ชี้ไปที่ไฟล์ meeting.py ภายในโฟลเดอร์ schemas
from schemas.meeting import (
    MeetingResponse, MeetingDetailResponse, MeetingCreate,
    AgendaResponse, AgendaCreate, AgendaWithProjectResponse, DecisionCreate, 
    AttendanceCreate, AttendanceUpdate,  # ✅ เพิ่ม AttendanceUpdate
    AttendanceResponse, UserBriefResponse, ProjectBriefResponse
)

from routers.auth import get_current_user

router = APIRouter(prefix="/meetings", tags=["meetings"])

@router.get("/", response_model=List[MeetingResponse])
def get_meetings(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CommitteeMeeting)
    if status_filter:
        query = query.filter(CommitteeMeeting.status == status_filter)
    
    if current_user.role in ["pi", "assistant"]:
        query = query.join(MeetingAgenda).filter(
            MeetingAgenda.project.has(Project.owner_id == current_user.id)
        )
    
    return query.order_by(desc(CommitteeMeeting.meeting_date)).all()

@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting_detail(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(CommitteeMeeting).filter(CommitteeMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    agendas_query = db.query(MeetingAgenda).filter(MeetingAgenda.meeting_id == meeting_id)
    if current_user.role == "pi":
        agendas_query = agendas_query.filter(MeetingAgenda.project.has(Project.owner_id == current_user.id))
    
    agendas = agendas_query.order_by(MeetingAgenda.agenda_order).all()
    attendances = db.query(MeetingAttendance).filter(MeetingAttendance.meeting_id == meeting_id).all()
    
    present_count = sum(1 for a in attendances if a.status == "present")
    quorum_met = present_count >= meeting.quorum_required
    
    return {
        "meeting": meeting,
        "agendas": agendas,
        "attendances": attendances,
        "quorum_met": quorum_met,
        "present_count": present_count
    }

@router.post("/", response_model=MeetingResponse)
def create_meeting(
    meeting: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "irb_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 1. สร้าง Meeting
    db_meeting = CommitteeMeeting(**meeting.model_dump())
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # 2. ✅ สร้าง Attendance Records อัตโนมัติสำหรับกรรมการทุกคน
    committee_members = db.query(User).filter(
        User.role == "committee",
        User.is_active == True
    ).all()
    
    for member in committee_members:
        attendance = MeetingAttendance(
            meeting_id=db_meeting.id,
            user_id=member.id,
            status="absent",  # เริ่มต้นเป็น "ขาด"
            is_chairperson=False
        )
        db.add(attendance)
    
    db.commit()
    
    return db_meeting

@router.post("/{meeting_id}/agenda", response_model=AgendaResponse)
def add_agenda(
    meeting_id: int,
    agenda: AgendaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "irb_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_agenda = MeetingAgenda(**agenda.model_dump(), meeting_id=meeting_id)
    db.add(db_agenda)
    db.commit()
    db.refresh(db_agenda)
    return db_agenda

@router.post("/{meeting_id}/agenda/{agenda_id}/decision", response_model=AgendaResponse)
def record_decision(
    meeting_id: int,
    agenda_id: int,
    decision_data: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "irb_officer", "committee"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    present_count = db.query(MeetingAttendance).filter(
        and_(
            MeetingAttendance.meeting_id == meeting_id,
            MeetingAttendance.status == "present"
        )
    ).count()
    
    meeting = db.query(CommitteeMeeting).filter(CommitteeMeeting.id == meeting_id).first()
    if present_count < meeting.quorum_required:
        raise HTTPException(status_code=400, detail="Quorum not met. Cannot record decision.")
    
    agenda = db.query(MeetingAgenda).filter(
        and_(
            MeetingAgenda.id == agenda_id,
            MeetingAgenda.meeting_id == meeting_id
        )
    ).first()
    
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda not found")
    
    agenda.decision = decision_data.decision
    agenda.decision_reason = decision_data.decision_reason
    agenda.decision_date = datetime.utcnow()
    
    project = db.query(Project).filter(Project.id == agenda.project_id).first()
    if decision_data.decision == "approved":
        project.status = "approved"
        project.final_decision = "approved"
    elif decision_data.decision == "revise":
        project.status = "revision_requested"
        project.final_decision = "revise"
    elif decision_data.decision == "rejected":
        project.status = "rejected"
        project.final_decision = "rejected"
    
    project.final_decision_date = datetime.utcnow()
    project.final_decision_reason = decision_data.decision_reason
    
    db.commit()
    db.refresh(agenda)
    return agenda

# ✅ แก้ไขแล้ว: ใช้ AttendanceUpdate แทน AttendanceCreate
@router.put("/{meeting_id}/attendance/{attendance_id}")
def update_attendance(
    meeting_id: int,
    attendance_id: int,
    attendance_data: AttendanceUpdate,  # ✅ เปลี่ยนเป็น AttendanceUpdate
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "irb_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attendance = db.query(MeetingAttendance).filter(
        MeetingAttendance.id == attendance_id,
        MeetingAttendance.meeting_id == meeting_id
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # ✅ ตรวจสอบว่า status ถูกต้อง
    if attendance_data.status not in ["present", "absent", "leave"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be present, absent, or leave")
    
    attendance.status = attendance_data.status
    db.commit()
    db.refresh(attendance)
    return attendance

# ✅ เพิ่มใหม่: API สำหรับลบการประชุม
@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ลบการประชุม (เฉพาะ admin และ irb_officer)
    """
    if current_user.role not in ["admin", "irb_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    meeting = db.query(CommitteeMeeting).filter(CommitteeMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # ตรวจสอบว่ามีการบันทึกมติแล้วหรือไม่ (ถ้ามีแล้วไม่ควรลบ)
    has_decisions = db.query(MeetingAgenda).filter(
        MeetingAgenda.meeting_id == meeting_id,
        MeetingAgenda.decision.isnot(None)
    ).count()
    
    if has_decisions > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete meeting with {has_decisions} recorded decisions. Please cancel the meeting instead."
        )
    
    # ลบ attendances และ agendas ก่อน (cascade ควรจัดการให้อยู่แล้ว แต่ป้องกันไว้)
    db.query(MeetingAttendance).filter(MeetingAttendance.meeting_id == meeting_id).delete()
    db.query(MeetingAgenda).filter(MeetingAgenda.meeting_id == meeting_id).delete()
    
    # ลบ meeting
    db.delete(meeting)
    db.commit()
    
    return {"message": "Meeting deleted successfully"}

@router.get("/history/decisions")
def get_decision_history(
    decision_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ดึงประวัติมติที่ประชุมพร้อมกรองข้อมูลตามเงื่อนไข
    """
    # Join ตาราง MeetingAgenda กับ Project และ CommitteeMeeting
    query = db.query(MeetingAgenda).join(Project).join(CommitteeMeeting)
    
    # กรองเฉพาะวาระที่มีมติแล้ว
    query = query.filter(MeetingAgenda.decision.isnot(None))
    
    # กรองตามประเภทมติ
    if decision_type:
        query = query.filter(MeetingAgenda.decision == decision_type)
        
    # กรองตามช่วงวันที่ (ใช้ decision_date เป็นหลัก)
    if start_date:
        query = query.filter(MeetingAgenda.decision_date >= start_date)
    if end_date:
        query = query.filter(MeetingAgenda.decision_date <= end_date)
        
    # ✅ ความปลอดภัย: ถ้าเป็น PI หรือ Assistant ให้เห็นเฉพาะโครงการของตัวเอง
    if current_user.role in ["pi", "assistant"]:
        query = query.filter(Project.owner_id == current_user.id)
        
    # เรียงลำดับตามวันที่มีมติ (ล่าสุดขึ้นก่อน)
    query = query.order_by(desc(MeetingAgenda.decision_date))
    agendas = query.all()
    
    # จัดรูปแบบข้อมูลให้ตรงกับที่ Frontend ต้องการ
    results = []
    for agenda in agendas:
        results.append({
            "id": agenda.id,
            "decision_date": agenda.decision_date.isoformat() if agenda.decision_date else None,
            "project": {
                "title": agenda.project.title,
                "irb_number": agenda.project.irb_number
            },
            "agenda_type": agenda.agenda_type,
            "decision": agenda.decision,
            "decision_reason": agenda.decision_reason
        })
        
    return results