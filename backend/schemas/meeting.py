from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# ==========================================
# ✅ Meeting Schemas
# ==========================================
class MeetingBase(BaseModel):
    meeting_date: datetime
    end_time: Optional[datetime] = None  # ✅ เพิ่ม end_time
    meeting_type: str = "Full Board"
    location: Optional[str] = None
    quorum_required: int = 1

class MeetingCreate(MeetingBase):
    pass

class MeetingResponse(MeetingBase):
    id: int
    status: str
    minutes_file_path: Optional[str] = None
    created_at: datetime
    end_time: Optional[datetime] = None  # ✅ เพิ่ม end_time
    
    class Config:
        from_attributes = True

class MeetingDetailResponse(BaseModel):
    meeting: MeetingResponse
    agendas: List["AgendaWithProjectResponse"]
    attendances: List["AttendanceResponse"]
    quorum_met: bool
    present_count: int
    
    class Config:
        from_attributes = True

# ==========================================
# ✅ Agenda Schemas
# ==========================================
class AgendaBase(BaseModel):
    project_id: int
    agenda_order: int
    agenda_type: str = "new"

class AgendaCreate(AgendaBase):
    pass

class AgendaResponse(AgendaBase):
    id: int
    meeting_id: int
    decision: Optional[str] = None
    decision_reason: Optional[str] = None
    decision_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AgendaWithProjectResponse(AgendaResponse):
    project: "ProjectBriefResponse"
    
    class Config:
        from_attributes = True

class DecisionCreate(BaseModel):
    decision: str  # approved, approved_with_conditions, revise, rejected, deferred
    decision_reason: Optional[str] = None

# ==========================================
# ✅ Attendance Schemas
# ==========================================
class AttendanceBase(BaseModel):
    user_id: int
    status: str = "absent"  # present, absent, leave
    is_chairperson: bool = False

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    meeting_id: int
    user: "UserBriefResponse"
    
    class Config:
        from_attributes = True

class AttendanceUpdate(BaseModel):
    status: str  # present, absent, leave
    
    class Config:
        from_attributes = True

# ==========================================
# ✅ Brief Response Schemas
# ==========================================
class ProjectBriefResponse(BaseModel):
    id: int
    title: str
    irb_number: Optional[str] = None
    status: str
    review_type: str
    
    class Config:
        from_attributes = True

class UserBriefResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    role: str
    
    class Config:
        from_attributes = True

# ==========================================
# ✅ Location Schemas
# ==========================================
class LocationBase(BaseModel):
    name: str
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class LocationResponse(LocationBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True