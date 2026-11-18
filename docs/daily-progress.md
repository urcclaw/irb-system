# =====================================================================
# FILE: daily-progress.md
# =====================================================================
# Daily Progress Log (บันทึกความคืบหน้า)

ไฟล์นี้ใช้บันทึกความคืบหน้าการพัฒนาระบบ IRB Management System ในแต่ละวัน

---

## 2026-11-18 (วันอังคาร)

### งานที่ทำเสร็จ (Completed)
- วิเคราะห์โครงสร้างของ Full Stack FastAPI Template
- ออกแบบระบบ IRB เบื้องต้น (Roles, Permissions, Workflow)
- เปลี่ยนบทบาทจาก Chairperson เป็น Secretary (เลขานุการ)
- เขียน Requirements Specification (requirements.md)
- สร้าง Branch ใหม่ feature/part1-db-schema-and-rls
- เขียนไฟล์เอกสาร: README.md, commands.md, daily-progress.md

### ปัญหาที่เจอ (Blockers)
- ยังไม่ได้เริ่มเขียน Schema ฐานข้อมูลจริง

### งานถัดไป (Next Steps)
- เขียน backend/app/models.py (Protocol, Document, ReviewAssignment, Meeting, Certificate)
- สร้าง Migration ด้วย Alembic
- ทดสอบการทำงานของ PostgreSQL และ RLS

---

## Template (เทมเพลตสำหรับวันถัดไป)

    ## YYYY-MM-DD (วัน)

    ### งานที่ทำเสร็จ (Completed)
    - [รายการงาน]

    ### ปัญหาที่เจอ (Blockers)
    - [ปัญหาและวิธีแก้ไข]

    ### งานถัดไป (Next Steps)
    - [รายการงาน]

    ### Notes
    - [บันทึกเพิ่มเติม]

