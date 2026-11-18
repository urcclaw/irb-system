# =====================================================================
# FILE: docs/database-schema.md
# =====================================================================
# Database Schema (โครงสร้างฐานข้อมูล)

เอกสารนี้อธิบายโครงสร้างฐานข้อมูล (Database Schema) ของระบบ IRB Management System

## 1. Entity Relationship Overview

    [User] 1 --- N [Protocol] (ผู้วิจัยหลัก - PI)
    [User] N --- N [Protocol] (ผ่าน ReviewAssignment - ผู้ตรวจสอบ)
    [Protocol] 1 --- N [Document]
    [Protocol] 1 --- N [ReviewAssignment]
    [ReviewAssignment] 1 --- N [ReviewComment]
    [Protocol] N --- 1 [Meeting]
    [Protocol] 1 --- 1 [Certificate]
    [Protocol] 1 --- N [FollowUpReport]
    [User] 1 --- N [AuditLog]

## 2. ตารางข้อมูลหลัก (Tables)

### 2.1 User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| email | String | Unique, ใช้ล็อกอิน |
| hashed_password | String | รหัสผ่านที่ Hash แล้ว |
| full_name | String | ชื่อ-นามสกุล |
| department | String | หน่วยงาน/ภาควิชา |
| role | Enum | RESEARCHER, REVIEWER, SECRETARY, ADMIN |
| is_active | Boolean | สถานะการใช้งาน |
| created_at | DateTime | วันที่สร้าง |
| updated_at | DateTime | วันที่อัปเดตล่าสุด |

### 2.2 Protocol
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| title | String | ชื่อโครงการวิจัย |
| abstract | Text | บทคัดย่อ |
| pi_id | UUID | Foreign Key ไปยัง User (ผู้วิจัยหลัก) |
| status | Enum | DRAFT, SUBMITTED, SCREENING, REVISION_REQUIRED, PENDING_ASSIGNMENT, UNDER_REVIEW, AWAITING_DECISION, APPROVED, REJECTED, ACTIVE, CLOSED |
| risk_level | Enum | MINIMAL, GREATER_THAN_MINIMAL |
| review_type | Enum | EXPEDITED, FULL_BOARD |
| submitted_at | DateTime | วันที่ส่งคำขอ |
| approved_at | DateTime | วันที่อนุมัติ |
| expired_at | DateTime | วันที่หมดอายุ |
| created_at | DateTime | วันที่สร้าง |
| updated_at | DateTime | วันที่อัปเดตล่าสุด |

### 2.3 Document
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| protocol_id | UUID | Foreign Key ไปยัง Protocol |
| file_name | String | ชื่อไฟล์ |
| file_path | String | Path ที่เก็บไฟล์ |
| document_type | Enum | PROPOSAL, CONSENT_FORM, CV, OTHER |
| version | Integer | เวอร์ชันของเอกสาร |
| uploaded_at | DateTime | วันที่อัปโหลด |

### 2.4 ReviewAssignment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| protocol_id | UUID | Foreign Key ไปยัง Protocol |
| reviewer_id | UUID | Foreign Key ไปยัง User (ผู้ตรวจสอบ) |
| assigned_by | UUID | Foreign Key ไปยัง User (เลขาฯ ผู้มอบหมาย) |
| due_date | DateTime | วันครบกำหนด |
| status | Enum | PENDING, IN_PROGRESS, COMPLETED |
| assigned_at | DateTime | วันที่มอบหมาย |

### 2.5 ReviewComment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| assignment_id | UUID | Foreign Key ไปยัง ReviewAssignment |
| comments | Text | ความคิดเห็น |
| decision | Enum | APPROVE, REVISE, REJECT |
| reviewed_at | DateTime | วันที่ตรวจเสร็จ |

### 2.6 Meeting
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| meeting_date | DateTime | วันและเวลาประชุม |
| location | String | สถานที่ประชุม |
| agenda | Text | วาระการประชุม |
| minutes | Text | นาทีการประชุม |
| status | Enum | SCHEDULED, COMPLETED, CANCELLED |
| created_by | UUID | Foreign Key ไปยัง User (เลขาฯ) |

### 2.7 Certificate
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| protocol_id | UUID | Foreign Key ไปยัง Protocol |
| irb_number | String | เลขที่ใบรับรอง (IRB No.) |
| issue_date | DateTime | วันที่ออก |
| expiry_date | DateTime | วันหมดอายุ |
| file_path | String | Path ไฟล์ PDF ที่เซ็นแล้ว |
| issued_by | UUID | Foreign Key ไปยัง User (เลขาฯ) |

### 2.8 FollowUpReport
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| protocol_id | UUID | Foreign Key ไปยัง Protocol |
| report_type | Enum | PROGRESS, ADVERSE_EVENT, CLOSURE |
| description | Text | รายละเอียด |
| severity | Enum | MILD, MODERATE, SEVERE (สำหรับ AE) |
| status | Enum | OPEN, RESOLVED |
| reported_at | DateTime | วันที่รายงาน |

### 2.9 AuditLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | Foreign Key ไปยัง User |
| action | String | การกระทำ (CREATE, UPDATE, DELETE) |
| entity | String | ชื่อ Entity ที่ถูกกระทำ |
| entity_id | UUID | ID ของ Entity |
| details | JSON | รายละเอียดเพิ่มเติม |
| ip_address | String | IP Address ของผู้ใช้ |
| created_at | DateTime | วันที่เกิดเหตุการณ์ |

## 3. Row-Level Security (RLS) Policies

### 3.1 Protocol Table
    ALTER TABLE protocol ENABLE ROW LEVEL SECURITY;

    -- ผู้วิจัยเห็นเฉพาะ Protocol ที่ตัวเองเป็น PI
    CREATE POLICY researcher_protocol_policy ON protocol
    FOR ALL
    USING (pi_id = current_setting('app.current_user_id')::uuid);

    -- เลขาฯ และ Admin เห็นทั้งหมด
    CREATE POLICY secretary_protocol_policy ON protocol
    FOR ALL
    USING (current_setting('app.current_user_role') IN ('SECRETARY', 'ADMIN'));

### 3.2 ReviewAssignment Table
    ALTER TABLE review_assignment ENABLE ROW LEVEL SECURITY;

    -- ผู้ตรวจสอบเห็นเฉพาะงานที่ได้รับมอบหมาย
    CREATE POLICY reviewer_assignment_policy ON review_assignment
    FOR ALL
    USING (reviewer_id = current_setting('app.current_user_id')::uuid);

