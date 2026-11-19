import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import List, Optional

from pydantic import EmailStr
from sqlalchemy import JSON
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


class DocumentType(StrEnum):
    SUBMISSION_FORM = "SUBMISSION_FORM"
    SELF_ASSESSMENT = "SELF_ASSESSMENT"
    CONSENT_FORM = "CONSENT_FORM"
    FULL_PROTOCOL = "FULL_PROTOCOL"
    PI_CV = "PI_CV"
    QUESTIONNAIRE = "QUESTIONNAIRE"
    COI_FORM = "COI_FORM"
    BUDGET = "BUDGET"
    SHORT_PROTOCOL = "SHORT_PROTOCOL"
    INVESTIGATOR_BROCHURE = "INVESTIGATOR_BROCHURE"
    THESIS_APPROVAL = "THESIS_APPROVAL"
    RECRUITMENT_MATERIAL = "RECRUITMENT_MATERIAL"
    MEDICAL_DEVICE_APPROVAL = "MEDICAL_DEVICE_APPROVAL"
    FREE_SALE_CERT = "FREE_SALE_CERT"
    INVESTIGATIONAL_DRUG = "INVESTIGATIONAL_DRUG"
    DRUG_APPROVAL = "DRUG_APPROVAL"
    OTHER_REC_APPROVAL = "OTHER_REC_APPROVAL"
    ELECTRONIC_COPY = "ELECTRONIC_COPY"
    OTHER = "OTHER"


class AssignmentStatus(StrEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class DecisionType(StrEnum):
    APPROVE = "APPROVE"
    REVISE = "REVISE"
    REJECT = "REJECT"
    DEFER = "DEFER"


class MeetingStatus(StrEnum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MeetingType(StrEnum):
    EXPEDITED = "EXPEDITED"
    FULL_BOARD = "FULL_BOARD"


class FollowUpType(StrEnum):
    PROGRESS = "PROGRESS"
    ADVERSE_EVENT = "ADVERSE_EVENT"
    CLOSURE = "CLOSURE"


class FollowUpStatus(StrEnum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class EvaluationRating(StrEnum):
    APPROPRIATE = "APPROPRIATE"
    INAPPROPRIATE = "INAPPROPRIATE"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class RiskAssessment(StrEnum):
    MINIMAL_RISK = "MINIMAL_RISK"
    GREATER_THAN_MINIMAL_WITH_BENEFIT = "GREATER_THAN_MINIMAL_WITH_BENEFIT"
    GREATER_THAN_MINIMAL_NO_DIRECT_BENEFIT = "GREATER_THAN_MINIMAL_NO_DIRECT_BENEFIT"
    OTHER = "OTHER"


class FollowUpPeriod(StrEnum):
    THREE_MONTHS = "3_MONTHS"
    SIX_MONTHS = "6_MONTHS"
    TWELVE_MONTHS = "12_MONTHS"


class OverallDecision(StrEnum):
    APPROVE = "APPROVE"
    APPROVE_WITH_REVISION = "APPROVE_WITH_REVISION"
    REQUEST_CLARIFICATION = "REQUEST_CLARIFICATION"
    REJECT = "REJECT"


class SubmissionType(StrEnum):
    INITIAL = "INITIAL"
    AMENDMENT = "AMENDMENT"
    RENEWAL = "RENEWAL"
    CLOSURE = "CLOSURE"
    ADVERSE_EVENT = "ADVERSE_EVENT"
    PROGRESS_REPORT = "PROGRESS_REPORT"


class SubmissionStatus(StrEnum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class CertificateType(StrEnum):
    INITIAL = "INITIAL"
    AMENDMENT = "AMENDMENT"
    RENEWAL = "RENEWAL"
    CLOSURE = "CLOSURE"


class CertificateStatus(StrEnum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    SUPERSEDED = "SUPERSEDED"


class StorageType(StrEnum):
    LOCAL = "LOCAL"
    FILE_SERVER = "FILE_SERVER"
    S3 = "S3"


# ==========================================
# USER
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

    items: List["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    protocols_as_pi: List["Protocol"] = Relationship(back_populates="pi")


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int


# ==========================================
# ITEM
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
    owner: Optional["User"] = Relationship(back_populates="items")


class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: List[ItemPublic]
    count: int


# ==========================================
# MASTER DATA TABLES
# ==========================================

class ResearchPurposeOption(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)


class Department(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)


class ReviewTypeOption(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)


# ==========================================
# INSTITUTION SETTING
# ==========================================

class InstitutionSetting(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    irb_prefix: str = Field(default="REC", max_length=20)
    irb_format: str = Field(default="{prefix} {seq:03d}/{year}", max_length=100)
    hospital_name: str = Field(max_length=255)
    hospital_name_en: str | None = Field(default=None, max_length=255)
    logo_url: str | None = Field(default=None, max_length=500)
    current_year: int = Field(default=2569)
    sequence_counter: int = Field(default=0)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)


# ==========================================
# FILE STORAGE SETTING
# ==========================================

class FileStorageSetting(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    storage_type: StorageType = Field(default=StorageType.LOCAL)
    base_path: str = Field(max_length=500)
    config: dict | None = Field(default=None, sa_type=JSON)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)


# ==========================================
# PROTOCOL
# ==========================================

class ProtocolBase(SQLModel):
    title: str = Field(max_length=255)
    abstract: str | None = None
    status: ProtocolStatus = Field(default=ProtocolStatus.DRAFT)
    risk_level: RiskLevel | None = None
    review_type: str | None = Field(default=None, max_length=100)


class ProtocolCreate(ProtocolBase):
    pass


class ProtocolUpdate(SQLModel):
    title: str | None = None
    abstract: str | None = None
    status: ProtocolStatus | None = None
    risk_level: RiskLevel | None = None
    review_type: str | None = None
    research_purpose: str | None = None
    researcher_type: str | None = None


class Protocol(ProtocolBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    irb_number: str | None = Field(default=None, unique=True, index=True, max_length=50)
    research_purpose: str | None = Field(default=None, max_length=100)
    researcher_type: str | None = Field(default=None, max_length=50)
    pi_id: uuid.UUID = Field(foreign_key="user.id")
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
    expired_at: datetime | None = None
    created_at: datetime | None = Field(default_factory=get_datetime_utc)
    updated_at: datetime | None = Field(default_factory=get_datetime_utc)

    pi: Optional["User"] = Relationship(back_populates="protocols_as_pi")
    submissions: List["ProtocolSubmission"] = Relationship(back_populates="protocol", cascade_delete=True)
    documents: List["Document"] = Relationship(back_populates="protocol", cascade_delete=True)
    review_assignments: List["ReviewAssignment"] = Relationship(back_populates="protocol", cascade_delete=True)
    certificates: List["Certificate"] = Relationship(back_populates="protocol", cascade_delete=True)
    follow_up_reports: List["FollowUpReport"] = Relationship(back_populates="protocol", cascade_delete=True)
    meeting_protocols: List["MeetingProtocol"] = Relationship(back_populates="protocol", cascade_delete=True)
    secretary_summary: Optional["SecretarySummary"] = Relationship(back_populates="protocol", cascade_delete=True)


class ProtocolPublic(ProtocolBase):
    id: uuid.UUID
    pi_id: uuid.UUID
    irb_number: str | None = None
    research_purpose: str | None = None
    researcher_type: str | None = None
    created_at: datetime | None = None


class ProtocolsPublic(SQLModel):
    data: List[ProtocolPublic]
    count: int


# ==========================================
# PROTOCOL SUBMISSION
# ==========================================

class ProtocolSubmission(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    submission_number: int = Field(default=1)
    submission_type: SubmissionType = Field(default=SubmissionType.INITIAL)
    status: SubmissionStatus = Field(default=SubmissionStatus.DRAFT)
    meeting_id: uuid.UUID | None = Field(default=None, foreign_key="meeting.id")
    meeting_number: int | None = None
    submission_year: int = Field(default=2569)
    version: int = Field(default=1)
    cover_letter: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)

    protocol: "Protocol" = Relationship(back_populates="submissions")
    meeting: Optional["Meeting"] = Relationship(back_populates="submissions")
    documents: List["Document"] = Relationship(back_populates="submission", cascade_delete=True)


class SubmissionCreate(SQLModel):
    protocol_id: uuid.UUID
    submission_type: SubmissionType
    meeting_id: uuid.UUID | None = None


class SubmissionPublic(SQLModel):
    id: uuid.UUID
    protocol_id: uuid.UUID
    submission_number: int
    submission_type: SubmissionType
    status: SubmissionStatus
    meeting_id: uuid.UUID | None
    meeting_number: int | None
    submission_year: int
    version: int
    submitted_at: datetime | None
    created_at: datetime | None


# ==========================================
# DOCUMENT
# ==========================================

class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="protocolsubmission.id")
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    file_name: str
    file_path: str
    file_size: int = Field(default=0)
    mime_type: str = Field(max_length=100)
    document_type: DocumentType
    version: int = Field(default=1)
    uploaded_by_id: uuid.UUID = Field(foreign_key="user.id")
    uploaded_at: datetime = Field(default_factory=get_datetime_utc)

    submission: "ProtocolSubmission" = Relationship(back_populates="documents")
    protocol: "Protocol" = Relationship(back_populates="documents")


# ==========================================
# REVIEW ASSIGNMENT
# ==========================================

class ReviewAssignment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    reviewer_id: uuid.UUID = Field(foreign_key="user.id")
    assigned_by_id: uuid.UUID = Field(foreign_key="user.id")
    due_date: datetime | None = None
    status: AssignmentStatus = Field(default=AssignmentStatus.PENDING)
    assigned_at: datetime = Field(default_factory=get_datetime_utc)
    evaluation_form: dict | None = Field(default=None, sa_type=JSON)

    protocol: "Protocol" = Relationship(back_populates="review_assignments")
    comments: List["ReviewComment"] = Relationship(back_populates="assignment", cascade_delete=True)


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
    protocol_title: str | None = None
    reviewer_name: str | None = None
    has_evaluation: bool = False


class ReviewAssignmentsPublic(SQLModel):
    data: List[ReviewAssignmentPublic]
    count: int


class ReviewComment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    assignment_id: uuid.UUID = Field(foreign_key="reviewassignment.id")
    comments: str
    decision: DecisionType
    reviewed_at: datetime = Field(default_factory=get_datetime_utc)
    assignment: "ReviewAssignment" = Relationship(back_populates="comments")


# ==========================================
# MEETING
# ==========================================

class Meeting(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meeting_date: datetime
    meeting_type: MeetingType = Field(default=MeetingType.FULL_BOARD)
    location: str | None = None
    agenda: str | None = None
    minutes: str | None = None
    status: MeetingStatus = Field(default=MeetingStatus.SCHEDULED)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)

    protocols: List["MeetingProtocol"] = Relationship(back_populates="meeting", cascade_delete=True)
    submissions: List["ProtocolSubmission"] = Relationship(back_populates="meeting")


class MeetingProtocol(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meeting_id: uuid.UUID = Field(foreign_key="meeting.id")
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    decision: DecisionType | None = None
    comments: str | None = None
    reviewed_at: datetime | None = None
    agenda_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)

    meeting: "Meeting" = Relationship(back_populates="protocols")
    protocol: "Protocol" = Relationship(back_populates="meeting_protocols")


class MeetingCreate(SQLModel):
    meeting_date: datetime
    meeting_type: MeetingType = Field(default=MeetingType.FULL_BOARD)
    location: str | None = None
    agenda: str | None = None


class MeetingUpdate(SQLModel):
    meeting_date: datetime | None = None
    meeting_type: MeetingType | None = None
    location: str | None = None
    agenda: str | None = None
    minutes: str | None = None
    status: MeetingStatus | None = None


class MeetingPublic(SQLModel):
    id: uuid.UUID
    meeting_date: datetime
    meeting_type: MeetingType
    location: str | None = None
    agenda: str | None = None
    minutes: str | None = None
    status: MeetingStatus
    created_by_id: uuid.UUID
    created_at: datetime | None = None
    protocol_count: int = 0


class MeetingsPublic(SQLModel):
    data: List[MeetingPublic]
    count: int


class MeetingProtocolCreate(SQLModel):
    protocol_id: uuid.UUID
    agenda_order: int = 0


class MeetingProtocolPublic(SQLModel):
    id: uuid.UUID
    meeting_id: uuid.UUID
    protocol_id: uuid.UUID
    decision: DecisionType | None = None
    comments: str | None = None
    reviewed_at: datetime | None = None
    agenda_order: int
    created_at: datetime | None = None
    protocol_title: str | None = None
    protocol_status: ProtocolStatus | None = None
    protocol_risk_level: RiskLevel | None = None
    pi_name: str | None = None


class MeetingProtocolsPublic(SQLModel):
    data: List[MeetingProtocolPublic]
    count: int


class MeetingDetailPublic(MeetingPublic):
    protocols: List[MeetingProtocolPublic] = []


class MeetingDecisionUpdate(SQLModel):
    decision: DecisionType
    comments: str | None = None


# ==========================================
# SECRETARY SUMMARY
# ==========================================

class SecretarySummary(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id", unique=True)
    meeting_id: uuid.UUID = Field(foreign_key="meeting.id")
    final_decision: OverallDecision
    decision_reason: str = Field(max_length=500)
    summary_to_researcher: str
    conditions: List[str] | None = Field(default=None, sa_type=JSON)
    required_revisions: List[str] | None = Field(default=None, sa_type=JSON)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)

    protocol: "Protocol" = Relationship(back_populates="secretary_summary")


class SecretarySummaryCreate(SQLModel):
    protocol_id: uuid.UUID
    meeting_id: uuid.UUID
    final_decision: OverallDecision
    decision_reason: str
    summary_to_researcher: str
    conditions: List[str] | None = None
    required_revisions: List[str] | None = None


class SecretarySummaryPublic(SQLModel):
    id: uuid.UUID
    protocol_id: uuid.UUID
    meeting_id: uuid.UUID
    final_decision: OverallDecision
    decision_reason: str
    summary_to_researcher: str
    conditions: List[str] | None = None
    required_revisions: List[str] | None = None
    created_by_id: uuid.UUID
    created_by_name: str | None = None
    created_at: datetime | None = None


# ==========================================
# CERTIFICATE
# ==========================================

class Certificate(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    submission_id: uuid.UUID = Field(foreign_key="protocolsubmission.id")
    certificate_number: str = Field(unique=True, index=True, max_length=50)
    certificate_type: CertificateType = Field(default=CertificateType.INITIAL)
    status: CertificateStatus = Field(default=CertificateStatus.ACTIVE)
    issue_date: datetime = Field(default_factory=get_datetime_utc)
    expiry_date: datetime
    project_title_th: str
    project_title_en: str | None = None
    principal_investigator: str
    department: str
    conditions: List[str] | None = Field(default=None, sa_type=JSON)
    file_path: str | None = None
    file_name: str | None = None
    qr_code_data: str | None = None
    qr_code_image_path: str | None = None
    issued_by_id: uuid.UUID = Field(foreign_key="user.id")
    issued_at: datetime = Field(default_factory=get_datetime_utc)
    created_at: datetime = Field(default_factory=get_datetime_utc)
    updated_at: datetime = Field(default_factory=get_datetime_utc)

    protocol: "Protocol" = Relationship(back_populates="certificates")


class CertificateCreate(SQLModel):
    protocol_id: uuid.UUID
    submission_id: uuid.UUID
    certificate_type: CertificateType
    expiry_date: datetime
    project_title_th: str
    project_title_en: str | None = None
    principal_investigator: str
    department: str
    conditions: List[str] | None = None


class CertificatePublic(SQLModel):
    id: uuid.UUID
    certificate_number: str
    certificate_type: CertificateType
    status: CertificateStatus
    issue_date: datetime
    expiry_date: datetime
    project_title_th: str
    project_title_en: str | None = None
    principal_investigator: str
    department: str
    conditions: List[str] | None = None
    file_path: str | None = None
    qr_code_data: str | None = None
    issued_at: datetime | None = None
    is_expired: bool = False


class CertificatesPublic(SQLModel):
    data: List[CertificatePublic]
    count: int


# ==========================================
# FOLLOW-UP
# ==========================================

class FollowUpReport(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="protocol.id")
    report_type: FollowUpType
    description: str
    severity: str | None = None
    status: FollowUpStatus = Field(default=FollowUpStatus.OPEN)
    reported_at: datetime = Field(default_factory=get_datetime_utc)
    protocol: "Protocol" = Relationship(back_populates="follow_up_reports")


# ==========================================
# AUDIT LOG
# ==========================================

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
# GENERIC
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