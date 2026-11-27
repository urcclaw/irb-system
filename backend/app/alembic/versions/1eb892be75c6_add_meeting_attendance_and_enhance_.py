"""add meeting attendance and enhance meeting (fixed constraints)

Revision ID: 1eb892be75c6
Revises: 74cb44c1c5cb
Create Date: 2026-11-27 09:37:31.767124

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1eb892be75c6'
down_revision = '74cb44c1c5cb'
branch_labels = None
depends_on = None


def upgrade():
    # 1. สร้างตาราง meetingattendance
    op.create_table('meetingattendance',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('meeting_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('is_present', sa.Boolean(), nullable=False),
        sa.Column('is_chairperson', sa.Boolean(), nullable=False),
        sa.Column('checked_in_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True),
        sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(['meeting_id'], ['meeting.id'], name='fk_meetingattendance_meeting_id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], name='fk_meetingattendance_user_id'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. สร้างตาราง secretarysummary
    op.create_table('secretarysummary',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('protocol_id', sa.Uuid(), nullable=False),
        sa.Column('meeting_id', sa.Uuid(), nullable=False),
        sa.Column('final_decision', sa.Enum('APPROVE', 'APPROVE_WITH_REVISION', 'REQUEST_CLARIFICATION', 'REJECT', name='overalldecision'), nullable=False),
        sa.Column('decision_reason', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('summary_to_researcher', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('conditions', sa.JSON(), nullable=True),
        sa.Column('required_revisions', sa.JSON(), nullable=True),
        sa.Column('created_by_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], name='fk_secretarysummary_created_by_id'),
        sa.ForeignKeyConstraint(['meeting_id'], ['meeting.id'], name='fk_secretarysummary_meeting_id'),
        sa.ForeignKeyConstraint(['protocol_id'], ['protocol.id'], name='fk_secretarysummary_protocol_id'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('protocol_id')
    )

    # 3. แก้ไข Certificate (Timestamps & Constraints)
    op.alter_column('certificate', 'issue_date', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('certificate', 'expiry_date', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('certificate', 'issued_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('certificate', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('certificate', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.drop_constraint(op.f('certificate_certificate_number_key'), 'certificate', type_='unique')
    op.drop_index(op.f('ix_certificate_certificate_number'), table_name='certificate')
    op.create_index(op.f('ix_certificate_certificate_number'), 'certificate', ['certificate_number'], unique=True)
    op.drop_constraint(op.f('certificate_protocol_id_fkey'), 'certificate', type_='foreignkey')
    op.drop_constraint(op.f('certificate_submission_id_fkey'), 'certificate', type_='foreignkey')
    op.drop_constraint(op.f('certificate_issued_by_id_fkey'), 'certificate', type_='foreignkey')
    op.create_foreign_key('fk_certificate_protocol_id', 'certificate', 'protocol', ['protocol_id'], ['id'])
    op.create_foreign_key('fk_certificate_submission_id', 'certificate', 'protocolsubmission', ['submission_id'], ['id'])
    op.create_foreign_key('fk_certificate_issued_by_id', 'certificate', 'user', ['issued_by_id'], ['id'])

    # 4. แก้ไข Department
    op.alter_column('department', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('department', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.drop_constraint(op.f('department_name_key'), 'department', type_='unique')
    op.drop_index(op.f('ix_department_name'), table_name='department')
    op.create_index(op.f('ix_department_name'), 'department', ['name'], unique=True)

    # 5. แก้ไข Document
    op.add_column('document', sa.Column('file_size', sa.Integer(), nullable=False))
    op.add_column('document', sa.Column('mime_type', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False))
    op.add_column('document', sa.Column('uploaded_by_id', sa.Uuid(), nullable=False))
    op.alter_column('document', 'submission_id', existing_type=sa.UUID(), nullable=False)
    
    # ✅ แก้ไข: เพิ่ม postgresql_using สำหรับ Enum casting
    op.alter_column('document', 'document_type', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('SUBMISSION_FORM', 'SELF_ASSESSMENT', 'CONSENT_FORM', 'FULL_PROTOCOL', 'PI_CV', 'QUESTIONNAIRE', 'COI_FORM', 'BUDGET', 'SHORT_PROTOCOL', 'INVESTIGATOR_BROCHURE', 'THESIS_APPROVAL', 'RECRUITMENT_MATERIAL', 'MEDICAL_DEVICE_APPROVAL', 'FREE_SALE_CERT', 'INVESTIGATIONAL_DRUG', 'DRUG_APPROVAL', 'OTHER_REC_APPROVAL', 'ELECTRONIC_COPY', 'OTHER', name='documenttype'), 
        existing_nullable=False,
        postgresql_using="document_type::documenttype"
    )
    
    op.drop_constraint(op.f('fk_document_submission_id'), 'document', type_='foreignkey')
    op.create_foreign_key('fk_document_submission_id_new', 'document', 'protocolsubmission', ['submission_id'], ['id'])
    op.create_foreign_key('fk_document_uploaded_by_id', 'document', 'user', ['uploaded_by_id'], ['id'])

    # 6. แก้ไข FileStorageSetting & FollowUpReport & InstitutionSetting
    op.alter_column('filestoragesetting', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('filestoragesetting', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    
    # ✅ แก้ไข: เพิ่ม postgresql_using สำหรับ Enum casting
    op.alter_column('followupreport', 'report_type', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('PROGRESS', 'ADVERSE_EVENT', 'CLOSURE', name='followuptype'), 
        existing_nullable=False,
        postgresql_using="report_type::followuptype"
    )
    op.alter_column('followupreport', 'status', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('OPEN', 'RESOLVED', name='followupstatus'), 
        existing_nullable=False,
        postgresql_using="status::followupstatus"
    )
    
    op.alter_column('institutionsetting', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('institutionsetting', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)

    # 7. ✅ แก้ไข Meeting (เพิ่ม Explicit Enum Creation และ postgresql_using)
    op.add_column('meeting', sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True))
    op.add_column('meeting', sa.Column('start_time', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True))
    op.add_column('meeting', sa.Column('end_time', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True))
    
    meeting_type_enum = sa.Enum('EXPEDITED', 'FULL_BOARD', name='meetingtype')
    meeting_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('meeting', sa.Column('meeting_type', meeting_type_enum, nullable=False, server_default='FULL_BOARD'))
    
    op.add_column('meeting', sa.Column('quorum_required', sa.Integer(), nullable=False, server_default='1'))

    meeting_status_enum = sa.Enum('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', name='meetingstatus')
    meeting_status_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column('meeting', 'status', 
        existing_type=sa.VARCHAR(), 
        type_=meeting_status_enum, 
        existing_nullable=False,
        postgresql_using="status::meetingstatus"
    )
    op.alter_column('meeting', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False)
    op.alter_column('meeting', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False)

    # 8. แก้ไข MeetingProtocol
    op.alter_column('meetingprotocol', 'reviewed_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=True)
    op.alter_column('meetingprotocol', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('meetingprotocol', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.drop_constraint(op.f('meetingprotocol_protocol_id_fkey'), 'meetingprotocol', type_='foreignkey')
    op.drop_constraint(op.f('meetingprotocol_meeting_id_fkey'), 'meetingprotocol', type_='foreignkey')
    op.create_foreign_key('fk_meetingprotocol_protocol_id', 'meetingprotocol', 'protocol', ['protocol_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_meetingprotocol_meeting_id', 'meetingprotocol', 'meeting', ['meeting_id'], ['id'], ondelete='CASCADE')

    # 9. แก้ไข Protocol & ProtocolSubmission
    # ✅ แก้ไข: เพิ่ม postgresql_using สำหรับ Enum casting
    op.alter_column('protocol', 'status', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('DRAFT', 'SUBMITTED', 'SCREENING', 'REVISION_REQUIRED', 'PENDING_ASSIGNMENT', 'UNDER_REVIEW', 'AWAITING_DECISION', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED', name='protocolstatus'), 
        existing_nullable=False,
        postgresql_using="status::protocolstatus"
    )
    op.alter_column('protocol', 'risk_level', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('MINIMAL', 'GREATER_THAN_MINIMAL', name='risklevel'), 
        existing_nullable=True,
        postgresql_using="risk_level::risklevel"
    )
    
    op.alter_column('protocolsubmission', 'submitted_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=True)
    op.alter_column('protocolsubmission', 'reviewed_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=True)
    op.alter_column('protocolsubmission', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('protocolsubmission', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.drop_constraint(op.f('protocolsubmission_protocol_id_fkey'), 'protocolsubmission', type_='foreignkey')
    op.drop_constraint(op.f('protocolsubmission_created_by_id_fkey'), 'protocolsubmission', type_='foreignkey')
    op.drop_constraint(op.f('protocolsubmission_meeting_id_fkey'), 'protocolsubmission', type_='foreignkey')
    op.create_foreign_key('fk_protocolsubmission_protocol_id', 'protocolsubmission', 'protocol', ['protocol_id'], ['id'])
    op.create_foreign_key('fk_protocolsubmission_created_by_id', 'protocolsubmission', 'user', ['created_by_id'], ['id'])
    op.create_foreign_key('fk_protocolsubmission_meeting_id', 'protocolsubmission', 'meeting', ['meeting_id'], ['id'])

    # 10. แก้ไข ResearchPurposeOption, ReviewAssignment, ReviewComment, ReviewTypeOption, User
    op.alter_column('researchpurposeoption', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('researchpurposeoption', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.drop_constraint(op.f('researchpurposeoption_name_key'), 'researchpurposeoption', type_='unique')
    op.drop_index(op.f('ix_researchpurposeoption_name'), table_name='researchpurposeoption')
    op.create_index(op.f('ix_researchpurposeoption_name'), 'researchpurposeoption', ['name'], unique=True)
    op.add_column('reviewassignment', sa.Column('evaluation_form', sa.JSON(), nullable=True))
    
    # ✅ แก้ไข: เพิ่ม postgresql_using สำหรับ Enum casting
    op.alter_column('reviewassignment', 'status', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', name='assignmentstatus'), 
        existing_nullable=False,
        postgresql_using="status::assignmentstatus"
    )
    op.alter_column('reviewcomment', 'decision', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('APPROVE', 'REVISE', 'REJECT', 'DEFER', name='decisiontype'), 
        existing_nullable=False,
        postgresql_using="decision::decisiontype"
    )
    
    op.alter_column('reviewtypeoption', 'created_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.alter_column('reviewtypeoption', 'updated_at', existing_type=postgresql.TIMESTAMP(), type_=sqlmodel.sql.sqltypes.UTCDateTime(), existing_nullable=False)
    op.drop_constraint(op.f('reviewtypeoption_name_key'), 'reviewtypeoption', type_='unique')
    op.drop_index(op.f('ix_reviewtypeoption_name'), table_name='reviewtypeoption')
    op.create_index(op.f('ix_reviewtypeoption_name'), 'reviewtypeoption', ['name'], unique=True)
    
    op.alter_column('user', 'role', 
        existing_type=sa.VARCHAR(), 
        type_=sa.Enum('RESEARCHER', 'REVIEWER', 'SECRETARY', 'ADMIN', name='userrole'), 
        existing_nullable=False,
        postgresql_using="role::userrole"
    )


def downgrade():
    # 10. ย้อนกลับ User, ReviewTypeOption, ReviewComment, ReviewAssignment, ResearchPurposeOption
    op.alter_column('user', 'role', existing_type=sa.Enum('RESEARCHER', 'REVIEWER', 'SECRETARY', 'ADMIN', name='userrole'), type_=sa.VARCHAR(), existing_nullable=False)
    op.drop_index(op.f('ix_reviewtypeoption_name'), table_name='reviewtypeoption')
    op.create_index(op.f('ix_reviewtypeoption_name'), 'reviewtypeoption', ['name'], unique=False)
    op.create_unique_constraint(op.f('reviewtypeoption_name_key'), 'reviewtypeoption', ['name'], postgresql_nulls_not_distinct=False)
    op.alter_column('reviewtypeoption', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('reviewtypeoption', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('reviewcomment', 'decision', existing_type=sa.Enum('APPROVE', 'REVISE', 'REJECT', 'DEFER', name='decisiontype'), type_=sa.VARCHAR(), existing_nullable=False)
    op.alter_column('reviewassignment', 'status', existing_type=sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', name='assignmentstatus'), type_=sa.VARCHAR(), existing_nullable=False)
    op.drop_column('reviewassignment', 'evaluation_form')
    op.drop_index(op.f('ix_researchpurposeoption_name'), table_name='researchpurposeoption')
    op.create_index(op.f('ix_researchpurposeoption_name'), 'researchpurposeoption', ['name'], unique=False)
    op.create_unique_constraint(op.f('researchpurposeoption_name_key'), 'researchpurposeoption', ['name'], postgresql_nulls_not_distinct=False)
    op.alter_column('researchpurposeoption', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('researchpurposeoption', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)

    # 9. ย้อนกลับ ProtocolSubmission & Protocol
    op.drop_constraint('fk_protocolsubmission_meeting_id', 'protocolsubmission', type_='foreignkey')
    op.drop_constraint('fk_protocolsubmission_created_by_id', 'protocolsubmission', type_='foreignkey')
    op.drop_constraint('fk_protocolsubmission_protocol_id', 'protocolsubmission', type_='foreignkey')
    op.create_foreign_key(op.f('protocolsubmission_meeting_id_fkey'), 'protocolsubmission', 'meeting', ['meeting_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(op.f('protocolsubmission_created_by_id_fkey'), 'protocolsubmission', 'user', ['created_by_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('protocolsubmission_protocol_id_fkey'), 'protocolsubmission', 'protocol', ['protocol_id'], ['id'], ondelete='CASCADE')
    op.alter_column('protocolsubmission', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('protocolsubmission', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('protocolsubmission', 'reviewed_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=True)
    op.alter_column('protocolsubmission', 'submitted_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=True)
    op.alter_column('protocol', 'risk_level', existing_type=sa.Enum('MINIMAL', 'GREATER_THAN_MINIMAL', name='risklevel'), type_=sa.VARCHAR(), existing_nullable=True)
    op.alter_column('protocol', 'status', existing_type=sa.Enum('DRAFT', 'SUBMITTED', 'SCREENING', 'REVISION_REQUIRED', 'PENDING_ASSIGNMENT', 'UNDER_REVIEW', 'AWAITING_DECISION', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED', name='protocolstatus'), type_=sa.VARCHAR(), existing_nullable=False)

    # 8. ย้อนกลับ MeetingProtocol
    op.drop_constraint('fk_meetingprotocol_protocol_id', 'meetingprotocol', type_='foreignkey')
    op.drop_constraint('fk_meetingprotocol_meeting_id', 'meetingprotocol', type_='foreignkey')
    op.create_foreign_key(op.f('meetingprotocol_protocol_id_fkey'), 'meetingprotocol', 'protocol', ['protocol_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('meetingprotocol_meeting_id_fkey'), 'meetingprotocol', 'meeting', ['meeting_id'], ['id'], ondelete='CASCADE')
    op.alter_column('meetingprotocol', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('meetingprotocol', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('meetingprotocol', 'reviewed_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=True)

    # 7. ✅ ย้อนกลับ Meeting (ลบคอลัมน์และ Drop Enum ที่สร้างเพิ่ม)
    op.alter_column('meeting', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), nullable=True)
    op.alter_column('meeting', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), nullable=True)
    op.alter_column('meeting', 'status', existing_type=sa.Enum('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', name='meetingstatus'), type_=sa.VARCHAR(), existing_nullable=False)
    op.drop_column('meeting', 'quorum_required')
    op.drop_column('meeting', 'meeting_type')
    op.drop_column('meeting', 'end_time')
    op.drop_column('meeting', 'start_time')
    op.drop_column('meeting', 'title')
    
    meeting_type_enum = sa.Enum('EXPEDITED', 'FULL_BOARD', name='meetingtype')
    meeting_type_enum.drop(op.get_bind(), checkfirst=True)
    meeting_status_enum = sa.Enum('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', name='meetingstatus')
    meeting_status_enum.drop(op.get_bind(), checkfirst=True)

    # 6. ย้อนกลับ InstitutionSetting, FollowUpReport, FileStorageSetting
    op.alter_column('institutionsetting', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('institutionsetting', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('followupreport', 'status', existing_type=sa.Enum('OPEN', 'RESOLVED', name='followupstatus'), type_=sa.VARCHAR(), existing_nullable=False)
    op.alter_column('followupreport', 'report_type', existing_type=sa.Enum('PROGRESS', 'ADVERSE_EVENT', 'CLOSURE', name='followuptype'), type_=sa.VARCHAR(), existing_nullable=False)
    op.alter_column('filestoragesetting', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('filestoragesetting', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)

    # 5. ย้อนกลับ Document
    op.drop_constraint('fk_document_uploaded_by_id', 'document', type_='foreignkey')
    op.drop_constraint('fk_document_submission_id_new', 'document', type_='foreignkey')
    op.create_foreign_key(op.f('fk_document_submission_id'), 'document', 'protocolsubmission', ['submission_id'], ['id'], ondelete='SET NULL')
    op.alter_column('document', 'document_type', existing_type=sa.Enum('SUBMISSION_FORM', 'SELF_ASSESSMENT', 'CONSENT_FORM', 'FULL_PROTOCOL', 'PI_CV', 'QUESTIONNAIRE', 'COI_FORM', 'BUDGET', 'SHORT_PROTOCOL', 'INVESTIGATOR_BROCHURE', 'THESIS_APPROVAL', 'RECRUITMENT_MATERIAL', 'MEDICAL_DEVICE_APPROVAL', 'FREE_SALE_CERT', 'INVESTIGATIONAL_DRUG', 'DRUG_APPROVAL', 'OTHER_REC_APPROVAL', 'ELECTRONIC_COPY', 'OTHER', name='documenttype'), type_=sa.VARCHAR(), existing_nullable=False)
    op.alter_column('document', 'submission_id', existing_type=sa.UUID(), nullable=True)
    op.drop_column('document', 'uploaded_by_id')
    op.drop_column('document', 'mime_type')
    op.drop_column('document', 'file_size')

    # 4. ย้อนกลับ Department
    op.drop_index(op.f('ix_department_name'), table_name='department')
    op.create_index(op.f('ix_department_name'), 'department', ['name'], unique=False)
    op.create_unique_constraint(op.f('department_name_key'), 'department', ['name'], postgresql_nulls_not_distinct=False)
    op.alter_column('department', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('department', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)

    # 3. ย้อนกลับ Certificate
    op.drop_constraint('fk_certificate_issued_by_id', 'certificate', type_='foreignkey')
    op.drop_constraint('fk_certificate_submission_id', 'certificate', type_='foreignkey')
    op.drop_constraint('fk_certificate_protocol_id', 'certificate', type_='foreignkey')
    op.create_foreign_key(op.f('certificate_issued_by_id_fkey'), 'certificate', 'user', ['issued_by_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('certificate_submission_id_fkey'), 'certificate', 'protocolsubmission', ['submission_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('certificate_protocol_id_fkey'), 'certificate', 'protocol', ['protocol_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('ix_certificate_certificate_number'), table_name='certificate')
    op.create_index(op.f('ix_certificate_certificate_number'), 'certificate', ['certificate_number'], unique=False)
    op.create_unique_constraint(op.f('certificate_certificate_number_key'), 'certificate', ['certificate_number'], postgresql_nulls_not_distinct=False)
    op.alter_column('certificate', 'updated_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('certificate', 'created_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('certificate', 'issued_at', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('certificate', 'expiry_date', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)
    op.alter_column('certificate', 'issue_date', existing_type=sqlmodel.sql.sqltypes.UTCDateTime(), type_=postgresql.TIMESTAMP(), existing_nullable=False)

    # 2. ลบตาราง secretarysummary
    op.drop_table('secretarysummary')
    
    # 1. ลบตาราง meetingattendance
    op.drop_table('meetingattendance')