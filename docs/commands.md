# Commands Cheat Sheet (คำสั่งที่ใช้บ่อย)

ไฟล์นี้รวบรวมคำสั่งที่ใช้บ่อยในการพัฒนาระบบ IRB Management System

# Users
admin@example.com
secretary@example.com
reviewer@example.com

password123
# สร้าง token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login/access-token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=researcher@example.com&password=password123" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "✅ Token: $TOKEN"

# Commands
# 1. บังคับ Build ใหม่โดยไม่ใช้ Cache (เฉพาะ backend ที่มีขั้นตอน build frontend)
  docker compose build --no-cache backend

# 2. เมื่อ Build สำเร็จ (ขึ้น Successfully built) ให้สั่งเริ่มระบบ
  docker compose up -d --build db backend
   
# ถ้าต้องการดู Log ว่ารันผ่านไหม
  docker compose logs -f backend

# run backend
  cd backend
  uv run fastapi dev app/main.py

# run frontend
  cd frontend
  bun run dev

---

## 1. Git Workflow (แบบมีกราฟรูปตัว Y)
# ใช้ Git Branching แบบ Y-Shaped (หรือ Nested Feature-Fix Workflow) โดยทุกครั้งที่ merge branch ย่อยกลับเข้า branch หลัก ให้ใช้ --no-ff เสมอ

    # สร้าง Branch ใหม่สำหรับงาน
    git checkout -b feature/ชื่อ-branch

    # บันทึกงาน
    git add .
    git commit -m "feat: คำอธิบาย"

    # Push ขึ้น GitHub
    git push origin feature/ชื่อ-branch

    # สลับไป master และอัปเดต
    git checkout master
    git pull origin master

    # Merge แบบสร้าง Merge Commit (กราฟตัว Y)
    git merge --no-ff feature/ชื่อ-branch -m "Merge branch 'feature/ชื่อ-branch'"

    # Push master
    git push origin master

---

## 2. Backend Development (FastAPI)

    cd backend

    # ติดตั้ง Dependencies
    uv sync

    # รัน Backend (Development Mode)
    uv run fastapi dev app/main.py

    # สร้างข้อมูลเริ่มต้น (Admin User)
    uv run python app/initial_data.py

    # ตรวจสอบ Code Style
    uv run ruff check .
    uv run ruff format .

    # รัน Test
    uv run pytest

---

## 3. Database Migrations (Alembic)

    cd backend

    # สร้าง Migration ใหม่ (หลังแก้ models.py)
    uv run alembic revision --autogenerate -m "คำอธิบาย"

    # อัปเดต Database ตาม Migration
    uv run alembic upgrade head

    # ย้อนกลับ 1 Version
    uv run alembic downgrade -1

    # ดู Version ปัจจุบัน
    uv run alembic current

    # ดูประวัติ Migration
    uv run alembic history

---

## 4. Frontend Development (React)

    cd frontend

    # ติดตั้ง Dependencies
    bun install

    # รัน Frontend (Development Mode)
    bun run dev

    # Build สำหรับ Production
    bun run build

    # ตรวจสอบ Code Style
    bun run lint

---

## 5. Docker Compose (จัดการ Environment)

    # เริ่มระบบทั้งหมด (Background)
    docker compose up -d

    # หยุดระบบทั้งหมด
    docker compose down

    # หยุดและลบ Volume (ข้อมูลหายทั้งหมด)
    docker compose down -v

    # ดู Log ทั้งหมด
    docker compose logs -f

    # ดู Log เฉพาะ Backend
    docker compose logs -f backend

    # ดูสถานะ Container
    docker compose ps

---

## 6. Database Access (PostgreSQL)

    # เข้า psql CLI
    docker compose exec db psql -U postgres -d app

    # ดูตารางทั้งหมด
    docker compose exec db psql -U postgres -d app -c "\dt"

    # Backup Database
    docker compose exec db pg_dump -U postgres app > backup.sql

---

## 7. Testing (Playwright E2E)

    cd frontend

    # รัน E2E Test
    bunx playwright test

    # เปิด UI Mode
    bunx playwright test --ui

    # Debug Mode
    bunx playwright test --debug

---

## 8. Troubleshooting

    # รีสตาร์ทเฉพาะ Backend
    docker compose restart backend

    # Build ใหม่ทั้งหมด (แก้ปัญหา Cache)
    docker compose build --no-cache

    # เข้า Shell ใน Backend Container
    docker compose exec backend bash

    # เข้า Shell ใน Frontend Container
    docker compose exec frontend sh