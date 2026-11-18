# =====================================================================
# FILE: README.md
# =====================================================================
# IRB Management System (ระบบคณะกรรมการจริยธรรมการวิจัยในคน)

ระบบสารสนเทศเพื่อการบริหารจัดการกระบวนการพิจารณาจริยธรรมการวิจัยในคน (Institutional Review Board - IRB) พัฒนาบนพื้นฐานของ Full Stack FastAPI Template (FastAPI + React + PostgreSQL)

## วัตถุประสงค์
เพื่อเปลี่ยนกระบวนการทำงานแบบกระดาษ (Paper-based) ให้เป็นดิจิทัล (Paperless) และเพิ่มประสิทธิภาพในการบริหารจัดการเอกสาร การตรวจสอบ และการติดตามผลงานวิจัย โดยมี "เลขานุการ (Secretary)" เป็นศูนย์กลางในการขับเคลื่อนกระบวนการทำงาน (Workflow Manager)

## Technology Stack
- Backend: FastAPI, SQLModel, Pydantic
- Database: PostgreSQL (พร้อมระบบ Row-Level Security - RLS)
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Testing: Pytest, Playwright
- Deployment: Docker Compose, Traefik

## Project Structure

    irb-system/
    ├── backend/          # FastAPI Application
    │   ├── app/
    │   │   ├── api/      # API Endpoints
    │   │   ├── core/     # Config, Security, Dependencies
    │   │   ├── models.py # SQLModel Database Schema
    │   │   └── main.py   # Entry Point
    │   └── alembic/      # Database Migrations
    ├── frontend/         # React Application
    │   ├── src/
    │   │   ├── components/
    │   │   ├── routes/
    │   │   └── main.tsx
    │   └── package.json
    ├── docs/             # Documentation
    ├── compose.yml       # Docker Compose Config
    ├── commands.md       # Cheat Sheet คำสั่งที่ใช้บ่อย
    └── daily-progress.md # บันทึกความคืบหน้า

## Getting Started

### สิ่งที่ต้องมี (Prerequisites)
- Docker & Docker Compose
- Python 3.14+ (หรือใช้ผ่าน Docker)
- Node.js / Bun (หรือใช้ผ่าน Docker)

### วิธีติดตั้ง (Installation)
1. Clone Repository:
    git clone https://github.com/urcclaw/irb-system.git
2. คัดลอกไฟล์ Environment:
    cp .env.example .env
3. แก้ไขค่าตัวแปรใน .env ให้เหมาะสม
4. รันระบบด้วย Docker Compose:
    docker compose up -d
5. เข้าใช้งาน Frontend ที่ http://localhost:5173
6. เข้าใช้งาน API Docs ที่ http://localhost:8000/docs

## Documentation
- Requirements Specification: requirements.md
- Database Schema: docs/database-schema.md
- API Specification: docs/api-spec.md
- Workflow Diagram: docs/workflow-diagram.md
- Commands Cheat Sheet: commands.md
- Daily Progress Log: daily-progress.md

## License
MIT License

