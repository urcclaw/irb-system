from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import MeetingLocation
from schemas.meeting import LocationCreate, LocationUpdate, LocationResponse
from routers.auth import get_current_user
from models import User

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/", response_model=List[LocationResponse])
def get_locations(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MeetingLocation)
    if active_only:
        query = query.filter(MeetingLocation.is_active == True)
    return query.order_by(MeetingLocation.name).all()

@router.post("/", response_model=LocationResponse)
def create_location(
    location: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    existing = db.query(MeetingLocation).filter(MeetingLocation.name == location.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location name already exists")
    
    db_location = MeetingLocation(**location.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    location = db.query(MeetingLocation).filter(MeetingLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = location_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(location, key, value)
    
    db.commit()
    db.refresh(location)
    return location

@router.delete("/{location_id}")
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    location = db.query(MeetingLocation).filter(MeetingLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Soft delete (เปลี่ยนเป็น inactive แทนการลบจริง)
    location.is_active = False
    db.commit()
    return {"message": "Location deactivated"}