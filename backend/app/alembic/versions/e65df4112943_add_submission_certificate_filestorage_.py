"""add submission certificate filestorage tables

Revision ID: e65df4112943
Revises: 9adeedbe7c51
Create Date: 2026-11-19 14:55:04.219632

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'e65df4112943'
down_revision = '9adeedbe7c51'
branch_labels = None
depends_on = None


def upgrade():
    # ==========================================
    # 1. สร้าง Enums (ใช้ create_type=False เพราะบางตัวมีอยู่แล้ว)
    # ==========================================
    
    submissiontype = postgresql.ENUM(
        'INITIAL', 'AMENDMENT', 'RENEWAL', 'CLOSURE',
        'ADVERSE_EVENT', 'PROGRESS_REPORT',
        name='submissiontype', create_type=False
    )
    submissiontype.create(op.get_bind(), checkfirst=True)
    
    submissionstatus = postgresql.ENUM(
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN',
        name='submissionstatus', create_type=False
    )
    submissionstatus.create(op.get_bind(), checkfirst=True)
    
    certificatetype = postgresql.ENUM(
        'INITIAL', 'AMENDMENT', 'RENEWAL', 'CLOSURE',
        name='certificatetype', create_type=False
    )
    certificatetype.create(op.get_bind(), checkfirst=True)
    
    certificatestatus = postgresql.ENUM(
        'ACTIVE', 'EXPIRED', 'REVOKED', 'SUPERSEDED',
        name='certificatestatus', create_type=False
    )
    certificatestatus.create(op.get_bind(), checkfirst=True)
    
    storagetype = postgresql.ENUM(
        'LOCAL', 'FILE_SERVER', 'S3',
        name='storagetype', create_type=False
    )
    storagetype.create(op.get_bind(), checkfirst=True)
    
    # ==========================================
    # 2. Drop ตาราง certificate เดิม (เปลี่ยนโครงสร้างเยอะ)
    # ==========================================
    op.drop_table('certificate')
    
    # ==========================================
    # 3. สร้างตาราง protocolsubmission (ต้องสร้างก่อน certificate เพราะ certificate อ้างอิง)
    # ==========================================
    op.create_table('protocolsubmission',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('protocol_id', sa.Uuid(), nullable=False),
        sa.Column('submission_number', sa.Integer(), nullable=False),
        sa.Column('submission_type', submissiontype, nullable=False),
        sa.Column('status', submissionstatus, nullable=False),
        sa.Column('meeting_id', sa.Uuid(), nullable=True),
        sa.Column('meeting_number', sa.Integer(), nullable=True),
        sa.Column('submission_year', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('cover_letter', sa.String(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_by_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['protocol_id'], ['protocol.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['meeting_id'], ['meeting.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ==========================================
    # 4. สร้างตาราง certificate ใหม่ (ตอนนี้ protocolsubmission มีอยู่แล้ว)
    # ==========================================
    op.create_table('certificate',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('protocol_id', sa.Uuid(), nullable=False),
        sa.Column('submission_id', sa.Uuid(), nullable=False),
        sa.Column('certificate_number', sa.String(length=50), nullable=False),
        sa.Column('certificate_type', certificatetype, nullable=False),
        sa.Column('status', certificatestatus, nullable=False),
        sa.Column('issue_date', sa.DateTime(), nullable=False),
        sa.Column('expiry_date', sa.DateTime(), nullable=False),
        sa.Column('project_title_th', sa.String(), nullable=False),
        sa.Column('project_title_en', sa.String(), nullable=True),
        sa.Column('principal_investigator', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('conditions', sa.JSON(), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('file_name', sa.String(), nullable=True),
        sa.Column('qr_code_data', sa.String(), nullable=True),
        sa.Column('qr_code_image_path', sa.String(), nullable=True),
        sa.Column('issued_by_id', sa.Uuid(), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['protocol_id'], ['protocol.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['submission_id'], ['protocolsubmission.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['issued_by_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('certificate_number')
    )
    op.create_index('ix_certificate_certificate_number', 'certificate', ['certificate_number'])
    
    # ==========================================
    # 5. สร้างตาราง filestoragesetting
    # ==========================================
    op.create_table('filestoragesetting',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('storage_type', storagetype, nullable=False),
        sa.Column('base_path', sa.String(length=500), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ==========================================
    # 6. เพิ่มคอลัมน์ submission_id ในตาราง document
    # ==========================================
    op.add_column('document', sa.Column('submission_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_document_submission_id',
        'document', 'protocolsubmission',
        ['submission_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    # ย้อนกลับตามลำดับตรงข้าม
    op.drop_constraint('fk_document_submission_id', 'document', type_='foreignkey')
    op.drop_column('document', 'submission_id')
    op.drop_table('filestoragesetting')
    op.drop_table('protocolsubmission')
    op.drop_table('certificate')