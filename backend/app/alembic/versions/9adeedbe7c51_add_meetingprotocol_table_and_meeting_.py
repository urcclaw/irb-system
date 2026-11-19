"""add meetingprotocol table and meeting timestamps

Revision ID: 9adeedbe7c51
Revises: dc5e6565cfd2
Create Date: 2026-11-19 11:46:50.858681

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql  # 👈 เพิ่มบรรทัดนี้


# revision identifiers, used by Alembic.
revision = '9adeedbe7c51'
down_revision = 'dc5e6565cfd2'
branch_labels = None
depends_on = None


def upgrade():
    # 1. เพิ่มคอลัมน์ timestamp เข้าไปในตาราง meeting
    op.add_column('meeting', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('meeting', sa.Column('updated_at', sa.DateTime(), nullable=True))

    # 2. สร้างตาราง meetingprotocol (Junction Table)
    # 👉 ใช้ postgresql.ENUM และ create_type=False เพื่อบอกว่า "ใช้อันที่มีอยู่แล้ว ห้ามสร้างใหม่"
    decisiontype_enum = postgresql.ENUM(
        'APPROVE', 'REVISE', 'REJECT', 'DEFER', 
        name='decisiontype', 
        create_type=False
    )

    op.create_table('meetingprotocol',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('meeting_id', sa.Uuid(), nullable=False),
        sa.Column('protocol_id', sa.Uuid(), nullable=False),
        sa.Column('decision', decisiontype_enum, nullable=True),  # 👉 ใช้ตัวแปรนี้
        sa.Column('comments', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('agenda_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['meeting_id'], ['meeting.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['protocol_id'], ['protocol.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # ย้อนกลับ: ลบตาราง และลบคอลัมน์ที่เพิ่มมา
    op.drop_table('meetingprotocol')
    op.drop_column('meeting', 'updated_at')
    op.drop_column('meeting', 'created_at')