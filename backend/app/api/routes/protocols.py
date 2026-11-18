from typing import Any
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Protocol, ProtocolCreate, ProtocolUpdate, ProtocolPublic, ProtocolsPublic,
    ProtocolStatus, UserRole
)

router = APIRouter(prefix="/protocols", tags=["protocols"])

@router.get("/", response_model=ProtocolsPublic)
def read_protocols(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve protocols. 
    Researchers see only their own. Secretary/Admin see all.
    """
    if current_user.role == UserRole.RESEARCHER:
        count = session.exec(
            select(Protocol).where(Protocol.pi_id == current_user.id)
        ).count()
        protocols = session.exec(
            select(Protocol).where(Protocol.pi_id == current_user.id).offset(skip).limit(limit)
        ).all()
    else:
        count = session.exec(select(Protocol)).count()
        protocols = session.exec(select(Protocol).offset(skip).limit(limit)).all()
    
    return ProtocolsPublic(data=protocols, count=count)


@router.post("/", response_model=ProtocolPublic)
def create_protocol(
    *, session: SessionDep, current_user: CurrentUser, protocol_in: ProtocolCreate
) -> Any:
    """
    Create new protocol (Researcher only).
    """
    if current_user.role != UserRole.RESEARCHER:
        raise HTTPException(status_code=403, detail="Only researchers can create protocols")
    
    protocol = Protocol.model_validate(protocol_in, update={"pi_id": current_user.id})
    session.add(protocol)
    session.commit()
    session.refresh(protocol)
    return protocol


@router.get("/{id}", response_model=ProtocolPublic)
def read_protocol(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get protocol by ID.
    """
    protocol = session.get(Protocol, id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    if current_user.role == UserRole.RESEARCHER and protocol.pi_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return protocol


@router.patch("/{id}", response_model=ProtocolPublic)
def update_protocol(
    *, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, protocol_in: ProtocolUpdate
) -> Any:
    """
    Update protocol.
    """
    protocol = session.get(Protocol, id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    if current_user.role == UserRole.RESEARCHER and protocol.pi_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if current_user.role not in [UserRole.RESEARCHER, UserRole.SECRETARY, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = protocol_in.model_dump(exclude_unset=True)
    protocol.sqlmodel_update(update_dict)
    session.add(protocol)
    session.commit()
    session.refresh(protocol)
    return protocol


@router.delete("/{id}")
def delete_protocol(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Delete protocol (Draft only).
    """
    protocol = session.get(Protocol, id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    
    if current_user.role == UserRole.RESEARCHER and protocol.pi_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if protocol.status != ProtocolStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only delete draft protocols")
    
    session.delete(protocol)
    session.commit()
    return {"message": "Protocol deleted successfully"}