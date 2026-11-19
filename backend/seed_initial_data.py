"""
Seed ข้อมูลเริ่มต้นสำหรับระบบ IRB
รัน: cd backend && uv run python seed_initial_data.py
"""
from datetime import datetime, UTC
from sqlmodel import Session, select
from app.core.db import engine
from app.models import (
    ResearchPurposeOption, Department, ReviewTypeOption,
    InstitutionSetting, FileStorageSetting, StorageType
)


def seed_data():
    with Session(engine) as session:
        print("🌱 กำลัง Seed ข้อมูลเริ่มต้น...")

        # 1. Research Purpose Options
        purposes = [
            {"name": "เพื่อขอตำแหน่งทางวิชาการ (อวช.)", "display_order": 1},
            {"name": "เพื่อการศึกษาต่อ", "display_order": 2},
            {"name": "วิจัยทั่วไป", "display_order": 3},
            {"name": "อื่นๆ", "display_order": 4},
        ]
        for p in purposes:
            if not session.exec(select(ResearchPurposeOption).where(ResearchPurposeOption.name == p["name"])).first():
                session.add(ResearchPurposeOption(**p))
        print("✅ Research Purpose Options")

        # 2. Departments (ตัวอย่างแผนก รพ.มะเร็งลพบุรี)
        departments = [
            {"name": "ภารกิจด้านอํานวยการ", "display_order": 1},
            {"name": "ภารกิจด้านวิชาการและการแพทย์", "display_order": 2},
            {"name": "ภารกิจด้านการพยาบาล", "display_order": 3},
            {"name": "ภารกิจด้านการพัฒนาระบบสุขภาพ", "display_order": 4},
        ]
        for d in departments:
            if not session.exec(select(Department).where(Department.name == d["name"])).first():
                session.add(Department(**d))
        print("✅ Departments")

        # 3. Review Type Options
        review_types = [
            {"name": "Full Board", "description": "พิจารณาโดยคณะกรรมการเต็มคณะ", "display_order": 1},
            {"name": "Expedited", "description": "พิจารณาแบบรวดเร็ว", "display_order": 2},
            {"name": "Exempt", "description": "ได้รับการยกเว้นการพิจารณา", "display_order": 3},
        ]
        for rt in review_types:
            if not session.exec(select(ReviewTypeOption).where(ReviewTypeOption.name == rt["name"])).first():
                session.add(ReviewTypeOption(**rt))
        print("✅ Review Type Options")

        # 4. Institution Setting (ตั้งค่าเริ่มต้น)
        inst = session.exec(select(InstitutionSetting)).first()
        if not inst:
            inst = InstitutionSetting(
                irb_prefix="REC",
                irb_format="{prefix} {seq:03d}/{year}",
                hospital_name="โรงพยาบาลมะเร็งลพบุรี กรมการแพทย์ กระทรวงสาธารณสุข",
                hospital_name_en="Lopburi Cancer Hospital, Department of Medical Services, Ministry of Public Health",
                logo_url="/logo.png",
                current_year=2569,
                sequence_counter=0
            )
            session.add(inst)
            print("✅ Institution Setting")

        # 5. File Storage Setting (ตั้งค่าเริ่มต้น)
        storage = session.exec(select(FileStorageSetting)).first()
        if not storage:
            storage = FileStorageSetting(
                storage_type=StorageType.LOCAL,
                base_path="/var/irb-storage"
            )
            session.add(storage)
            print("✅ File Storage Setting")

        session.commit()
        print("\n🎉 Seed ข้อมูลเริ่มต้นสำเร็จ!")


if __name__ == "__main__":
    seed_data()