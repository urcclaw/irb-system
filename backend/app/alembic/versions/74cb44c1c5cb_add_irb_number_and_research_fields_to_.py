"""add irb_number and research fields to protocol

Revision ID: (ไม่ต้องแก้ Alembic จะใส่ให้)
Revises: 820d7adb7f13
Create Date: 2026-11-26

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '74cb44c1c5cb'  # 👈 แก้เป็นรหัสจริงจากบรรทัดบน
down_revision = '820d7adb7f13'
branch_labels = None
depends_on = None


def upgrade():
    # 1. เพิ่มคอลัมน์ irb_number
    op.add_column('protocol', sa.Column('irb_number', sa.String(length=50), nullable=True))
    
    # 2. เพิ่มคอลัมน์ research_purpose
    op.add_column('protocol', sa.Column('research_purpose', sa.String(length=100), nullable=True))
    
    # 3. เพิ่มคอลัมน์ researcher_type
    op.add_column('protocol', sa.Column('researcher_type', sa.String(length=50), nullable=True))
    
    # 4. สร้าง Unique Index สำหรับ irb_number
    op.create_index('ix_protocol_irb_number', 'protocol', ['irb_number'], unique=True)


def downgrade():
    # ย้อนกลับ: ลบ Index และลบคอลัมน์ที่เพิ่มมา
    op.drop_index('ix_protocol_irb_number', table_name='protocol')
    op.drop_column('protocol', 'researcher_type')
    op.drop_column('protocol', 'research_purpose')
    op.drop_column('protocol', 'irb_number')