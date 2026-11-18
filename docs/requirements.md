# Requirements Specification: IRB Management System

## 1. Project Overview
ระบบสารสนเทศเพื่อการบริหารจัดการคณะกรรมการจริยธรรมการวิจัยในคน (Institutional Review Board - IRB) พัฒนาบนพื้นฐานของ Full Stack FastAPI Template (FastAPI, React, PostgreSQL) โดยมีจุดมุ่งหมายเพื่อเปลี่ยนกระบวนการทำงานแบบกระดาษ (Paper-based) ให้เป็นดิจิทัล (Paperless) และเพิ่มประสิทธิภาพในการบริหารจัดการเอกสาร การตรวจสอบ และการติดตามผลงานวิจัย

ระบบนี้มุ่งเน้นให้ "เลขานุการ (Secretary)" เป็นศูนย์กลางในการขับเคลื่อนกระบวนการทำงาน (Workflow Manager) ตั้งแต่การรับเรื่อง การจัดสรรผู้ตรวจสอบ ไปจนถึงการออกหนังสือรับรองและการติดตามผลหลังการอนุมัติ

## 2. User Roles and Permissions
ระบบแบ่งผู้ใช้งานออกเป็น 4 บทบาทหลัก เพื่อให้เกิดการแยกหน้าที่อย่างชัดเจน (Separation of Duties) ดังนี้

### 2.1 Researcher (ผู้วิจัย)
- สามารถสร้างและแก้ไขคำขอรับการพิจารณาจริยธรรม (Protocol) ในสถานะ Draft
- สามารถแนบเอกสารประกอบการวิจัย (Proposal, Informed Consent, CV, etc.)
- สามารถส่งคำขอ (Submit) เพื่อให้เลขานุการตรวจสอบ
- สามารถแก้ไขเอกสารตามข้อเสนอแนะของคณะกรรมการ (Revision)
- สามารถส่งรายงานความคืบหน้า (Progress Report), รายงานเหตุการณ์ไม่พึงประสงค์ (Adverse Event), และรายงานปิดโครงการ (Closure Report)

### 2.2 Reviewer (ผู้ทรงคุณวุฒิ/กรรมการ)
- สามารถดูคำขอที่ได้รับมอบหมาย (Assigned Protocols)
- สามารถบันทึกความคิดเห็นและข้อเสนอแนะ (Review Comments)
- สามารถลงมติ (Decision) ในระดับเบื้องต้น เช่น Approve, Revise, Reject
- สามารถเข้าร่วมการประชุมคณะกรรมการ (Full Board Review)

### 2.3 Secretary (เลขานุการ) - *Focus Area*
บทบาทนี้คือผู้จัดการกระบวนการ (Workflow Manager) โดยมีสิทธิ์การใช้งาน (Permissions) ครอบคลุมงานธุรการและการจัดการกระบวนการตรวจสอบ ดังนี้

#### 2.3.1 การรับเรื่องและตรวจสอบเบื้องต้น (Intake & Screening)
- **Intake Dashboard:** ดูรายการคำขอ (Protocol) ที่ผู้วิจัยส่งเข้ามาใหม่ทั้งหมด
- **Screening Checklist:** ตรวจสอบความครบถ้วนของเอกสาร (เช่น มี Proposal, Consent Form, CV ครบหรือไม่)
- **Action - Pass:** เปลี่ยนสถานะเป็น "Screening Passed" เพื่อส่งต่อไปยังขั้นตอนจัดสรรผู้ตรวจสอบ
- **Action - Return:** เปลี่ยนสถานะเป็น "Return for Correction" พร้อมระบุเหตุผล (Comment) ระบบจะส่งอีเมลแจ้งเตือนผู้วิจัยให้แก้ไข

#### 2.3.2 การจัดสรรผู้ตรวจสอบ (Assign Reviewers)
- **Reviewer Directory:** ดูรายชื่อและความเชี่ยวชาญ (Expertise) ของกรรมการ/ผู้ทรงคุณวุฒิ
- **Assign Task:** มอบหมายงานให้ Reviewer 1-2 ท่าน พร้อมกำหนดวันครบกำหนด (Due Date)
- **Re-assign:** เปลี่ยนตัวผู้ตรวจสอบได้ในกรณีจำเป็น (เช่น กรรมการติดธุระ)

#### 2.3.3 การจัดการกำหนดการประชุม (Meeting Management)
- **Create Meeting:** สร้างรอบการประชุมคณะกรรมการ (Meeting Round)
- **Agenda Management:** ดึงโปรเจกต์ที่รอเข้าที่ประชุม (Full Board Review) มาใส่ในวาระ (Agenda)
- **Document Distribution:** รวบรวมและเผยแพร่เอกสารสรุป (Executive Summary) ให้กรรมการอ่านล่วงหน้า
- **Minutes of Meeting:** บันทึกนาทีการประชุมและมติที่ประชุม

#### 2.3.4 การออกหนังสือรับรอง (Certificate Issuance)
- **Generate COA:** ระบบสร้างไฟล์ PDF หนังสือรับรอง (Certificate of Approval) อัตโนมัติ โดยดึงเลขที่ใบรับรอง (IRB No.) และวันหมดอายุ (Expiration Date)
- **Upload Signed Document:** อัปโหลดไฟล์ที่ประธานกรรมการเซ็นแล้วกลับเข้าสู่ระบบ
- **Archive:** เก็บประวัติการออกเอกสารทั้งหมด

#### 2.3.5 การติดตามผล (Follow-up & Post-Approval)
- **Follow-up Dashboard:** ติดตามโปรเจกต์ที่อยู่ระหว่างดำเนินการ และแจ้งเตือนโปรเจกต์ที่ใกล้ครบกำหนดส่งรายงานความคืบหน้า
- **Adverse Event Management:** รับเรื่องรายงานเหตุการณ์ไม่พึงประสงค์ (AE) ประเมินความรุนแรงเบื้องต้น และส่งต่อให้ประธาน/กรรมการที่เกี่ยวข้องพิจารณา
- **Closure Management:** ตรวจสอบรายงานปิดโครงการ (Closure Report) และกดปิดสถานะโปรเจกต์

### 2.4 Admin (ผู้ดูแลระบบ)
- จัดการข้อมูลผู้ใช้งาน (User Management) และกำหนดสิทธิ์ (Role Assignment)
- จัดการข้อมูลพื้นฐาน (Master Data) เช่น ข้อมูลคณะกรรมการ, ข้อมูลหน่วยงาน
- ดู System Log และตรวจสอบ Audit Trail

## 3. System Features and Functional Requirements

### 3.1 Document Management
- รองรับการอัปโหลดไฟล์ประเภท PDF, Word, Excel
- มีระบบจัดเก็บเวอร์ชันของเอกสาร (Version Control) เพื่อให้เห็นประวัติการแก้ไข
- มีระบบความปลอดภัยในการเข้าถึงไฟล์ (เฉพาะผู้ที่มีสิทธิ์เท่านั้น)

### 3.2 Workflow and State Machine
ระบบต้องมีกลไกจัดการสถานะของ Protocol ตามลำดับ (Lifecycle) ดังนี้:
1. **DRAFT:** ผู้วิจัยกำลังเขียนคำขอ (เลขาฯ มองไม่เห็น)
2. **SUBMITTED:** ผู้วิจัยส่งคำขอ (เลขาฯ เห็นคิว)
3. **SCREENING:** เลขาฯ กำลังตรวจเอกสาร
4. **REVISION_REQUIRED:** ส่งกลับให้ผู้วิจัยแก้ไข (วนลูปจนกว่าจะผ่าน)
5. **PENDING_ASSIGNMENT:** เอกสารครบ เลขาฯ กำลังจัดหาผู้ตรวจสอบ
6. **UNDER_REVIEW:** กรรมการกำลังตรวจ (Expedited หรือ Full Board)
7. **AWAITING_DECISION:** ตรวจเสร็จแล้ว รอเลขาฯ สรุปผล
8. **APPROVED / REJECTED:** เลขาฯ ดำเนินการออกหนังสือรับรอง หรือแจ้งผลไม่อนุมัติ
9. **ACTIVE (FOLLOW-UP):** อยู่ระหว่างการทำวิจัย เลขาฯ ติดตามงาน
10. **CLOSED:** ปิดโครงการ

### 3.3 Notification System
- แจ้งเตือนผ่านอีเมล (Email Notification) เมื่อมีการเปลี่ยนสถานะที่สำคัญ
- แจ้งเตือนบนหน้าเว็บ (In-app Notification) เช่น มีคำขอใหม่, มีงานที่ได้รับมอบหมาย, มีรายงาน AE ใหม่

### 3.4 Reporting and Dashboard
- **Secretary Dashboard:** แสดง Widget สรุปงานที่ต้องทำ (Inbox & Screening Queue, Pending Assignments, Upcoming Meetings, Overdue Follow-ups, Adverse Events Alert)
- **Statistical Reports:** รายงานสถิติจำนวนโปรเจกต์ แยกตามสถานะ, ประเภทความเสี่ยง, หรือหน่วยงาน

### 3.5 Audit Trail and Security
- บันทึก Log ทุกการกระทำ (Create, Update, Delete) ของผู้ใช้ทุกคน โดยระบุ User, Timestamp, Action, และ IP Address
- ใช้ระบบยืนยันตัวตนด้วย JWT (JSON Web Token)
- ใช้ระบบ Row-Level Security (RLS) ในระดับฐานข้อมูล PostgreSQL เพื่อป้องกันการเข้าถึงข้อมูลข้ามสิทธิ์

## 4. UI/UX Design Guidelines
- **Secretary Interface:** ต้องเป็นแบบ Task-Oriented Dashboard เปิดมาแล้วเห็นงานที่ต้องจัดการทันที
- **Sidebar Navigation:** ประกอบด้วย Dashboard, Submissions, Review Management, Meetings & Agendas, Certificates, Post-Approval, Reports
- **Design System:** ใช้ Tailwind CSS และ shadcn/ui ตามเทมเพลตต้นแบบ
- **Responsive Design:** รองรับการใช้งานบน Desktop และ Tablet

## 5. Database Entities (High-Level)
- **User:** ข้อมูลผู้ใช้และ Role
- **Protocol:** ข้อมูลหลักของงานวิจัย, สถานะปัจจุบัน, PI
- **Document:** ไฟล์แนบแต่ละประเภท (เชื่อมกับ Protocol)
- **ReviewAssignment:** ตารางเชื่อมระหว่าง Protocol กับ Reviewer
- **ReviewComment:** ความเห็นและมติของกรรมการ
- **Meeting:** รอบการประชุม
- **MeetingAgenda:** วาระการประชุม (เชื่อมกับ Protocol)
- **Certificate:** ข้อมูลหนังสือรับรอง, IRB No., วันหมดอายุ
- **FollowUpReport:** รายงานความคืบหน้า, AE, การปิดโครงการ
- **AuditLog:** บันทึกประวัติการกระทำในระบบ

## 6. Technical Stack
- **Backend:** FastAPI, SQLModel (ORM), Pydantic
- **Database:** PostgreSQL (พร้อมระบบ RLS)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Testing:** Pytest (Backend), Playwright (E2E)
- **Deployment:** Docker Compose, Traefik (Reverse Proxy)
- **CI/CD:** GitHub Actions