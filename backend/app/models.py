import uuid
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


# ==========================================
# ENUMS
# ==========================================

class UserRole(StrEnum):
    RESEARCHER = "RESEARCHER"
    REVIEWER = "REVIEWER"
    SECRETARY = "SECRETARY"
    ADMIN = "ADMIN"


class ProtocolStatus(StrEnum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    SCREENING = "SCREENING"
    REVISION_REQUIRED = "REVISION_REQUIRED"
    PENDING_ASSIGNMENT = "PENDING_ASSIGNMENT"
    UNDER_REVIEW = "UNDER_REVIEW"
    AWAITING_DECISION = "AWAITING_DECISION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class RiskLevel(StrEnum):
    MINIMAL = "MINIMAL"
    GREATER_THAN_MINIMAL = "GREATER_THAN_MINIMAL"


class ReviewType(StrEnum):
    EXPEDITED = "EXPEDITED"
    FULL_BOARD = "FULL_BOARD"


class DocumentType(StrEnum):
    PROPOSAL = "PROPOSAL"
    CONSENT_FORM = "CONSENT_FORM"
    CV = "CV"
    OTHER = "OTHER"


class AssignmentStatus(StrEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class DecisionType(StrEnum):
    APPROVE = "APPROVE"
    REVISE = "REVISE"
    REJECT = "REJECT"


class MeetingStatus(StrEnum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class FollowUpType(StrEnum):
    PROGRESS = "PROGRESS"
    ADVERSE_EVENT = "ADVERSE_EVENT"
    CLOSURE = "CLOSURE"


class FollowUpStatus(StrEnum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


# ==========================================
# USER (Modified from Template)
# ==========================================

class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.RESEARCHER)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.RESEARCHER)


class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None
    full_name: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    role: UserRole | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(default_factory=get_datetime_utc)

    # Relationships
    items: list[Item] = Relationship(back_populates="owner", cascade_delete=True)
    protocols_as_pi: list[Protocol] = Relationship(back_populates="pi")


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# ==========================================
# ITEM (Keep from Template)
# ==========================================

class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: User | None = Relationship(back_populates="items")


class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# ==========================================
# IRB MODELS
# ==========================================

class ProtocolBase(SQLModel):
    title: str = Field(max_length=255)
    abstract: str | None = None
    status: ProtocolStatus = Field(default=ProtocolStatus.DRAFT)
    risk_level: RiskLevel | None = None
    review_type: ReviewType | None = None


class ProtocolCreate(ProtocolBase):
    pass


class ProtocolUpdate(SQLModel):
    title: str | None = None
    abstract: str | None = None
    status: ProtocolStatus | None = None
    risk_level: RiskLevel | None = None
    review_type: ReviewType | None = None


class Protocol(ProtocolBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    pi_id: uuid.UUID = Field(foreign_key="user.id")
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
    expired_at: datetime | None = None
    created_at: datetime | None = Field(default_factory=get_datetime_utc)
    updated_at: datetime | None = Field(default_factory=get_datetime_utc)

    # Relationships
    pi: User | None = Relationship(back_populates="protocols_as_pi")
    documents: list[Document] = Relationship(back_populates="protocol", cascade_delete=True)
    review_assignments: list[ReviewAssignment] = Relationship(back_populates="protocol", cascade_delete=True)
    certificate: "Certificate" = Relationship(back_populates="protocol", cascade_delete=True)
    follow_up_reports: list[FollowUpReport] = Relationship(back_populates="protocol", cascade_delete=True)


class ProtocolPublic(ProtocolBase):
    id: uuid.UUID
    pi_id: uuid.UUID
    created_at: datetime | None = None

class ProtocolsPublic(SQLModel):
    data: list[ProtocolPublic]
    count: int

class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    file_name: str
    file_path: str
    document_type: DocumentType
    version: int = Field(default=1)
    uploaded_at: datetime = Field(default_factory=get_datetime_utc)

    protocol: Protocol = Relationship(back_populates="documents")


class ReviewAssignment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    reviewer_id: uuid.UUID = Field(foreign_key="user.id")
    assigned_by_id: uuid.UUID = Field(foreign_key="user.id")
    due_date: datetime | None = None
    status: AssignmentStatus = Field(default=AssignmentStatus.PENDING)
    assigned_at: datetime = Field(default_factory=get_datetime_utc)

    protocol: Protocol = Relationship(back_populates="review_assignments")
    comments: list[ReviewComment] = Relationship(back_populates="assignment", cascade_delete=True)

class ReviewAssignmentCreate(SQLModel):
    protocol_id: uuid.UUID
    reviewer_id: uuid.UUID
    due_date: datetime | None = None

class ReviewAssignmentPublic(SQLModel):
    id: uuid.UUID
    protocol_id: uuid.UUID
    reviewer_id: uuid.UUID
    assigned_by_id: uuid.UUID
    due_date: datetime | None = None
    status: AssignmentStatus
    assigned_at: datetime

class ReviewAssignmentsPublic(SQLModel):
    data: list[ReviewAssignmentPublic]
    count: int

class ReviewComment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    assignment_id: uuid.UUID = Field(foreign_key="reviewassignment.id")
    comments: str
    decision: DecisionType
    reviewed_at: datetime = Field(default_factory=get_datetime_utc)

    assignment: ReviewAssignment = Relationship(back_populates="comments")


class Meeting(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meeting_date: datetime
    location: str | None = None
    agenda: str | None = None
    minutes: str | None = None
    status: MeetingStatus = Field(default=MeetingStatus.SCHEDULED)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")


class Certificate(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id", unique=True)
    irb_number: str = Field(unique=True)
    issue_date: datetime = Field(default_factory=get_datetime_utc)
    expiry_date: datetime
    file_path: str | None = None
    issued_by_id: uuid.UUID = Field(foreign_key="user.id")

    protocol: Protocol = Relationship(back_populates="certificate")


class FollowUpReport(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    report_type: FollowUpType
    description: str
    severity: str | None = None
    status: FollowUpStatus = Field(default=FollowUpStatus.OPEN)
    reported_at: datetime = Field(default_factory=get_datetime_utc)

    protocol: Protocol = Relationship(back_populates="follow_up_reports")


class AuditLog(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    action: str
    entity: str
    entity_id: uuid.UUID | None = None
    details: str | None = None
    ip_address: str | None = None
    created_at: datetime = Field(default_factory=get_datetime_utc)


# ==========================================
# GENERIC MODELS
# ==========================================

class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
