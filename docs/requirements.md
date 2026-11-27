# Requirements Specification: IRB Management System
## โรงพยาบาลมะเร็งลพบุรี กรมการแพทย์ กระทรวงสาธารณสุข
## Version: 2.0 | Date: 19 November 2026

---

## 1. Project Overview

ระบบสารสนเทศเพื่อการบริหารจัดการคณะกรรมการจริยธรรมการวิจัยในมนุษย์ (Institutional Review Board - IRB) ของโรงพยาบาลมะเร็งลพบุรี พัฒนาบนพื้นฐานของ Full Stack FastAPI Template (FastAPI, React, PostgreSQL, TanStack Router) โดยมีจุดมุ่งหมายเพื่อเปลี่ยนกระบวนการทำงานแบบกระดาษ (Paper-based) ให้เป็นดิจิทัล (Paperless) และรองรับ Workflow จริงตามเอกสารของโรงพยาบาล ได้แก่:

- แบบยื่นขอรับการพิจารณาจริยธรรมการวิจัย (Submission Form) 6 ส่วน
- แบบประเมินจริยธรรมการวิจัยในมนุษย์ 4 หมวด (A/B/C/D รวม 44 ข้อ)
- บันทึกข้อความการชี้แจงต่อข้อคำถาม/ข้อเสนอแนะของคณะกรรมการ
- ใบรับรองโครงการวิจัย (Certificate) พร้อมเงื่อนไข 6 ข้อ

ระบบมุ่งเน้นให้ "เลขานุการ (Secretary)" เป็นศูนย์กลางในการขับเคลื่อนกระบวนการ (Workflow Manager) ตั้งแต่การรับเรื่อง การจัดสรรผู้ตรวจสอบ การจัดการประชุม การสรุปมติ การออกใบรับรอง และการติดตามผลหลังการอนุมัติ

---

## 2. User Roles and Permissions

### 2.1 Researcher (ผู้วิจัย)
- สร้างและแก้ไข Protocol ในสถานะ DRAFT
- กรอกข้อมูลตามแบบยื่นขอ 6 ส่วน (ข้อมูลโครงการ, ผู้วิจัย, โครงการวิจัย, ผู้รับการวิจัย, DSMB, เอกสารแนบ 18 รายการ)
- อัปโหลดเอกสารแนบ (PDF/Word) ตามประเภท DocumentType 18 ประเภท
- Submit คำขอเพื่อเข้าสู่กระบวนการ Screening
- กรอก Revision Response Table (4 ช่อง: ข้อแก้ไข / คำตอบ / ข้อความเดิม vs แก้ไข / ตำแหน่งที่แก้)
- ดาวน์โหลดใบรับรอง (Certificate) และตรวจสอบผ่าน QR Code

### 2.2 Reviewer (ผู้ทรงคุณวุฒิ/กรรมการ)
- ดูรายการ Assignment ที่ได้รับมอบหมาย
- กรอกแบบประเมินจริยธรรม 4 หมวด (JSON schema):
    - หมวด A: Scientific Value (17 ข้อ)
    - หมวด B: Ethical Issues (9 ข้อ)
    - หมวด C: Informed Consent (15 ข้อ)
    - หมวด D: Qualification of Investigator (3 ข้อ)
- ให้ Rating: APPROPRIATE / INAPPROPRIATE / NOT_APPLICABLE พร้อมข้อสังเกต
- ประเมินความเสี่ยง (Risk Assessment) และระยะเวลาติดตาม (Follow-up Period)
- สรุปความเห็น: เห็นชอบ / เห็นชอบหากแก้ไข / ขอชี้แจงเพิ่มเติม / ไม่เห็นชอบ
- เข้าร่วมการประชุม (Full Board หรือ Expedited)

### 2.3 Secretary (เลขานุการ) - Focus Area

#### 2.3.1 Intake & Screening
- Intake Dashboard: ดู Protocol ที่ Submit เข้ามาใหม่ (เดือนปัจจุบัน + ใกล้หมดอายุ + หมดอายุแล้ว)
- Screening Checklist: ตรวจสอบความครบถ้วนของเอกสาร 18 รายการ
- Action - Pass: เปลี่ยนสถานะเป็น SCREENING_PASSED
- Action - Return: เปลี่ยนเป็น REVISION_REQUIRED พร้อมเหตุผล

#### 2.3.2 Assign Reviewers
- เลือกประเภทการตรวจสอบ: EXPEDITED (เลือกกรรมการเฉพาะ) หรือ FULL_BOARD (กรรมการทุกคน)
- Assign จาก Reviewer Directory พร้อมกำหนด Due Date
- Re-assign ได้ในกรณีจำเป็น

#### 2.3.3 Meeting Management
- สร้าง Meeting (SCHEDULED/COMPLETED/CANCELLED)
- เพิ่ม Protocol เข้า Agenda (MeetingProtocol junction table)
- บันทึกมติการประชุม (Minutes)
- รองรับทั้ง EXPEDITED และ FULL_BOARD meeting types

#### 2.3.4 Secretary Summary & Certificate Issuance
- สรุปมติ (SecretarySummary) แบบมีโครงสร้าง:
    - final_decision: APPROVE / APPROVE_WITH_REVISION / REQUEST_CLARIFICATION / REJECT
    - decision_reason: เหตุผลสั้น
    - summary_to_researcher: สรุปยาวส่งให้นักวิจัย
    - conditions: list[str] (เงื่อนไข 6 ข้อมาตรฐาน + เงื่อนไขเฉพาะ)
    - required_revisions: list[str] (รายการที่ต้องแก้ไข)
- Generate Certificate PDF อัตโนมัติ:
    - เลขที่: REC 030/69 (ตาม template ของ รพ.)
    - อายุ: 1 ปี (issue_date + 1 year)
    - เงื่อนไขมาตรฐาน 6 ข้อ + เงื่อนไขเฉพาะ
    - QR Code สำหรับ verify
- Certificate Types: INITIAL / AMENDMENT / RENEWAL / CLOSURE
- Certificate Status: ACTIVE / EXPIRED / REVOKED / SUPERSEDED

#### 2.3.5 Follow-up & Post-Approval
- Follow-up Dashboard: ติดตาม ACTIVE projects
- Adverse Event Management: รับ SAE report (ต้องรายงานภายใน 5 วันทำการ)
- Progress Report: เตือนก่อนครบกำหนด 90/60/30/7 วัน
- Closure Management: ตรวจสอบ Closure Report และปิดโครงการ

### 2.4 Admin (ผู้ดูแลระบบ)
- User Management และ Role Assignment
- Master Data Management:
    - ResearchPurposeOption (อวช./เรียนต่อ/ปกติ/อื่นๆ)
    - Department (แผนก/หน่วยงาน)
    - ReviewTypeOption (Full Board/Expedited/Exempt)
- Institution Setting:
    - IRB Prefix (REC/IRB/EC)
    - IRB Format Template ({prefix} {seq:03d}/{year})
    - Hospital Name (TH/EN), Logo URL
    - Current Year, Sequence Counter
- File Storage Setting:
    - Storage Type: LOCAL / FILE_SERVER / S3
    - Base Path
    - Connection Config (JSON)
- Certificate Revocation (พร้อมเหตุผลและ Audit Log)

---

## 3. System Features and Functional Requirements

### 3.1 Protocol Submission System (Multi-Submission Workflow)

โครงการ 1 เรื่องสามารถยื่นได้หลายครั้ง (Initial → Amendment → Renewal → Closure):

    class SubmissionType(StrEnum):
        INITIAL = "INITIAL"                  # 01 ยื่นครั้งแรก
        AMENDMENT = "AMENDMENT"              # 02 แก้ไข
        RENEWAL = "RENEWAL"                  # 03 ต่ออายุ
        CLOSURE = "CLOSURE"                  # 04 ปิดโครงการ
        ADVERSE_EVENT = "ADVERSE_EVENT"      # 05 รายงาน SAE
        PROGRESS_REPORT = "PROGRESS_REPORT"  # 06 รายงานความก้าวหน้า

ProtocolSubmission Model:
- submission_number: int (auto-increment ต่อ protocol)
- submission_type: SubmissionType
- meeting_id: FK → Meeting (optional)
- meeting_number: int (M01, M03, ...)
- submission_year: int (พ.ศ.)
- status: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED

### 3.2 IRB Number Generation

Format: {prefix} {seq:03d}/{year}
- ตัวอย่าง: REC 001/69, REC 030/69
- Prefix: Admin เปลี่ยนได้ (REC/IRB/EC)
- Sequence: auto-increment, รีเซ็ตทุกปี
- Year: 2 หลักสุดท้ายของ พ.ศ. (69, 70, ...)

Logic:
    def generate_irb_number(session, protocol):
        inst = session.get(InstitutionSetting, 1)
        current_year = datetime.now().year + 543  # พ.ศ.
        if inst.current_year != current_year:
            inst.current_year = current_year
            inst.sequence_counter = 0
        inst.sequence_counter += 1
        return inst.irb_format.format(
            prefix=inst.irb_prefix,
            seq=inst.sequence_counter,
            year=str(current_year)[-2:]
        )

### 3.3 File Storage Structure

โครงสร้างโฟลเดอร์ตามการยื่นแต่ละครั้ง:

    /var/irb-storage/                              ← base_path (Admin ตั้งค่า)
    └── REC 2569/                                  ← ปี
        └── 01 REC 01 | 2569 | นางสาวศรีรัตน์.../  ← โครงการ (seq + IRB + PI)
            ├── 01 | M01 | 2569/                   ← ยื่นครั้งแรก ประชุมครั้งที่ 1
            │   ├── SUBMISSION_FORM_แบบเสนอ.pdf
            │   ├── CONSENT_FORM_ใบยินยอม.pdf
            │   └── ... (เอกสาร 18 ประเภท)
            ├── 02 แก้ไข | M03 | 2569/             ← ยื่นแก้ไข
            ├── 03 ต่ออายุ | M05 | 2570/           ← ยื่นต่ออายุ
            ├── 04 ปิดโครงการ | M07 | 2570/        ← ปิดโครงการ
            └── certificates/
                └── REC_001_69.pdf

Document Model:
- submission_id: FK → ProtocolSubmission (เปลี่ยนจาก protocol_id)
- protocol_id: FK → Protocol (denormalized for query)
- document_type: 18 ประเภทตามส่วนที่ 6 ของแบบยื่น
- file_size, mime_type, uploaded_by_id

### 3.4 Evaluation Form (JSON Schema)

เก็บแบบประเมิน 44 ข้อเป็น JSON ใน ReviewAssignment.evaluation_form:

    {
      "project_info": {
        "irb_number": "REC 028/69",
        "project_title": "...",
        "principal_investigator": "นางสาวศรีรัตน์ แก้วกัลยา",
        "department": "งานการพยาบาลผู้ป่วยวิสัญญี"
      },
      "reviewer_info": {
        "reviewer_id": "uuid",
        "reviewer_name": "ดร. สมชาย",
        "evaluation_date": "2026-11-19"
      },
      "sections": {
        "A": {
          "title": "Scientific Value",
          "items": [
            {"id": "A1", "topic": "หลักการและเหตุผล", "rating": "APPROPRIATE", "comment": "..."},
            ... (A1-A17 รวม 17 ข้อ)
          ]
        },
        "B": { "title": "Ethical Issues", "items": [...] },   // 9 ข้อ
        "C": { "title": "Informed Consent", "items": [...] }, // 15 ข้อ (รวม C1.1-C1.3)
        "D": { "title": "Qualification", "items": [...] }     // 3 ข้อ
      },
      "medical_device": {
        "is_related": false,
        "risk_type": null,
        "registered_with_usfda": null
      },
      "risk_assessment": "MINIMAL_RISK",
      "follow_up_period": "6_MONTHS",
      "overall_conclusion": {
        "decision": "APPROVE_WITH_REVISION",
        "reason": "..."
      },
      "other_suggestions": "p2 Meta-analysis นักวิจัยจะดำเนินการอย่างไร..."
    }

Enums:
- EvaluationRating: APPROPRIATE / INAPPROPRIATE / NOT_APPLICABLE
- RiskAssessment: MINIMAL_RISK / GREATER_THAN_MINIMAL_WITH_BENEFIT / ...
- FollowUpPeriod: 3_MONTHS / 6_MONTHS / 12_MONTHS
- OverallDecision: APPROVE / APPROVE_WITH_REVISION / REQUEST_CLARIFICATION / REJECT

### 3.5 Revision Response Table (บันทึกชี้แจง)

เมื่อมติเป็น APPROVE_WITH_REVISION นักวิจัยต้องตอบกลับ 4 ช่อง:

    {
      "revisions": [
        {
          "committee_comment": "ทบทวนขนาดตัวอย่าง",
          "researcher_response": "...",
          "original_text": "...",
          "revised_text": "...",
          "location": {
            "document_name": "โครงการวิจัยฉบับเต็ม",
            "page": 4,
            "line": 12
          }
        }
      ]
    }

### 3.6 Certificate Rules (ตามใบรับรองจริงของ รพ.)

ข้อมูลในใบรับรอง:
- หัวกระดาษ: Logo + "โรงพยาบาลมะเร็งลพบุรี กรมการแพทย์ กระทรวงสาธารณสุข"
- ที่อยู่: 11/11 ถนนพหลโยธิน ต.ทะเลชุบศร อ.เมือง จ.ลพบุรี 15000
- เลขที่โครงการ: REC XXX/XX (ตัวใหญ่)
- ชื่อโครงการ, หัวหน้าโครงการ, สังกัด, สถานที่วิจัย
- รายงานความก้าวหน้า: ภายในวันที่ XX เดือน YY
- เอกสารพิจารณา (5 รายการ)
- ลายเซ็นประธาน: (นางสาวมาณิดา พิทักษ์) ประธานคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์

เงื่อนไขมาตรฐาน 6 ข้อ:
1. ดำเนินการวิจัยตามที่ระบุไว้อย่างเคร่งครัด
2. ใช้เอกสารที่มีตราประทับของคณะกรรมการเท่านั้น
3. รายงาน SAE ภายใน 5 วันทำการ
4. ส่งรายงานความก้าวหน้าตามกำหนดหรือเมื่อได้รับการร้องขอ
5. ยื่นขออนุมัติใหม่ก่อนหมดอายุอย่างน้อย 1 เดือน
6. เอกสารหมดอายุตามโครงการก่อนหน้า (ถ้ามี)

อายุใบรับรอง: 1 ปี (issue_date + 1 year)
การออก: ทุกครั้งที่ Approved (Initial/Amendment/Renewal) → ใบเก่าเป็น SUPERSEDED

### 3.7 Notification System

| เหตุการณ์ | ผู้รับ | ล่วงหน้า |
|---|---|---|
| ใบรับรองใกล้หมดอายุ | Researcher + Secretary | 90/60/30 วัน |
| ถึงกำหนดส่ง Progress Report | Researcher | 7 วัน |
| ถูกมอบหมายงานตรวจสอบ | Reviewer | ทันที |
| มติอนุมัติ/แก้ไข | Researcher | ทันที |
| SAE Report | Secretary + President | ทันที |
| เอกสารไม่ครบ (Return) | Researcher | ทันที |

### 3.8 Audit Trail and Security

- บันทึก Log ทุกการกระทำ: user_id, action, entity, entity_id, details, ip_address, created_at
- JWT Authentication
- Row-Level Security (RLS) ใน PostgreSQL
- Password hashing (bcrypt)

---

## 4. UI/UX Design Guidelines

### 4.1 Navigation Structure

Researcher:
- Dashboard (โครงการของตัวเอง + สถานะ)
- Protocols (Create/Edit/Submit)
- Documents (Upload 18 ประเภท)
- Revision Response (กรอกออนไลน์หรืออัปโหลด)
- Certificates (Download + QR Verify)

Reviewer:
- Review Assignments List
- Evaluation Form (A/B/C/D + JSON save)
- Document Viewer (PDF in-browser)

Secretary:
- Dashboard (Inbox + Screening Queue + Upcoming Meetings + Overdue + AE Alert)
- Protocols (เดือนนี้ + ใกล้หมดอายุ + หมดอายุ)
- Meetings (Create + Agenda + Minutes)
- Review Assignments (Assign + Re-assign)
- Secretary Summary (สรุปมติ + เงื่อนไข)
- Certificate Generator (Preview + PDF + Upload signed)
- Archive (เรื่องเก่า + Search + Filter)

Admin:
- User Management
- Master Data (Department, Purpose, ReviewType)
- Institution Settings (IRB format, Logo, Hospital info)
- File Storage Settings (LOCAL/FILE_SERVER/S3)
- Certificate Revocation
- System Logs

### 4.2 Design System
- Tailwind CSS + shadcn/ui
- TanStack Router (file-based routing)
- Dark mode support
- Responsive: Desktop + Tablet

---

## 5. Database Entities (High-Level)

### Core Tables
- User (id, email, hashed_password, role, full_name, department, is_active, is_superuser)
- Protocol (id, irb_number, title, abstract, status, risk_level, review_type, research_purpose, researcher_type, pi_id, submitted_at, approved_at, expired_at)
- ProtocolSubmission (id, protocol_id, submission_number, submission_type, status, meeting_id, meeting_number, submission_year, version)
- Document (id, submission_id, protocol_id, file_name, file_path, file_size, mime_type, document_type, version, uploaded_by_id)
- ReviewAssignment (id, protocol_id, reviewer_id, assigned_by_id, due_date, status, evaluation_form: JSON)
- ReviewComment (id, assignment_id, comments, decision, reviewed_at)
- Meeting (id, meeting_date, meeting_type, location, agenda, minutes, status, created_by_id)
- MeetingProtocol (id, meeting_id, protocol_id, decision, comments, reviewed_at, agenda_order)
- SecretarySummary (id, protocol_id, meeting_id, final_decision, decision_reason, summary_to_researcher, conditions: JSON, required_revisions: JSON, created_by_id)
- Certificate (id, protocol_id, submission_id, certificate_number, certificate_type, status, issue_date, expiry_date, project_title_th, principal_investigator, department, conditions: JSON, file_path, qr_code_data, issued_by_id)

### Master Data Tables
- InstitutionSetting (id, irb_prefix, irb_format, hospital_name, hospital_name_en, logo_url, current_year, sequence_counter)
- FileStorageSetting (id, storage_type, base_path, config: JSON)
- ResearchPurposeOption (id, name, description, is_active, display_order)
- Department (id, name, description, is_active, display_order)
- ReviewTypeOption (id, name, description, is_active, display_order)

### Supporting Tables
- Item (legacy from template)
- FollowUpReport (id, protocol_id, report_type, description, severity, status)
- AuditLog (id, user_id, action, entity, entity_id, details, ip_address)

### Enums
- UserRole: RESEARCHER / REVIEWER / SECRETARY / ADMIN
- ProtocolStatus: DRAFT / SUBMITTED / SCREENING / REVISION_REQUIRED / PENDING_ASSIGNMENT / UNDER_REVIEW / AWAITING_DECISION / APPROVED / REJECTED / ACTIVE / CLOSED
- SubmissionType: INITIAL / AMENDMENT / RENEWAL / CLOSURE / ADVERSE_EVENT / PROGRESS_REPORT
- SubmissionStatus: DRAFT / SUBMITTED / UNDER_REVIEW / APPROVED / REJECTED / WITHDRAWN
- MeetingType: EXPEDITED / FULL_BOARD
- MeetingStatus: SCHEDULED / COMPLETED / CANCELLED
- DecisionType: APPROVE / REVISE / REJECT / DEFER
- OverallDecision: APPROVE / APPROVE_WITH_REVISION / REQUEST_CLARIFICATION / REJECT
- CertificateType: INITIAL / AMENDMENT / RENEWAL / CLOSURE
- CertificateStatus: ACTIVE / EXPIRED / REVOKED / SUPERSEDED
- DocumentType: SUBMISSION_FORM / SELF_ASSESSMENT / CONSENT_FORM / FULL_PROTOCOL / PI_CV / QUESTIONNAIRE / COI_FORM / BUDGET / SHORT_PROTOCOL / INVESTIGATOR_BROCHURE / THESIS_APPROVAL / RECRUITMENT_MATERIAL / MEDICAL_DEVICE_APPROVAL / FREE_SALE_CERT / INVESTIGATIONAL_DRUG / DRUG_APPROVAL / OTHER_REC_APPROVAL / ELECTRONIC_COPY / OTHER
- EvaluationRating: APPROPRIATE / INAPPROPRIATE / NOT_APPLICABLE
- RiskAssessment: MINIMAL_RISK / GREATER_THAN_MINIMAL_WITH_BENEFIT / GREATER_THAN_MINIMAL_NO_DIRECT_BENEFIT / OTHER
- FollowUpPeriod: 3_MONTHS / 6_MONTHS / 12_MONTHS
- StorageType: LOCAL / FILE_SERVER / S3

---

## 6. API Endpoints (High-Level)

### Protocols & Submissions
    POST   /protocols/                              # สร้างโครงการ (Researcher)
    GET    /protocols/                              # ดูทั้งหมด (filter: status, month, due_date)
    GET    /protocols/{id}                          # ดูรายละเอียด
    PATCH  /protocols/{id}                          # แก้ไข
    POST   /protocols/{id}/submit                   # ยื่นโครงการ
    POST   /protocols/{id}/submissions              # ยื่นครั้งใหม่ (Amendment/Renewal/Closure)
    GET    /protocols/{id}/submissions              # ดูรายการ submission
    GET    /protocols/archive                       # เรื่องเก่า (filter: year, status, search)

### Documents
    POST   /documents/upload                        # อัปโหลดเอกสาร (multipart)
    GET    /documents/{id}/download                 # ดาวน์โหลด
    DELETE /documents/{id}                          # ลบ

### Meetings
    POST   /meetings/                               # สร้างการประชุม
    GET    /meetings/                               # ดูทั้งหมด (filter: status, date_range)
    GET    /meetings/{id}                           # ดูรายละเอียด + Agenda
    PATCH  /meetings/{id}                           # แก้ไข (เพิ่ม minutes)
    DELETE /meetings/{id}                           # ลบ (เฉพาะ SCHEDULED)
    POST   /meetings/{id}/protocols                 # เพิ่ม Protocol เข้า Agenda
    DELETE /meetings/{id}/protocols/{protocol_id}   # ลบออกจาก Agenda
    PATCH  /meetings/{id}/protocols/{protocol_id}/decision  # บันทึกมติ

### Review Assignments
    POST   /review-assignments/                     # มอบหมายงาน (Secretary)
    GET    /review-assignments/                     # ดูทั้งหมด (filter: status, reviewer)
    GET    /review-assignments/{id}                 # ดูรายละเอียด
    POST   /review-assignments/{id}/evaluation      # กรอกแบบประเมิน (Reviewer)
    POST   /review-assignments/{id}/comments        # ส่งความเห็น

### Secretary Summary
    POST   /protocols/{id}/secretary-summary        # สรุปมติ
    GET    /protocols/{id}/secretary-summary        # ดูสรุป

### Certificates
    POST   /protocols/{id}/certificates             # ออกใบรับรอง
    GET    /certificates/{id}                       # ดูข้อมูล
    GET    /certificates/{id}/pdf                   # ดาวน์โหลด PDF
    GET    /certificates/verify/{certificate_number}  # ตรวจสอบผ่าน QR
    PATCH  /certificates/{id}/revoke                # เพิกถอน

### Users
    GET    /users/me                                # ข้อมูลตัวเอง
    PATCH  /users/me                                # แก้ไขตัวเอง
    GET    /users/                                  # ดูทั้งหมด (superuser/admin/secretary)
    POST   /users/                                  # สร้างผู้ใช้ (superuser)
    POST   /users/signup                            # สมัครสมาชิก

### Admin
    GET/POST/PATCH/DELETE /admin/master-data/research-purposes
    GET/POST/PATCH/DELETE /admin/master-data/departments
    GET/POST/PATCH/DELETE /admin/master-data/review-types
    GET/PATCH /admin/settings/institution
    GET/PATCH /admin/settings/file-storage

---

## 7. Technical Stack

- Backend: FastAPI, SQLModel (ORM), Pydantic, Alembic (migration)
- Database: PostgreSQL 18 (พร้อม RLS)
- Frontend: React 18, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, Bun (package manager)
- PDF Generation: WeasyPrint (HTML → PDF, รองรับภาษาไทย)
- QR Code: qrcode library (Python)
- File Storage: Local / SMB/NFS / S3-compatible
- Authentication: JWT (access token), bcrypt password hashing
- Testing: Pytest (Backend), Playwright (E2E)
- Deployment: Docker Compose, Traefik (Reverse Proxy), Mailpit (dev email)
- CI/CD: GitHub Actions
- Python: 3.14, uv (package manager)

---

## 8. Workflow Summary

### Workflow 1: Initial Submission → Approval
    Researcher สร้าง Protocol (DRAFT) + อัปโหลดเอกสาร 18 ประเภท
        ↓ Submit
    Protocol → SUBMITTED
        ↓ Secretary Screening
    SCREENING_PASSED หรือ REVISION_REQUIRED (loop)
        ↓ Secretary เลือก meeting_type + Assign Reviewer
    Meeting สร้าง + Protocol เข้า Agenda
        ↓ Reviewer กรอก Evaluation Form (A/B/C/D)
    Secretary สรุปมติ (SecretarySummary)
        ↓ APPROVED
    Generate Certificate PDF (REC 001/69) + QR Code
        ↓ ส่งอีเมลนักวิจัย + เก็บใน File Storage
    Protocol → ACTIVE, Certificate → ACTIVE (1 ปี)

### Workflow 2: Amendment (แก้ไข)
    Researcher เห็นเงื่อนไข → กรอก Revision Response Table (4 ช่อง)
        ↓ ยื่น Amendment
    Submission ใหม่ (submission_number=02, type=AMENDMENT)
        ↓ เข้า Meeting ใหม่
    ออก Certificate ใหม่ (เลข REC ใหม่ เช่น 030/69)
        ↓ Certificate เดิม → SUPERSEDED

### Workflow 3: Renewal (ต่ออายุ)
    แจ้งเตือน 90/60/30 วันก่อนหมดอายุ
        ↓ Researcher ยื่น Renewal (ล่วงหน้าอย่างน้อย 1 เดือน)
    Submission ใหม่ (type=RENEWAL)
        ↓ ออก Certificate ใหม่ (อายุ +1 ปี)

### Workflow 4: Closure (ปิดโครงการ)
    Researcher ยื่นปิดโครงการ (type=CLOSURE)
        ↓ Secretary อนุมัติ
    Protocol → CLOSED, Certificate → EXPIRED

### Workflow 5: Adverse Event (SAE)
    Researcher รายงาน SAE (ภายใน 5 วันทำการ)
        ↓ Secretary ประเมินความรุนแรง
    ส่งต่อประธาน/กรรมการพิจารณา
        ↓ มติ: หยุดวิจัย / แก้ไข / ดำเนินการต่อ

---

## 9. Success Criteria

1. Researcher สร้างโครงการ + อัปโหลดเอกสาร 18 ประเภท + ยื่นได้ภายใน 10 นาที
2. Secretary สร้าง Meeting + Assign Reviewer + สรุปมติ + ออกใบรับรอง PDF ได้ใน 5 นาที
3. Reviewer กรอกแบบประเมิน 44 ข้อ (A17+B9+C15+D3) + ส่งได้ภายใน 15 นาที
4. ระบบออกเลข REC อัตโนมัติ (REC 001/69 → REC 002/69) ไม่ซ้ำ รีเซ็ตทุกปี
5. ระบบแจ้งเตือนก่อนใบรับรองหมดอายุ 90/60/30 วัน และก่อนกำหนดส่ง Progress Report 7 วัน
6. QR Code สแกนแล้วตรวจสอบใบรับรองได้จริง (valid/expired/revoked)
7. File Storage แยกโฟลเดอร์ตาม ปี/โครงการ/การยื่น ชัดเจน (REC 2569/01 REC 01 | 2569 | ชื่อ/01 | M01 | 2569/)
8. รองรับ Workflow จริง: Initial → Amendment → Renewal → Closure พร้อม Certificate ใหม่ทุกขั้น
9. Revision Response Table 4 ช่อง ครบตามแบบฟอร์มของ รพ.มะเร็งลพบุรี
10. Audit Log บันทึกทุกการกระทำ พร้อม IP และ Timestamp

---

## 10. Development Phases

### Phase 1: Foundation (Step 1a-1c) ✅ กำลังดำเนินการ
- Models: User, Protocol, ProtocolSubmission, Meeting, ReviewAssignment, Certificate, Document, SecretarySummary
- Master Data tables (ResearchPurposeOption, Department, ReviewTypeOption)
- InstitutionSetting + FileStorageSetting
- Migration (manual, ใช้ postgresql.ENUM + create_type=False)
- Seed ข้อมูลเริ่มต้น

### Phase 2: Backend APIs (Step 2)
- CRUD Protocols + Submissions
- CRUD Meetings + Assignments
- Evaluation Form API (JSON)
- Secretary Summary API
- Certificate Generator + PDF Export (WeasyPrint)
- File Storage Service (LOCAL/FILE_SERVER/S3)

### Phase 3: Frontend (Step 3)
- Researcher: Create Protocol (Multi-step), Upload Docs, Revision Response Table
- Reviewer: Evaluation Form (A/B/C/D)
- Secretary: Meeting Management, Summary, Certificate Generator
- Admin: Master Data, Institution Settings, File Storage Settings

### Phase 4: Advanced (Step 4)
- Notification System (Email + In-app)
- QR Code Verification Page
- Audit Log Viewer
- Statistical Reports
- Certificate Revocation Workflow

---

## 11. References

1. แบบยื่นขอรับการพิจารณาจริยธรรมการวิจัย (Submission Form) - 6 ส่วน, 18 เอกสารแนบ
2. แบบประเมินจริยธรรมการวิจัยในมนุษย์ - 4 หมวด (A/B/C/D) รวม 44 ข้อ
3. บันทึกข้อความการชี้แจงต่อข้อคำถาม/ข้อเสนอแนะ - 4 ช่อง (Revision Response Table)
4. ใบรับรองโครงการวิจัย - REC 030/69 (นางลาวัลย์ เชยชม) - เงื่อนไข 6 ข้อ, อายุ 1 ปี
5. แนวทาง Declaration of Helsinki, The Belmont Report, CIOMS Guideline, ICH-GCP

---

## 12. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | นักวิชาการสาธารณสุขชำนาญการ | | 19/11/2569 |
| Technical Lead | (TBD) | | |
| Hospital Representative | ประธานคณะกรรมการจริยธรรมฯ | | |

---

END OF DOCUMENT