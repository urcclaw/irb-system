# =====================================================================
# FILE: docs/api-spec.md
# =====================================================================
# API Specification (ข้อกำหนด API)

เอกสารสรุป API Endpoints ของระบบ IRB Management System
(รายละเอียดเต็มดูได้ที่ Swagger UI: http://localhost:8000/docs)

## 1. Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/login/access-token | ล็อกอินและรับ JWT Token |
| POST | /api/v1/login/test-token | ทดสอบ Token |
| POST | /api/v1/password-recovery/{email} | ขอรีเซ็ตรหัสผ่าน |
| POST | /api/v1/reset-password | รีเซ็ตรหัสผ่านด้วย Token |
| POST | /api/v1/users/signup | ลงทะเบียนผู้ใช้ใหม่ |

## 2. Users (Admin เท่านั้น)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users/ | ดูรายชื่อผู้ใช้ทั้งหมด |
| POST | /api/v1/users/ | สร้างผู้ใช้ใหม่ |
| GET | /api/v1/users/me | ดูข้อมูลตัวเอง |
| PATCH | /api/v1/users/me | แก้ไขข้อมูลตัวเอง |
| GET | /api/v1/users/{user_id} | ดูข้อมูลผู้ใช้ตาม ID |
| PATCH | /api/v1/users/{user_id} | แก้ไขข้อมูลผู้ใช้ |
| DELETE | /api/v1/users/{user_id} | ลบผู้ใช้ |

## 3. Protocols (คำขอรับการพิจารณา)
| Method | Endpoint | Description | Role ที่เข้าถึงได้ |
|--------|----------|-------------|-------------------|
| GET | /api/v1/protocols/ | ดูรายการ Protocol | ทุก Role (ตาม RLS) |
| POST | /api/v1/protocols/ | สร้าง Protocol ใหม่ | Researcher |
| GET | /api/v1/protocols/{id} | ดูรายละเอียด Protocol | ทุก Role (ตาม RLS) |
| PATCH | /api/v1/protocols/{id} | แก้ไข Protocol | Researcher (เจ้าของ), Secretary |
| DELETE | /api/v1/protocols/{id} | ลบ Protocol (Draft) | Researcher (เจ้าของ) |
| PATCH | /api/v1/protocols/{id}/status | เปลี่ยนสถานะ Protocol | Secretary |
| POST | /api/v1/protocols/{id}/submit | ส่งคำขอ | Researcher (เจ้าของ) |

## 4. Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/protocols/{id}/documents | อัปโหลดเอกสาร |
| GET | /api/v1/protocols/{id}/documents | ดูรายการเอกสาร |
| DELETE | /api/v1/documents/{doc_id} | ลบเอกสาร |

## 5. Review Assignments
| Method | Endpoint | Description | Role ที่เข้าถึงได้ |
|--------|----------|-------------|-------------------|
| POST | /api/v1/review-assignments/ | มอบหมายผู้ตรวจสอบ | Secretary |
| GET | /api/v1/review-assignments/ | ดูรายการที่มอบหมาย | Secretary, Reviewer |
| PATCH | /api/v1/review-assignments/{id} | แก้ไขการมอบหมาย | Secretary |
| POST | /api/v1/review-assignments/{id}/comments | บันทึกความคิดเห็น | Reviewer |

## 6. Meetings
| Method | Endpoint | Description | Role ที่เข้าถึงได้ |
|--------|----------|-------------|-------------------|
| POST | /api/v1/meetings/ | สร้างการประชุม | Secretary |
| GET | /api/v1/meetings/ | ดูรายการประชุม | Secretary, Reviewer |
| PATCH | /api/v1/meetings/{id} | แก้ไขการประชุม | Secretary |
| POST | /api/v1/meetings/{id}/agenda | เพิ่มวาระการประชุม | Secretary |

## 7. Certificates
| Method | Endpoint | Description | Role ที่เข้าถึงได้ |
|--------|----------|-------------|-------------------|
| POST | /api/v1/certificates/ | ออกหนังสือรับรอง | Secretary |
| GET | /api/v1/certificates/ | ดูรายการหนังสือรับรอง | Secretary, Researcher (ของตัวเอง) |
| POST | /api/v1/certificates/{id}/upload | อัปโหลดไฟล์ที่เซ็นแล้ว | Secretary |

## 8. Follow-up Reports
| Method | Endpoint | Description | Role ที่เข้าถึงได้ |
|--------|----------|-------------|-------------------|
| POST | /api/v1/protocols/{id}/follow-up | ส่งรายงานติดตามผล | Researcher |
| GET | /api/v1/protocols/{id}/follow-up | ดูรายงานติดตามผล | Secretary, Researcher (ของตัวเอง) |
| PATCH | /api/v1/follow-up/{id} | อัปเดตสถานะรายงาน | Secretary |

## 9. Audit Logs (Admin เท่านั้น)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/audit-logs/ | ดู Audit Log ทั้งหมด |
| GET | /api/v1/audit-logs/{id} | ดู Audit Log ตาม ID |

