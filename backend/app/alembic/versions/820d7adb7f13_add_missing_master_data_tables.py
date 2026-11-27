"""add missing master data tables

Revision ID: (ไม่ต้องแก้ Alembic จะใส่ให้)
Revises: e65df4112943
Create Date: 2026-11-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '820d7adb7f13'  # 👈 แก้เป็นรหัสจริงจากบรรทัดบน
down_revision = 'e65df4112943'
branch_labels = None
depends_on = None


def upgrade():
    # 1. สร้างตาราง researchpurposeoption
    op.create_table('researchpurposeoption',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_researchpurposeoption_name', 'researchpurposeoption', ['name'])

    # 2. สร้างตาราง department
    op.create_table('department',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_department_name', 'department', ['name'])

    # 3. สร้างตาราง reviewtypeoption
    op.create_table('reviewtypeoption',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_reviewtypeoption_name', 'reviewtypeoption', ['name'])

    # 4. สร้างตาราง institutionsetting
    op.create_table('institutionsetting',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('irb_prefix', sa.String(length=20), nullable=False),
        sa.Column('irb_format', sa.String(length=100), nullable=False),
        sa.Column('hospital_name', sa.String(length=255), nullable=False),
        sa.Column('hospital_name_en', sa.String(length=255), nullable=True),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('current_year', sa.Integer(), nullable=False),
        sa.Column('sequence_counter', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('institutionsetting')
    op.drop_table('reviewtypeoption')
    op.drop_table('department')
    op.drop_table('researchpurposeoption')