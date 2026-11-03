# 🏥 ระบบบริหารจัดการงานวิจัยและจริยธรรมการวิจัย (IRB & Meeting Management System)

ระบบ Full-Stack สำหรับจัดการโครงการวิจัย ขออนุมัติจริยธรรมการวิจัยในคน (IRB) และ ระบบจัดการประชุมคณะกรรมการ ออกแบบมาเพื่อใช้ในโรงพยาบาลหรือสถาบันการศึกษา โดยเน้นความปลอดภัยของข้อมูล (PDPA) การแยกสิทธิ์การเข้าถึง (Role-based Access Control) และการบันทึกประวัติการทำงาน (Audit Log)

## 🚀 Tech Stack
- Frontend: React (Vite) + Tailwind CSS + Axios + React Router
- Backend: FastAPI (Python 3.12) + SQLAlchemy + Pydantic
- Database: PostgreSQL 16
- Authentication: JWT (JSON Web Tokens) + Bcrypt
- Infrastructure: Docker & Docker Compose, Nginx (Reverse Proxy)

## ✨ ฟีเจอร์หลัก (Features)

### 🔐 ระบบยืนยันตัวตนและสิทธิ์ (Authentication & Authorization)
- ลงทะเบียนและเข้าสู่ระบบด้วย JWT
- ระบบแยกสิทธิ์ 5 ระดับ (Role-based Access Control):
    - admin: ผู้ดูแลระบบ (จัดการทุกอย่าง, จัดการสถานที่ประชุม)
    - irb_officer: เจ้าหน้าที่ IRB (ตรวจสอบ, อนุมัติโครงการ, จัดการนัดประชุม, เช็กชื่อกรรมการ)
    - committee: กรรมการจริยธรรม (เข้าร่วมประชุม, ลงมติพิจารณาโครงการ)
    - pi: ผู้วิจัยหลัก (สร้างโครงการ, อัปโหลดเอกสาร)
    - assistant: ผู้ช่วยนักวิจัย (ดูโครงการ, อัปโหลดเอกสาร)
- ระบบป้องกันผลประโยชน์ทับซ้อน (Prevent Self-Approval)

### 📁 ระบบจัดการโครงการวิจัย (Project Management)
- สร้าง, ดูรายการ, ติดตามสถานะโครงการ
- ระบบอัปโหลดเอกสาร 10 ประเภท (PDF)
- ระบบอนุมัติโครงการและออกใบรับรอง (Approval Workflow)

### 📅 ระบบจัดการประชุมคณะกรรมการ (Meeting Management System)
- จัดการสถานที่: Admin สามารถเพิ่ม/แก้ไข/ลบห้องประชุมและความจุได้
- สร้างนัดประชุม: แยกฟิลด์วันที่, เวลาเริ่ม, เวลาสิ้นสุด และเลือกสถานที่จาก Dropdown
- เช็กชื่อและ Quorum: ระบบสร้างรายชื่อกรรมการอัตโนมัติ คำนวณองค์ประชุม (Quorum) แบบ Real-time
- บันทึกมติ: ลงมติ (อนุมัติ/อนุมัติมีเงื่อนไข/แก้ไข/ไม่อนุมัติ/เลื่อน) พร้อมเหตุผล และอัปเดตสถานะโครงการทันที
- ประวัติย้อนหลัง: ตารางสรุปมติที่ประชุมพร้อมระบบกรอง (Filter) ตามวันที่และประเภทมติ
- ลบการประชุม: สามารถลบการประชุมที่ยังไม่มีมติบันทึกได้

### 📊 ระบบบันทึกประวัติ (Audit Log)
- บันทึกการทำงานสำคัญลงฐานข้อมูลเพื่อการตรวจสอบย้อนหลัง

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

.
├── backend/                    # FastAPI Backend (Refactored from app/)
│   ├── main.py                 # จุดเริ่มต้นแอปพลิเคชัน + CORS + Router Registration
│   ├── models.py               # โครงสร้างฐานข้อมูล (User, Project, Meeting, Location, etc.)
│   ├── database.py             # การเชื่อมต่อ Database
│   ├── schemas/                # Pydantic Schemas (meeting.py, assessment.py)
│   └── routers/                # API Endpoints 
│       ├── auth.py             # ล็อกอิน/ลงทะเบียน
│       ├── projects.py         # จัดการโครงการ
│       ├── admin.py            # จัดการระบบ
│       ├── assessments.py      # แบบประเมิน
│       ├── meetings.py         # ระบบจัดการประชุม
│       └── locations.py        # จัดการสถานที่ประชุม
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api.js              # ตั้งค่า Axios Instance
│   │   ├── store/              # จัดการ State (AuthContext)
│   │   ├── components/         # UI Components (Navbar, meetings/*)
│   │   └── pages/              # หน้าจอต่างๆ (auth, projects, irb, meetings, admin)
│   └── nginx.conf              # ตั้งค่า Proxy ไปยัง Backend
├── uploads/                    # โฟลเดอร์เก็บไฟล์ PDF (ผูกกับ Docker Volume)
├── backup.sql                  # ไฟล์ SQL สำหรับสร้างตารางและข้อมูลตัวอย่าง
├── docker-compose.yml          # ไฟล์ตั้งค่า Container ทั้งหมด
└── README.md

## 🛠️ การติดตั้งและรันระบบ (Quickstart)

### สิ่งที่ต้องมี (Prerequisites)
- Docker และ Docker Compose (แนะนำ Docker Desktop เวอร์ชันล่าสุด)
- WSL2 (หากใช้ Windows)

### ขั้นตอนการติดตั้ง

1. Clone โปรเจกต์:
    git clone <your-repository-url>
    cd IRB

2. ตั้งค่า Environment Variables: คัดลอกไฟล์ตัวอย่างและแก้ไขรหัสผ่านฐานข้อมูล
    cp .env.example .env

3. รันระบบด้วย Docker Compose:
    docker compose up -d --build

4. นำเข้าข้อมูลตัวอย่าง (Database Migration):
    docker compose exec -T db psql -U app -d appdb < backup.sql

5. เข้าใช้งานระบบ:
    บริการ                  URL
    Frontend (หน้าเว็บ)     http://localhost:8080
    Backend (API Docs)      http://localhost:8000/docs
    pgAdmin (จัดการ DB)     http://localhost:5051

## 🔑 บัญชีทดสอบ (Test Accounts)

หลังจากนำเข้า backup.sql คุณสามารถล็อกอินได้ด้วยบัญชีเหล่านี้ (รหัสผ่านทุกบัญชีคือ password123):

Username        Password      Role          สิทธิ์การใช้งาน
admin           password123   Admin         ดู/อนุมัติทุกโครงการ, จัดการระบบ, จัดการสถานที่ประชุม
irb_officer1    password123   IRB Officer   ดู/อนุมัติโครงการ, สร้างนัดประชุม, เช็กชื่อกรรมการ
committee1      password123   Committee     เข้าร่วมประชุม, ลงมติพิจารณาโครงการ
doctor1         password123   PI            สร้างโครงการ, อัปโหลดไฟล์
assistant1      password123   Assistant     ดูโครงการ, อัปโหลดไฟล์

คำเตือน: บัญชีและรหัสผ่านเหล่านี้ใช้สำหรับการพัฒนาและทดสอบบนเครื่องเท่านั้น ห้ามนำไปใช้ใน Production ต้องลบหรือเปลี่ยนรหัสผ่านก่อนเปิดใช้งานจริงทุกครั้ง

## ⚙️ การตั้งค่าที่สำคัญ (Environment Variables)

สร้างไฟล์ .env ที่โฟลเดอร์หลัก โดยมีตัวแปรหลักดังนี้:

    # Database
    POSTGRES_USER=app
    POSTGRES_PASSWORD=secret
    POSTGRES_DB=appdb

    # pgAdmin
    PGADMIN_DEFAULT_EMAIL=admin@example.com
    PGADMIN_DEFAULT_PASSWORD=admin

ค่าข้างต้นเป็นเพียงตัวอย่างสำหรับ Development ควรเปลี่ยนเป็นรหัสผ่านที่คาดเดายากก่อนใช้งานจริง

## 🔒 ข้อควรระวังด้านความปลอดภัย (Security Notes)

- ข้อมูลสุขภาพ: ระบบนี้ออกแบบให้แยกไฟล์ PDF ออกจากฐานข้อมูล (เก็บใน /uploads แทนการเก็บ Binary ใน DB)
- รหัสผ่าน: ใช้ bcrypt ในการ Hash รหัสผ่านโดยตรง ไม่ผ่านไลบรารีที่หมดอายุ (เช่น passlib)
- JWT Secret: ก่อนนำขึ้น Production ควรเปลี่ยน SECRET_KEY ใน backend/routers/auth.py เป็นค่าที่คาดเดายาก และย้ายไปเก็บใน .env
- PDPA: ควรเพิ่มระบบลบข้อมูลส่วนบุคคล (Right to Erasure) และการขอความยินยอม (Consent) ในเฟสถัดไป

## 🗺️ แผนพัฒนาในอนาคต (Roadmap)

- [x] ระบบจัดการประชุมคณะกรรมการ (Meeting Management System)
- [ ] ระบบบันทึกและแสดงผล Audit Log บนหน้าเว็บ
- [ ] ระบบ Two-Factor Authentication (MFA) ด้วย TOTP
- [ ] ระบบแจ้งเตือนอัตโนมัติเมื่อโครงการใกล้หมดอายุ
- [ ] ระบบ Export รายงานการประชุมเป็น PDF (Meeting Minutes)
- [ ] ระบบจัดการเวอร์ชันของเอกสาร (Document Versioning)

## 💡 คำสั่งพัฒนาที่พบบ่อย (Common Dev Commands)

รีเซ็ต Git History (ล้างประวัติเก่าทั้งหมดและเริ่มใหม่):
    rm -rf .git
    git init

ดู Logs เพื่อตรวจสอบข้อผิดพลาด:
    docker compose logs backend --tail=50
    docker compose logs -f backend

Rebuild ระบบหลังจากแก้ไขโครงสร้างหรือเพิ่มไฟล์ใหม่:
    docker compose up -d --build

🎯 ตัวอย่าง Prompt ที่สมบูรณ์แบบ (Copy ไปใช้ได้เลย)
"ช่วยสร้างไฟล์ README.md สำหรับโปรเจกต์ IRB System โดยมีเงื่อนไขดังนี้:

ส่งออกมาเป็น Code Block เดียว (Single Code Block) เท่านั้น

ห้ามใช้ ``` ซ้อนข้างในเด็ดขาด (No Nested Code Blocks)

หากมีตัวอย่างโค้ด (Python/JS/Bash) ให้ใช้ การย่อหน้า 4 spaces แทนการครอบด้วย Backtick