-- ล้างข้อมูลเก่า
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. ตาราง Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone_number VARCHAR,
    role VARCHAR DEFAULT 'pi',
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    totp_secret VARCHAR
);

-- 2. ตาราง Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    irb_number VARCHAR NOT NULL UNIQUE,
    approval_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR DEFAULT 'pending',
    document_path VARCHAR,
    owner_id INTEGER REFERENCES users(id)
);

-- 3. ตาราง Audit Logs (บันทึกประวัติ)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR NOT NULL,
    target_id VARCHAR,
    details TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ข้อมูลตัวอย่าง (รหัสผ่านทุกคนคือ: password123)
INSERT INTO users (email, username, first_name, last_name, phone_number, role, hashed_password, is_active)
VALUES 
('admin@hospital.com', 'admin', 'ผู้ดูแล', 'ระบบ', '0811111111', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', TRUE),
('irb@hospital.com', 'irb_officer1', 'เจ้าหน้าที่', 'IRB', '0822222222', 'irb_officer', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', TRUE),
('pi@hospital.com', 'doctor1', 'สมชาย', 'ใจดี', '0833333333', 'pi', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', TRUE),
('assistant@hospital.com', 'assistant1', 'สมหญิง', 'ขยัน', '0844444444', 'assistant', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', TRUE);

-- 5. ข้อมูลตัวอย่าง (Projects)
INSERT INTO projects (title, irb_number, approval_date, expiry_date, status, owner_id)
VALUES 
('การศึกษาประสิทธิผลของยาวิตามินดีในผู้สูงอายุ', 'IRB-2026-001', '2026-01-01 00:00:00', '2027-01-01 00:00:00', 'approved', 3),
('การทดสอบวัคซีนป้องกันโรคไข้เลือดออก', 'IRB-2026-002', '2026-02-01 00:00:00', '2027-02-01 00:00:00', 'pending', 3);