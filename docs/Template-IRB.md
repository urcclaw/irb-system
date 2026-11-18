# Template-IRB.md
# ระบบ IRB (Institutional Review Board) สำหรับโรงพยาบาลมะเร็งภูมิภาค

---

## 📋 PROJECT OVERVIEW

**Project Name:** IRB Management System (IRB-MS)
**Status:** In Development
**Last Updated:** 2026-11-18
**Repository Base:** https://github.com/fastapi/full-stack-fastapi-template

### Objective
พัฒนาระบบบริหารจัดการจริยธรรมการวิจัยในมนุษย์ (IRB) แบบดิจิทัล เพื่อทดแทนระบบกระดาษ
รองรับมาตรฐาน NHREC, PDPA และสนับสนุนงานวิจัยมะเร็งระยะท้าย (End-of-life care)

### Target Users
1. Researchers (ผู้วิจัย) - ยื่นขอจริยธรรม, ส่ง Amendment, Continuing Review
2. IRB Secretary (เลขานุการ) - Triage งาน, จัดการประชุม, ออกหนังสือรับรอง
3. Reviewers (ผู้ทบทวน) - ตรวจสอบโปรโตคอล, กรอกแบบฟอร์ม ก.1/ก.2
4. Secretary (เลขานุการกรรมการ) - อนุมัติ, เรียกประชุม
5. Admin (ผู้ดูแลระบบ) - จัดการ users, audit logs

---

## 🏗️ TECH STACK

### Backend
    Framework: FastAPI 0.110+
    ORM: SQLModel 0.0.16+
    Validation: Pydantic 2.0+
    Database: PostgreSQL 16 (JSONB support)
    Auth: JWT with HttpOnly Cookies (modified from template default)
    Email: SMTP (hospital email server)

### Frontend
    Framework: React 18+ with TypeScript
    Build Tool: Vite 5+
    UI Library: shadcn/ui + Tailwind CSS
    State Management: TanStack Query
    Routing: TanStack Router
    Form Handling: React Hook Form + Zod

### DevOps
    Containerization: Docker + Docker Compose
    Reverse Proxy: Traefik (Auto HTTPS)
    CI/CD: GitHub Actions
    Testing: Pytest (backend), Playwright (e2e)

### Development Environment
    IDE: Positron (with R/Python/Quarto integration)
    Reference Management: Zotero (API integration planned)
    Knowledge Base: Obsidian (Markdown export support)

---

## 🗂️ DATABASE SCHEMA (PostgreSQL + SQLModel)

### Core Tables

#### users
    id: UUID (PK)
    email: VARCHAR(255) UNIQUE NOT NULL
    full_name: VARCHAR(255) NOT NULL
    hashed_password: VARCHAR(255) NOT NULL
    is_active: BOOLEAN DEFAULT TRUE
    is_superuser: BOOLEAN DEFAULT FALSE
    department: VARCHAR(255)
    created_at: TIMESTAMP DEFAULT NOW()
    updated_at: TIMESTAMP DEFAULT NOW()

#### roles
    id: SERIAL (PK)
    role_name: VARCHAR(50) UNIQUE NOT NULL
    description: TEXT

#### user_roles
    user_id: UUID (FK -> users.id)
    role_id: INTEGER (FK -> roles.id)
    PRIMARY KEY (user_id, role_id)

#### projects
    id: UUID (PK)
    project_code: VARCHAR(50) UNIQUE NOT NULL
    title: TEXT NOT NULL
    pi_id: UUID (FK -> users.id)
    study_type: VARCHAR(50)
    review_type: VARCHAR(50) ENUM('exempt', 'expedited', 'full_board')
    status: VARCHAR(50) DEFAULT 'draft'
    involves_vulnerable_group: BOOLEAN DEFAULT FALSE
    involves_end_of_life_care: BOOLEAN DEFAULT FALSE
    approval_date: DATE NULL
    expiration_date: DATE NULL
    created_at: TIMESTAMP DEFAULT NOW()
    updated_at: TIMESTAMP DEFAULT NOW()
    created_by: UUID (FK -> users.id)
    updated_by: UUID (FK -> users.id)

#### submissions
    id: UUID (PK)
    project_id: UUID (FK -> projects.id)
    version_number: INTEGER NOT NULL
    submission_type: VARCHAR(50) ENUM('initial', 'amendment', 'continuing_review')
    submitted_by: UUID (FK -> users.id)
    submitted_at: TIMESTAMP DEFAULT NOW()
    cover_letter: TEXT

#### documents
    id: UUID (PK)
    submission_id: UUID (FK -> submissions.id)
    doc_type: VARCHAR(50) ENUM('protocol', 'icf', 'crf', 'cv', 'budget')
    file_path: TEXT NOT NULL
    file_hash: VARCHAR(64)
    uploaded_by: UUID (FK -> users.id)
    uploaded_at: TIMESTAMP DEFAULT NOW()

#### reviews
    id: UUID (PK)
    submission_id: UUID (FK -> submissions.id)
    reviewer_id: UUID (FK -> users.id)
    review_form_data: JSONB
    decision: VARCHAR(50) ENUM('approve', 'minor_revision', 'major_revision', 'reject')
    comments: TEXT
    reviewed_at: TIMESTAMP DEFAULT NOW()

#### meetings
    id: UUID (PK)
    meeting_date: DATE NOT NULL
    time: TIME NOT NULL
    location: VARCHAR(255)
    chairperson_id: UUID (FK -> users.id)
    status: VARCHAR(50) DEFAULT 'scheduled'

#### meeting_agendas
    id: UUID (PK)
    meeting_id: UUID (FK -> meetings.id)
    submission_id: UUID (FK -> submissions.id)
    agenda_order: INTEGER
    final_decision: VARCHAR(50)
    meeting_minutes: TEXT

#### project_events
    id: UUID (PK)
    project_id: UUID (FK -> projects.id)
    event_type: VARCHAR(50) ENUM('amendment', 'continuing_review', 'sae', 'protocol_deviation', 'closure')
    event_date: DATE
    description: TEXT
    status: VARCHAR(50)
    submitted_at: TIMESTAMP DEFAULT NOW()

#### audit_logs
    id: BIGSERIAL (PK)
    user_id: UUID (FK -> users.id)
    action: VARCHAR(50)
    table_name: VARCHAR(100)
    record_id: UUID
    old_values: JSONB
    new_values: JSONB
    ip_address: INET
    created_at: TIMESTAMP DEFAULT NOW()

### PostgreSQL Extensions (Required)
    CREATE EXTENSION IF NOT EXISTS "pgaudit";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

### Row-Level Security (RLS) Policies
    -- Researchers can only see their own projects
    CREATE POLICY researcher_project_policy ON projects
      FOR SELECT
      USING (pi_id = current_setting('app.current_user_id')::UUID);
    
    -- Secretaries can see all projects
    CREATE POLICY secretary_project_policy ON projects
      FOR ALL
      USING (current_setting('app.current_role') = 'secretary');

---

## 📁 PROJECT STRUCTURE

    irb-system/
    ├── backend/
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py
    │   │   ├── core/
    │   │   │   ├── config.py
    │   │   │   ├── db.py
    │   │   │   ├── security.py
    │   │   │   └── audit.py
    │   │   ├── models/
    │   │   │   ├── __init__.py
    │   │   │   ├── user.py
    │   │   │   ├── project.py
    │   │   │   ├── submission.py
    │   │   │   ├── review.py
    │   │   │   ├── meeting.py
    │   │   │   └── audit_log.py
    │   │   ├── schemas/
    │   │   │   ├── user.py
    │   │   │   ├── project.py
    │   │   │   ├── submission.py
    │   │   │   ├── review.py
    │   │   │   └── meeting.py
    │   │   ├── api/
    │   │   │   ├── deps.py
    │   │   │   ├── main.py
    │   │   │   └── routes/
    │   │   │       ├── users.py
    │   │   │       ├── projects.py
    │   │   │       ├── submissions.py
    │   │   │       ├── reviews.py
    │   │   │       ├── meetings.py
    │   │   │       └── audit.py
    │   │   ├── crud/
    │   │   │   ├── user.py
    │   │   │   ├── project.py
    │   │   │   ├── submission.py
    │   │   │   ├── review.py
    │   │   │   └── meeting.py
    │   │   └── services/
    │   │       ├── notification.py
    │   │       ├── document.py
    │   │       └── report.py
    │   ├── tests/
    │   │   ├── conftest.py
    │   │   ├── test_users.py
    │   │   ├── test_projects.py
    │   │   └── test_submissions.py
    │   ├── alembic/
    │   │   └── versions/
    │   ├── pyproject.toml
    │   └── Dockerfile
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── ui/ (shadcn components)
    │   │   │   ├── forms/
    │   │   │   │   ├── ProjectForm.tsx
    │   │   │   │   ├── SubmissionForm.tsx
    │   │   │   │   └── ReviewForm.tsx
    │   │   │   ├── layouts/
    │   │   │   └── tables/
    │   │   ├── hooks/
    │   │   ├── lib/
    │   │   ├── routes/
    │   │   │   ├── login.tsx
    │   │   │   ├── dashboard.tsx
    │   │   │   ├── projects/
    │   │   │   ├── submissions/
    │   │   │   ├── reviews/
    │   │   │   └── meetings/
    │   │   ├── client/ (auto-generated from OpenAPI)
    │   │   └── App.tsx
    │   ├── package.json
    │   └── Dockerfile
    ├── docker-compose.yml
    ├── .env.example
    ├── README.md
    └── Template-IRB.md (this file)

---

## 🔄 GIT WORKFLOW & PROGRESS TRACKING

### Branch Strategy
    main - Production ready
    develop - Integration branch
    feature/* - New features
    fix/* - Bug fixes
    hotfix/* - Critical production fixes

### Commit Message Format
    type(scope): description
    
    feat(projects): add project creation endpoint
    fix(auth): resolve JWT refresh token issue
    docs(schema): update database schema documentation
    test(reviews): add unit tests for review workflow

---

## 📊 DEVELOPMENT PROGRESS

### Phase 1: Foundation (In Progress)
- [x] Clone fastapi/full-stack-fastapi-template
- [x] Setup Docker Compose environment
- [x] Configure PostgreSQL 16 with required extensions
- [ ] Define SQLModel models (users, roles, projects)
- [ ] Implement Audit Trail middleware
- [ ] Setup Row-Level Security policies
- [ ] Create database migrations with Alembic

### Phase 2: Core Features (Not Started)
- [ ] Project submission workflow (create, edit, submit)
- [ ] Document upload with file hashing (integrity check)
- [ ] Submission versioning system
- [ ] Review assignment and workflow
- [ ] Meeting scheduling and agenda management
- [ ] Automated notifications (email + LINE Notify)

### Phase 3: IRB-Specific Features (Not Started)
- [ ] Multi-step review forms (JSONB storage)
- [ ] Vulnerable group auto-detection
- [ ] End-of-life care special workflow
- [ ] Amendment tracking system
- [ ] Continuing review reminders (60, 30, 7 days before expiry)
- [ ] SAE (Serious Adverse Event) reporting module

### Phase 4: Integration & Analytics (Not Started)
- [ ] Export to Quarto/R for reporting
- [ ] Export to Markdown for Obsidian
- [ ] Zotero API integration for references
- [ ] Analytics dashboard (turnaround time, statistics)
- [ ] PDF generation for approval letters (WeasyPrint)

### Phase 5: Security & Compliance (Not Started)
- [ ] PDPA compliance audit
- [ ] NHREC standards verification
- [ ] Penetration testing
- [ ] Security hardening guide
- [ ] Backup and disaster recovery plan

---

## 🛠️ DEVELOPMENT GUIDELINES

### Adding a New Feature

1. Create feature branch from develop
        git checkout develop
        git pull origin develop
        git checkout -b feature/new-feature-name

2. Implement backend API
   - Add SQLModel model in backend/app/models/
   - Add Pydantic schema in backend/app/schemas/
   - Add CRUD operations in backend/app/crud/
   - Add API route in backend/app/api/routes/
   - Write tests in backend/tests/

3. Implement frontend UI
   - Add API client methods (auto-generated)
   - Create components in frontend/src/components/
   - Add routes in frontend/src/routes/
   - Write Playwright tests

4. Update database migrations
        cd backend
        alembic revision --autogenerate -m "add new feature"
        alembic upgrade head

5. Commit and create PR
        git add .
        git commit -m "feat(feature-name): add new feature description"
        git push origin feature/new-feature-name

6. Create Pull Request on GitHub
   - Target branch: develop
   - Assign reviewers
   - Link to issue if applicable

### Code Style Guidelines

#### Backend (Python)
- Use Black formatter
- Use isort for imports
- Type hints required for all functions
- Docstrings required for all public functions
- Follow PEP 8

#### Frontend (TypeScript/React)
- Use Prettier formatter
- Use ESLint
- TypeScript strict mode enabled
- Functional components with hooks only
- Use shadcn/ui components for consistency

### Testing Requirements
- Backend: Minimum 80% code coverage
- Frontend: E2E tests for critical user journeys
- All tests must pass before merge

---

## 🔒 SECURITY CONSIDERATIONS

### Current Security Measures (from template)
- JWT authentication with secure password hashing
- HTTPS enforced via Traefik
- Input validation with Pydantic
- SQL injection prevention via SQLModel

### Additional Security Requirements for IRB

#### 1. Authentication Enhancement
- [ ] Modify JWT to use HttpOnly cookies (prevent XSS)
- [ ] Implement CSRF protection
- [ ] Add session timeout (30 minutes inactivity)
- [ ] Implement multi-factor authentication (optional for admins)

#### 2. Data Encryption
- [ ] Encrypt sensitive fields at rest (PostgreSQL pgcrypto)
- [ ] Encrypt uploaded documents
- [ ] Implement file integrity checking (SHA-256 hash)

#### 3. Access Control
- [ ] Implement Role-Based Access Control (RBAC)
- [ ] Add Row-Level Security (RLS) for multi-tenant data
- [ ] Implement object-level permissions

#### 4. Audit Trail
- [ ] Log all user actions (CREATE, UPDATE, DELETE, VIEW)
- [ ] Store old and new values for updates
- [ ] Immutable audit logs (append-only)
- [ ] Audit log retention policy (7 years minimum)

#### 5. PDPA Compliance
- [ ] Data minimization (collect only necessary data)
- [ ] Consent management for data processing
- [ ] Right to erasure implementation
- [ ] Data export functionality for users
- [ ] Privacy policy page

---

## 📈 INTEGRATION POINTS

### R/Quarto Integration
- Export project data to CSV/JSON for R analysis
- Generate Quarto reports with embedded data
- Use reticulate for Python-R interoperability

Example R code for reporting:
    library(DBI)
    library(dplyr)
    library(dbplyr)
    library(quarto)
    
    con <- dbConnect(RPostgres::Postgres(),
                     dbname = "irb_db",
                     host = "localhost",
                     user = "irb_user",
                     password = Sys.getenv("DB_PASSWORD"))
    
    projects <- tbl(con, "projects") %>%
      filter(status == "approved") %>%
      select(project_code, title, review_type, approval_date) %>%
      collect()
    
    # Generate Quarto report
    quarto::quarto_render("irb_report.qmd",
                          params = list(projects = projects))

### Obsidian Integration
- Export project metadata to Markdown files
- Create knowledge base structure
- Link projects to research notes

Example Markdown export:
    # Project: IRB-2026-001
    ## Title
    End-of-life care model development
    
    ## Status
    Approved
    
    ## Approval Date
    2026-11-18
    
    ## Expiration Date
    2027-11-17
    
    ## Related Notes
    - [[Cancer Care Guidelines]]
    - [[Palliative Care Protocol]]

### Zotero Integration (Future)
- Import references from Zotero collections
- Link citations to projects
- Export project bibliographies

---

## 🚀 DEPLOYMENT

### Development Environment
    docker-compose -f docker-compose.yml up -d

### Production Environment
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

### Environment Variables Required
    # Database
    POSTGRES_SERVER=localhost
    POSTGRES_PORT=5432
    POSTGRES_DB=irb_db
    POSTGRES_USER=irb_user
    POSTGRES_PASSWORD=your_secure_password
    
    # Security
    SECRET_KEY=your_super_secret_key
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    
    # Email
    SMTP_HOST=smtp.hospital.go.th
    SMTP_PORT=587
    SMTP_USER=irb@hospital.go.th
    SMTP_PASSWORD=your_email_password
    EMAILS_FROM_EMAIL=irb@hospital.go.th
    EMAILS_FROM_NAME=IRB System
    
    # Frontend
    FRONTEND_HOST=http://localhost:5173
    
    # Line Notify (optional)
    LINE_NOTIFY_TOKEN=your_line_token

---

## 📝 QUICK START COMMANDS

### Initial Setup
    git clone https://github.com/fastapi/full-stack-fastapi-template.git irb-system
    cd irb-system
    cp .env.example .env
    # Edit .env with your configuration
    docker-compose up -d

### Database Migration
    docker-compose exec backend alembic upgrade head

### Create Superuser
    docker-compose exec backend python -m app.initial_data

### Run Tests
    docker-compose exec backend pytest
    docker-compose exec frontend npm run test

### View Logs
    docker-compose logs -f backend
    docker-compose logs -f frontend

---

## 🎯 NEXT IMMEDIATE ACTIONS

1. **Complete Database Schema**
   - Define all SQLModel models
   - Create Alembic migrations
   - Setup PostgreSQL extensions

2. **Enhance Authentication**
   - Modify JWT to use HttpOnly cookies
   - Implement RBAC system
   - Add audit logging middleware

3. **Build Project Submission Flow**
   - Create project CRUD endpoints
   - Implement multi-step form in frontend
   - Add document upload functionality

4. **Setup Development Workflow**
   - Configure GitHub Actions for CI/CD
   - Setup branch protection rules
   - Create issue templates

---

## 📞 CONTACT & SUPPORT

**Project Lead:** DEV Team (Senior Public Health Professional)
**Email:** aidan@hospital.go.th
**GitHub:** [Your GitHub Username]
**Documentation:** This file (Template-IRB.md)

---

## 📚 REFERENCES

1. FastAPI Full-Stack Template: https://github.com/fastapi/full-stack-fastapi-template
2. NHREC Guidelines: https://www.nrct.go.th
3. PDPA Thailand: https://www.pdpc.or.th
4. ICH-GCP Guidelines: https://www.ich.org/page/good-clinical-practice-gcp
5. PostgreSQL Documentation: https://www.postgresql.org/docs/
6. SQLModel Documentation: https://sqlmodel.tiangolo.com/

---

## 🔄 AI AGENT INSTRUCTIONS

When continuing development from this file:

1. Check "DEVELOPMENT PROGRESS" section for current status
2. Review "NEXT IMMEDIATE ACTIONS" for priority tasks
3. Follow "DEVELOPMENT GUIDELINES" for coding standards
4. Update progress checkboxes as tasks are completed
5. Commit changes with proper commit message format
6. Update "Last Updated" date in PROJECT OVERVIEW
7. If adding new features, update DATABASE SCHEMA and PROJECT STRUCTURE sections
8. For security-related changes, update SECURITY CONSIDERATIONS section

This document serves as the single source of truth for the project.
Always keep it synchronized with actual codebase state.

---

## 4. โครงสร้างฐานข้อมูลหลัก (Core Database Schema)
ใช้ SQLModel/PostgreSQL โดยออกแบบให้รองรับ Version Control และ Audit Trail

    -- ตัวอย่างการสร้างตาราง Projects (ใช้ 4 spaces แทน backtick)
    from sqlmodel import SQLModel, Field, Relationship
    from typing import Optional
    from datetime import date, datetime
    import uuid

    class ProjectBase(SQLModel):
        title: str = Field(index=True)
        study_type: str # interventional, observational, secondary_data
        review_type: str # exempt, expedited, full_board
        involves_vulnerable_group: bool = False
        involves_end_of_life_care: bool = False
        pi_id: uuid.UUID = Field(foreign_key="user.id")

    class Project(ProjectBase, table=True):
        id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
        project_code: str = Field(unique=True, index=True) # e.g., IRB-2026-001
        status: str = Field(default="draft") # draft, submitted, under_review, approved, rejected
        approval_date: Optional[date] = None
        expiration_date: Optional[date] = None # สำหรับแจ้งเตือน Continuing Review
        created_at: datetime = Field(default_factory=datetime.utcnow)
        updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Submission(SQLModel, table=True):
        id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
        project_id: uuid.UUID = Field(foreign_key="project.id")
        version_number: int
        submission_type: str # initial, amendment, continuing_review
        submitted_by: uuid.UUID = Field(foreign_key="user.id")
        submitted_at: datetime = Field(default_factory=datetime.utcnow)
        cover_letter: Optional[str] = None

    class Review(SQLModel, table=True):
        id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
        submission_id: uuid.UUID = Field(foreign_key="submission.id")
        reviewer_id: uuid.UUID = Field(foreign_key="user.id")
        review_form_data: dict = Field(sa_column=Column(JSONB)) # ยืดหยุ่นสำหรับแบบฟอร์ม ก.1/ก.2
        decision: str # approve, minor_revision, major_revision, reject
        comments: Optional[str] = None
        reviewed_at: datetime = Field(default_factory=datetime.utcnow)

---

## 5. มาตรฐานความปลอดภัยและการปฏิบัติตามกฎระเบียบ (Security & Compliance)
- **PDPA Compliance**: แยกการเก็บข้อมูลส่วนตัว (PII) ออกจากข้อมูลโครงการ, ใช้การเข้ารหัส (Encryption at rest และ in transit)
- **Authentication**: ปรับจาก JWT ล้วนๆ ใน Template เป็น Secure HttpOnly Cookies หรือจัดการ JWT Refresh Token อย่างเคร่งครัดเพื่อป้องกัน XSS/CSRF ใน Internal Network
- **Audit Trail**: บันทึกทุกการกระทำ (Create, Read, Update, Delete) พร้อม User ID, Timestamp, IP Address, และ Old/New Values (ใช้ pgaudit หรือ Custom SQLModel Mixin)
- **Row-Level Security (RLS)**: กำหนด Policy ใน PostgreSQL เช่น ผู้วิจัย (PI) เห็นได้เฉพาะโครงการที่ pi_id = ตัวเอง, เลขานุการเห็นทั้งหมด

---

## 6. แนวทางการทำงานร่วมกับ AI (AI Interaction Guidelines)
เพื่อให้ AI Assistant ทำงานได้อย่างมีประสิทธิภาพและไม่เกิด Conflict กับโค้ดที่มีอยู่:

1. **ตรวจสอบสถานะ Git เสมอก่อนเขียนโค้ด**:
   ก่อนเสนอการแก้ไขหรือสร้างไฟล์ใหม่ AI ต้องสั่งการหรือจำลองการรันคำสั่ง Git เพื่อเข้าใจ Context ปัจจุบัน:
   
       git status
       git log -n 5 --oneline
       git diff HEAD

2. **การอ้างอิงแม่แบบ**: 
   เมื่อมีการเพิ่มฟีเจอร์ใหม่ ให้ตรวจสอบว่าแม่แบบ `full-stack-fastapi-template` มี Utility ที่ใช้ซ้ำได้หรือไม่ (เช่น การจัดการ Email, การตั้งค่า CORS, หรือโครงสร้าง CRUD) ก่อนสร้างของใหม่

3. **การจัดรูปแบบโค้ด**: 
   - ใช้ 4 spaces สำหรับ Indentation ใน Python
   - ใช้ Type Hinting อย่างเคร่งครัด (ตามมาตรฐาน FastAPI/SQLModel)
   - ใส่ Docstring อธิบาย Logic ที่ซับซ้อน โดยเฉพาะส่วนที่เกี่ยวข้องกับ IRB Workflow

4. **การทดสอบ**: 
   เสนอ Pytest สำหรับฟีเจอร์ใหม่ทุกครั้ง โดยเฉพาะส่วนที่เกี่ยวข้องกับ Permission และ Data Validation

---

## 7. ขั้นตอนการพัฒนาที่แนะนำ (Recommended Development Workflow)

- **Phase 1: Setup & Core Models**
    - Clone และตั้งค่า `full-stack-fastapi-template`
    - ปรับแต่ง SQLModel ให้รองรับ Project, Submission, Review, AuditLog
    - ตั้งค่า PostgreSQL RLS และ pgaudit

- **Phase 2: Backend API & Business Logic**
    - สร้าง CRUD Endpoints พร้อม Dependency Injection สำหรับ Role Checking (Admin, Secretary, Reviewer, Researcher)
    - สร้าง Logic สำหรับ Auto-generate Project Code (เช่น IRB-YYYY-NNN)
    - สร้าง Background Task (Celery/ARQ) สำหรับส่ง Email แจ้งเตือนเมื่อโครงการใกล้หมดอายุ

- **Phase 3: Frontend Integration**
    - ใช้ shadcn/ui สร้าง Multi-step Form สำหรับการยื่นขอจริยธรรม
    - เชื่อมต่อ Frontend Client ที่ Generate อัตโนมัติกับ Backend APIs
    - สร้าง Dashboard สำหรับติดตามสถานะ (Tracking)

- **Phase 4: Reporting & Analytics (Aidan's Workflow)**
    - สร้าง API Endpoint ที่ปลอดภัยสำหรับการดึงข้อมูลแบบ Aggregated
    - เขียนสคริปต์ R/Quarto ที่เชื่อมต่อกับ PostgreSQL (ผ่าน DBI/duckdb) เพื่อสร้างรายงานสถิติการวิจัยรายไตรมาสอัตโนมัติ

---

## 8. หมายเหตุสำหรับ AI (System Prompt Reminder)
- ห้ามใช้ Backtick ซ้อนใน Code Block หลักนี้ (ใช้ 4 spaces แทน)
- หากระบบต้องการ Library ใหม่ ให้แนะนำคำสั่ง `uv add` หรือ `pip install` ที่สอดคล้องกับสภาพแวดล้อม Miniconda
- ให้ความสำคัญกับ "ผู้ป่วยมะเร็งระยะท้าย" และ "กลุ่มเปราะบาง" เป็น Flag พิเศษใน Logic การอนุมัติเสมอ