# 🏥 ระบบบริหารจัดการงานวิจัย (Institutional Review Board - IRB System)

ระบบ Full-Stack สำหรับจัดการโครงการวิจัยและขออนุมัติจริยธรรมการวิจัยในคน (IRB) ออกแบบมาเพื่อใช้ในโรงพยาบาลหรือสถาบันการศึกษา โดยเน้นความปลอดภัยของข้อมูลสุขภาพ (PDPA) การแยกสิทธิ์การเข้าถึง (Role-based Access Control) และการบันทึกประวัติการทำงาน (Audit Log)

## 🚀 Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + Axios
- **Backend:** FastAPI (Python 3.12) + SQLAlchemy + Pydantic
- **Database:** PostgreSQL 16
- **Authentication:** JWT (JSON Web Tokens) + Bcrypt (Direct hashing)
- **Infrastructure:** Docker & Docker Compose, Nginx (Reverse Proxy)

## ✨ ฟีเจอร์หลัก (Features)

1. **ระบบยืนยันตัวตน (Authentication):** ลงทะเบียนและเข้าสู่ระบบด้วย JWT
2. **ระบบแยกสิทธิ์ 4 ระดับ (Role-based Access Control):**
   - `admin`: ผู้ดูแลระบบ (จัดการทุกอย่าง)
   - `irb_officer`: เจ้าหน้าที่ IRB (ตรวจสอบและอนุมัติโครงการ)
   - `pi`: ผู้วิจัยหลัก (สร้างโครงการ, อัปโหลดเอกสาร)
   - `assistant`: ผู้ช่วยนักวิจัย (ดูโครงการ, อัปโหลดเอกสาร)
3. **ระบบจัดการโครงการวิจัย (Project Management):** สร้าง, ดูรายการ, ติดตามสถานะ
4. **ระบบอัปโหลดเอกสาร (Document Upload):** แนบไฟล์ PDF เอกสารอนุมัติจาก IRB
5. **ระบบอนุมัติโครงการ (Approval Workflow):** เจ้าหน้าที่ IRB กดอนุมัติโครงการได้
6. **ระบบป้องกันผลประโยชน์ทับซ้อน (Prevent Self-Approval):** บล็อกไม่ให้เจ้าหน้าที่อนุมัติโครงการของตัวเอง
7. **ระบบบันทึกประวัติ (Audit Log):** บันทึกการทำงานสำคัญลงฐานข้อมูลเพื่อการตรวจสอบย้อนหลัง

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
.
├── app/                    # FastAPI Backend
│   ├── main.py             # จุดเริ่มต้นแอปพลิเคชัน + CORS
│   ├── models.py           # โครงสร้างฐานข้อมูล (User, Project, AuditLog)
│   ├── database.py         # การเชื่อมต่อ Database
│   └── routers/            # API Endpoints (auth, projects, admin)
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── api.js          # ตั้งค่า Axios
│   │   ├── store/          # จัดการ State (AuthContext)
│   │   ├── components/     # UI Components (Navbar)
│   │   └── pages/          # หน้าจอต่างๆ (auth, projects, irb)
│   └── nginx.conf          # ตั้งค่า Proxy ไปยัง Backend
├── uploads/                # โฟลเดอร์เก็บไฟล์ PDF (ผูกกับ Docker Volume)
├── backup.sql              # ไฟล์ SQL สำหรับสร้างตารางและข้อมูลตัวอย่าง
├── docker-compose.yml      # ไฟล์ตั้งค่า Container ทั้งหมด
└── README.md
```

## 🛠️ การติดตั้งและรันระบบ (Quickstart)

### สิ่งที่ต้องมี (Prerequisites)

- Docker และ Docker Compose (แนะนำ Docker Desktop เวอร์ชันล่าสุด)
- WSL2 (หากใช้ Windows)

### ขั้นตอนการติดตั้ง

1. **Clone โปรเจกต์:**

   ```bash
   git clone <your-repository-url>
   cd IRB
   ```

2. **ตั้งค่า Environment Variables:** คัดลอกไฟล์ตัวอย่างและแก้ไขรหัสผ่านฐานข้อมูล

   ```bash
   cp .env.example .env
   ```

3. **รันระบบด้วย Docker Compose:**

   ```bash
   docker compose up -d --build
   ```

4. **นำเข้าข้อมูลตัวอย่าง (Database Migration):**

   ```bash
   docker compose exec -T db psql -U app -d appdb < backup.sql
   ```

5. **เข้าใช้งานระบบ:**

   | บริการ | URL |
   | --- | --- |
   | Frontend (หน้าเว็บ) | http://localhost:8080 |
   | Backend (API Docs) | http://localhost:8000/docs |
   | pgAdmin (จัดการ DB) | http://localhost:5051 |

## 🔑 บัญชีทดสอบ (Test Accounts)

หลังจากนำเข้า `backup.sql` คุณสามารถล็อกอินได้ด้วยบัญชีเหล่านี้ (รหัสผ่านทุกบัญชีคือ `password123`):

| Username | Password | Role | สิทธิ์การใช้งาน |
| --- | --- | --- | --- |
| `admin` | `password123` | Admin | ดู/อนุมัติทุกโครงการ, จัดการระบบ |
| `irb_officer1` | `password123` | IRB Officer | ดู/อนุมัติทุกโครงการ |
| `doctor1` | `password123` | PI | สร้างโครงการ, อัปโหลดไฟล์ |
| `assistant1` | `password123` | Assistant | ดูโครงการ, อัปโหลดไฟล์ |

> ⚠️ **คำเตือน:** บัญชีและรหัสผ่านเหล่านี้ใช้สำหรับการพัฒนาและทดสอบบนเครื่องเท่านั้น **ห้ามนำไปใช้ใน Production** ต้องลบหรือเปลี่ยนรหัสผ่านก่อนเปิดใช้งานจริงทุกครั้ง

## ⚙️ การตั้งค่าที่สำคัญ (Environment Variables)

สร้างไฟล์ `.env` ที่โฟลเดอร์หลัก โดยมีตัวแปรหลักดังนี้:

```env
# Database
POSTGRES_USER=app
POSTGRES_PASSWORD=secret
POSTGRES_DB=appdb

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin
```

> ค่าข้างต้นเป็นเพียงตัวอย่างสำหรับ Development ควรเปลี่ยนเป็นรหัสผ่านที่คาดเดายากก่อนใช้งานจริง

## 🔒 ข้อควรระวังด้านความปลอดภัย (Security Notes)

- **ข้อมูลสุขภาพ:** ระบบนี้ออกแบบให้แยกไฟล์ PDF ออกจากฐานข้อมูล (เก็บใน `/uploads` แทนการเก็บ Binary ใน DB)
- **รหัสผ่าน:** ใช้ `bcrypt` ในการ Hash รหัสผ่านโดยตรง ไม่ผ่านไลบรารีที่หมดอายุ (เช่น `passlib`)
- **JWT Secret:** ก่อนนำขึ้น Production ควรเปลี่ยน `SECRET_KEY` ใน `app/routers/auth.py` เป็นค่าที่คาดเดายาก และย้ายไปเก็บใน `.env`
- **PDPA:** ควรเพิ่มระบบลบข้อมูลส่วนบุคคล (Right to Erasure) และการขอความยินยอม (Consent) ในเฟสถัดไป

## 🗺️ แผนพัฒนาในอนาคต (Roadmap)

- [ ] ระบบบันทึกและแสดงผล Audit Log บนหน้าเว็บ
- [ ] ระบบ Two-Factor Authentication (MFA) ด้วย TOTP
- [ ] ระบบแจ้งเตือนอัตโนมัติเมื่อโครงการใกล้หมดอายุ
- [ ] ระบบดาวน์โหลดและตรวจสอบไฟล์ PDF สำหรับเจ้าหน้าที่
- [ ] ระบบจัดการเวอร์ชันของเอกสาร (Document Versioning)

## 1. ลบโฟลเดอร์ Git เก่าทิ้ง (ล้างประวัติทั้งหมด)
```bash
rm -rf .git
```

## 2. เริ่มต้น Git ใหม่
```bash
git init
```

docker compose logs -f backend
docker compose up -d --build 

