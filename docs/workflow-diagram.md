# =====================================================================
# FILE: docs/workflow-diagram.md
# =====================================================================
# Workflow Diagram (แผนภาพกระบวนการทำงาน)

เอกสารนี้อธิบาย State Machine ของ Protocol และการไหลของงาน (Workflow) ในระบบ IRB Management System

## 1. Protocol State Machine

    [DRAFT]
        |
        | (Researcher: Submit)
        v
    [SUBMITTED]
        |
        | (Secretary: Start Screening)
        v
    [SCREENING]
        |
        +---------------------------+
        |                           |
        | (Secretary: Return)       | (Secretary: Pass)
        v                           v
    [REVISION_REQUIRED]         [PENDING_ASSIGNMENT]
        |                           |
        | (Researcher: Resubmit)    | (Secretary: Assign Reviewers)
        v                           v
    [SUBMITTED]                 [UNDER_REVIEW]
                                    |
                                    | (Reviewers: Complete Reviews)
                                    v
                                [AWAITING_DECISION]
                                    |
                        +-----------+-----------+
                        |                       |
                        | (Secretary: Approve)  | (Secretary: Reject)
                        v                       v
                    [APPROVED]              [REJECTED]
                        |
                        | (Secretary: Issue Certificate)
                        v
                    [ACTIVE] (Follow-up Period)
                        |
                        | (Researcher: Submit Closure Report)
                        v
                    [CLOSED]

## 2. ลำดับการทำงาน (Workflow Sequence)

### 2.1 Researcher ส่งคำขอ
1. Researcher สร้าง Protocol ในสถานะ DRAFT
2. Researcher แนบเอกสาร (Proposal, Consent Form, CV)
3. Researcher กด Submit -> สถานะเปลี่ยนเป็น SUBMITTED
4. ระบบส่ง Notification ไปยัง Secretary

### 2.2 Secretary ตรวจสอบเบื้องต้น (Screening)
1. Secretary เห็น Protocol ใหม่ใน Dashboard
2. Secretary ตรวจสอบความครบถ้วนของเอกสาร
3. ถ้าไม่ครบ: Secretary กด Return -> สถานะเป็น REVISION_REQUIRED + Comment
4. ถ้าครบ: Secretary กด Pass -> สถานะเป็น PENDING_ASSIGNMENT

### 2.3 Secretary จัดสรรผู้ตรวจสอบ
1. Secretary เลือก Reviewer ที่มีความเชี่ยวชาญตรงกับงานวิจัย
2. Secretary มอบหมายงาน (Assign) พร้อมกำหนด Due Date
3. ระบบส่ง Notification ไปยัง Reviewer
4. สถานะ Protocol เปลี่ยนเป็น UNDER_REVIEW

### 2.4 Reviewer ตรวจสอบ
1. Reviewer เห็นงานที่ได้รับมอบหมายใน Dashboard
2. Reviewer อ่านเอกสารและบันทึก Comment
3. Reviewer ลงมติ (Approve / Revise / Reject)
4. เมื่อ Reviewer ทุกคนเสร็จสิ้น -> สถานะเป็น AWAITING_DECISION

### 2.5 Secretary สรุปผลและออกหนังสือรับรอง
1. Secretary ดูผลการตรวจสอบของ Reviewer ทุกคน
2. ถ้าอนุมัติ: Secretary ออก Certificate (สร้าง PDF) -> สถานะเป็น APPROVED
3. ถ้าไม่อนุมัติ: Secretary แจ้งผล -> สถานะเป็น REJECTED
4. เมื่อออก Certificate แล้ว -> สถานะเป็น ACTIVE (เริ่มการติดตามผล)

### 2.6 การติดตามผล (Follow-up)
1. Researcher ส่ง Progress Report ตามกำหนด
2. Researcher รายงาน Adverse Event (ถ้ามี)
3. Secretary ติดตามและจัดการรายงาน
4. เมื่อสิ้นสุดโครงการ: Researcher ส่ง Closure Report
5. Secretary ตรวจสอบและกด Close -> สถานะเป็น CLOSED

## 3. Notification Triggers

| Event | ผู้รับ Notification | ช่องทาง |
|-------|---------------------|---------|
| Protocol ถูก Submit | Secretary | Email, In-app |
| Protocol ถูก Return | Researcher | Email, In-app |
| Protocol ผ่าน Screening | Secretary | In-app |
| Reviewer ถูก Assign | Reviewer | Email, In-app |
| Reviewer ตรวจเสร็จ | Secretary | In-app |
| Protocol อนุมัติ/ปฏิเสธ | Researcher | Email, In-app |
| Certificate ออกแล้ว | Researcher | Email, In-app |
| ใกล้ครบกำหนด Progress Report | Researcher, Secretary | Email, In-app |
| มี Adverse Event ใหม่ | Secretary | Email, In-app |