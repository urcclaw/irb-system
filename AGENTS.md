# AGENTS.md - IRB System Context for AI Agents

## 🎯 Project Overview
ระบบบริหารจัดการงานวิจัยและจริยธรรมการวิจัยในคน (Institutional Review Board - IRB) 
สำหรับโรงพยาบาลมะเร็งลพบุรี พัฒนาด้วย FastAPI + React + PostgreSQL

Domain: Healthcare / Research Ethics  
Compliance: PDPA (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล), IRB Standards  
Language: Thai (UI), English (Code comments)

---

## 🏗️ Architecture

### Tech Stack
- Backend: FastAPI (Python 3.12), SQLAlchemy 2.x, psycopg3, reportlab, xhtml2pdf
- Frontend: React 18 (Vite), Tailwind CSS, Axios, react-tailwindcss-datepicker
- Database: PostgreSQL 16
- Infrastructure: Docker Compose, Nginx (reverse proxy)
- Auth: JWT (python-jose) + bcrypt (direct, no passlib)

### Services (docker-compose.yml)
| Service | Port | Description |
|:---|:---|:---|
| frontend | 8080 | Nginx + React build |
| backend | 8000 | FastAPI (Uvicorn) |
| db | 5433 (host) → 5432 (internal) | PostgreSQL |
| pgadmin | 5051 | Database admin UI |

### Directory Structure
    /backend
      /routers
        auth.py       # JWT authentication, user registration
        admin.py      # All admin/IRB operations (projects, EC assessment, reports)
        projects.py   # PI/assistant operations (create project, upload docs)
        meetings.py   # Meeting management system
        locations.py  # Meeting location management
      /models.py      # SQLAlchemy models
      /database.py    # DB session/engine
      /main.py        # FastAPI app entry + CORS
      /schemas/       # Pydantic models (meeting.py, assessment.py)

    /frontend
      /src
        /pages
          /auth       # Login, Register
          /projects   # PI Dashboard
          /irb        # IRB Officer & Committee Dashboards
          /admin      # System Settings, User Management, Backup, Locations
          /meetings   # Meeting Dashboard, Detail, Create, History
        /store/auth.jsx  # JWT context provider
        /api.js          # Axios instance with baseURL /api

---

## 👥 User Roles (5 Roles)

| Role | Thai Name | Permissions |
|:---|:---|:---|
| pi | ผู้วิจัยหลัก | Create projects, upload documents, request renewal/closure |
| assistant | ผู้ช่วยนักวิจัย | View projects, upload documents |
| irb_officer | เจ้าหน้าที่ IRB | Screen projects, generate certificates, manage documents, manage meetings |
| committee | กรรมการ IRB | Submit EC assessment, provide opinions, attend meetings, vote |
| admin | ผู้ดูแลระบบ | System settings, user management, backup/restore, manage locations |

---

## 🔄 Project Workflow & Status

### Status Flow
    pending_docs → under_review → forwarded → approved
                        ↓              ↓
                  needs_revision ← (revision)
                        ↓
                  disapproved

| Status | Meaning | Next Action |
|:---|:---|:---|
| pending_docs | ผู้วิจัยสร้างโครงการ รอแนบเอกสาร | PI อัปโหลดเอกสาร |
| under_review | รอเจ้าหน้าที่ตรวจสอบ | IRB Officer คัดกรอง |
| forwarded | ส่งต่อให้คณะกรรมการ | Committee ทำ EC Assessment |
| needs_revision | ส่งกลับให้แก้ไข | PI แก้ไขและอัปโหลดใหม่ |
| approved | อนุมัติแล้ว | ออกใบรับรอง |
| disapproved | ไม่อนุมัติ | สิ้นสุด |

### Document Types (10 ประเภท)
1. doc_proposal - ข้อเสนอโครงการ
2. doc_submission_form - แบบฟอร์มขอส่งคำร้อง
3. doc_ethics_form - แบบฟอร์มยื่นขอพิจารณา
4. doc_self_assessment - แบบประเมินตนเอง
5. doc_consent_form - เอกสารแสดงความยินยอม
6. doc_info_sheet - เอกสารข้อมูลคำอธิบาย
7. doc_coi_form - แบบฟอร์มผลประโยชน์ทับซ้อน
8. doc_researcher_cv - ประวัติผู้วิจัย
9. doc_renewal_form - ต่ออายุโครงการ (approved only)
10. doc_closure_form - ปิดโครงการ (approved only)

---

## 🎨 Coding Conventions

### Backend (Python/FastAPI)
- Type Hints: Always use Annotated[Type, Depends(...)] for dependencies
- Models: snake_case for DB columns, PascalCase for SQLAlchemy models
- Schemas: Pydantic models in PascalCase, ...Create, ...Update, ...Response suffix
- Routes: Group by feature in routers/, use Depends for permissions
- Errors: Raise HTTPException with Thai detail messages for user-facing errors
- Audit: Always call create_audit_log() for data-changing operations

Example Route with permission check (4-space indent):
    @router.get("/projects/{project_id}/ec-assessments")
    def get_ec_assessments(user: user_dependency, db: db_dependency, project_id: int):
        check_permission(user, ['committee', 'irb_officer', 'admin'])
        # ...

### Frontend (React/Tailwind)
- Components: Functional with hooks only, no class components
- Styling: Tailwind utility classes, no CSS files
- Colors: slate-* for neutral, blue-* for primary, teal-* for EC, purple-* for committee
- Forms: Controlled components with useState
- API: Use api instance from api.js (already has JWT header)
- Thai Text: Always Thai for user-facing text, English for code

Example Button (4-space indent):
    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
      บันทึก
    </button>

### File Naming
- Python: snake_case.py
- React Components: PascalCase.jsx
- Folders: lowercase

---

## 🔒 Security Rules (CRITICAL)

1. Never commit .env - contains DB password, JWT secret
2. Never commit backup.sql - contains password hashes, PII
3. Never commit uploads/ - contains patient/participant PDFs
4. PDPA Compliance: Never log PII (names, IDs, health data) to console
5. File Uploads: 
   - Only accept application/pdf
   - Store in uploads/{year}/{REC}/v{version}/
   - Max size: 50MB (configured in nginx.conf)
6. JWT: 60-minute expiry, HS256 algorithm
7. Password: bcrypt with 12 rounds, never store plaintext

---

## 📊 Database Models (Key Relationships)

    User (1) ──< Project (owner)
    User (1) ──< CommitteeReview (reviewer)
    User (1) ──< ECAssessment (reviewer)
    Project (1) ──< CommitteeReview
    Project (1) ──< ECAssessment
    User (1) ──< MeetingAttendance
    CommitteeMeeting (1) ──< MeetingAgenda
    CommitteeMeeting (1) ──< MeetingAttendance

    SystemSetting (key-value)  # president_name, hospital_name, committee_name
    DocumentTemplate            # No-code templates
    AuditLog                    # All data changes
    MeetingLocation             # id, name, capacity, description, is_active

REC Number Format: REC {number}/{YY} (e.g., REC 1/69 = 2026 BE)

---

## 🧪 Testing Checklist

Before committing, verify:
- [ ] Backend: docker compose logs backend shows Application startup complete
- [ ] Frontend: http://localhost:8080 loads without console errors
- [ ] Login works for all 5 roles (password123)
- [ ] EC Assessment can be submitted by committee
- [ ] IRB Officer can view EC assessments
- [ ] Certificate PDF generates with Thai font
- [ ] Meeting system creates auto-attendance and calculates quorum
- [ ] No .env or backup.sql in git status

---

## 🚀 Common Commands

Start dev environment:
    docker compose up -d --build

View logs:
    docker compose logs -f backend
    docker compose logs -f frontend

Reset database (DESTRUCTIVE):
    docker compose down -v
    docker compose up -d --build
    docker compose exec -T db psql -U app -d appdb < backup.sql

Reset all passwords to 'password123':
    docker compose exec backend python -c "
    import bcrypt, psycopg
    hashed = bcrypt.hashpw('password123'.encode(), bcrypt.gensalt()).decode()
    conn = psycopg.connect(host='db', dbname='appdb', user='app', password='secret')
    cur = conn.cursor()
    cur.execute('UPDATE users SET hashed_password = %s;', (hashed,))
    conn.commit(); cur.close(); conn.close()
    print('Done')
    "

Backup database:
    docker compose exec -T db pg_dump -U app appdb > backup_$(date +%Y%m%d).sql

Access backend shell:
    docker compose exec backend bash

---

## ⚠️ Known Issues & Gotchas

1. Thai font in PDF: Must register THSarabunNew.ttf via pdfmetrics.registerFont(). Garuda image must exist at backend/garuda.png.
2. REC generation: Race condition possible if two PIs create projects simultaneously (no DB lock).
3. EC Assessment JSON: Stored as TEXT (not JSONB). Parse with json.loads() in API.
4. File uploads: Stored in Docker volume, must backup separately from DB.
5. Password reset: passlib was removed (incompatible with bcrypt 4.1+). Use bcrypt directly.
6. Datepicker: Must add react-tailwindcss-datepicker to tailwind.config.js content paths.
7. Schema Imports: schemas is a folder. Always use from schemas.meeting import X, never from schemas import X.
8. Auth Hook: useAuth() returns role directly, not user.role. Use const { role } = useAuth().

---

## 🎯 Feature Roadmap (Not Yet Implemented)

- [ ] MFA (TOTP) for irb_officer and admin
- [ ] Email notifications (project status changes, meeting invites)
- [ ] Audit log UI for admin
- [ ] Document version history
- [ ] Multi-language support (EN/TH)
- [ ] Export meeting minutes to PDF
- [ ] Export reports to Excel

---

## 📞 Key Business Rules

1. Self-approval forbidden: Cannot approve your own project
2. 10 docs required: All 10 documents must be uploaded before forwarded (currently not strictly enforced)
3. Certificate requires: Status must be approved
4. Committee can edit: Their EC assessment before officer finalizes
5. Officer finalizes: After all committee ECs are submitted
6. Thai BE year: Always use Buddhist Era (+543) for REC numbers
7. Quorum Rule: Meeting decisions can only be recorded if present_count >= quorum_required

---

## 🔍 File Lookup Cheat Sheet

| Task | File |
|:---|:---|
| Add new role | models.py (User.role), auth.py (check_permission), Navbar.jsx |
| Change certificate layout | admin.py (generate_certificate) |
| Modify EC form sections | CommitteeDashboard.jsx (scientificTopics, ethicalTopics, etc.) |
| Add new report | admin.py (/reports/*) + IRBDashboard.jsx (sidebar button) |
| Fix login issue | Login.jsx, auth.py (login_for_access_token) |
| Change REC format | admin.py (generate_rec_number) |
| Update system settings | SystemSettings.jsx + admin.py (/settings) |
| Add document type | models.py (Project.doc_*), IRBDashboard.jsx (docTypes array) |
| Add meeting location | locations.py, LocationManagement.jsx |
| Modify meeting logic | meetings.py, MeetingDetail.jsx, AttendanceTable.jsx |



🎯 ตัวอย่าง Prompt ที่สมบูรณ์แบบ (Copy ไปใช้ได้เลย)
"ช่วยสร้างไฟล์ AGENTS.md สำหรับโปรเจกต์ IRB System โดยมีเงื่อนไขดังนี้:

ส่งออกมาเป็น Code Block เดียว (Single Code Block) เท่านั้น

ห้ามใช้ ``` ซ้อนข้างในเด็ดขาด (No Nested Code Blocks)

หากมีตัวอย่างโค้ด (Python/JS/Bash) ให้ใช้ การย่อหน้า 4 spaces แทนการครอบด้วย Backtick

เนื้อหาประกอบด้วย: Overview, Tech Stack, Roles, Workflow, Coding Conventions, Security Rules, Database Models, Testing Checklist, Common Commands, Known Issues, Roadmap, Business Rules, File Lookup

ใช้ภาษาไทยสำหรับคำอธิบาย และภาษาอังกฤษสำหรับชื่อตัวแปร/โค้ด

เป้าหมาย: ผมจะก๊อปปี้โค้ดทั้งหมดไปวางในไฟล์ AGENTS.md ได้ทันทีโดยไม่ต้องแก้ไขรูปแบบ"