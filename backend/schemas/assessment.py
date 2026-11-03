from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AssessmentItem(BaseModel):
    status: str
    comment: str = ""

class AssessmentCreate(BaseModel):
    project_id: int
    section_a: Dict[str, AssessmentItem]
    section_b: Dict[str, AssessmentItem]
    section_c: Dict[str, AssessmentItem]
    section_d: Dict[str, AssessmentItem]
    medical_device_risk: Optional[str] = None
    medical_device_registered: Optional[bool] = False
    medical_device_not_registered: Optional[bool] = False
    overall_risk: str
    follow_up_months: Optional[int] = None
    overall_decision: str
    rejection_reason: Optional[str] = None
    other_suggestions: Optional[str] = None

# ✅ Schema สำหรับ Response - ต้องมีทุกฟิลด์ที่ Frontend ใช้
class AssessmentResponse(BaseModel):
    id: int
    project_id: int
    reviewer_id: int
    decision: str
    comments: Optional[str] = None  # ✅ เพิ่ม
    assessment_details: Optional[Dict[str, Any]] = None
    medical_device_risk: Optional[str] = None  # ✅ เพิ่ม
    medical_device_registered: Optional[bool] = False  # ✅ เพิ่ม
    medical_device_not_registered: Optional[bool] = False  # ✅ เพิ่ม
    overall_risk: Optional[str] = None  # ✅ เพิ่ม
    follow_up_months: Optional[int] = None  # ✅ เพิ่ม
    rejection_reason: Optional[str] = None  # ✅ เพิ่ม
    created_at: datetime

    class Config:
        from_attributes = True