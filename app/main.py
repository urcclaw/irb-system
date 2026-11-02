from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import จากโมดูลภายในแอป (ใช้ Relative Import เพราะไฟล์นี้อยู่ในโฟลเดอร์ app/)
from .models import Base
from .database import engine
from .routers import auth, admin, projects, assessments

# 1. ประกาศตัวแปร app เป็นอันดับแรก (สำคัญมาก!)
app = FastAPI(root_path="/api") 

# 2. สร้างตารางในฐานข้อมูลอัตโนมัติ (ถ้ายังไม่มี)
Base.metadata.create_all(bind=engine)

# 3. ตั้งค่า CORS เพื่อให้ Frontend (React) เรียกใช้ API ได้
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",   # สำหรับ Docker Frontend
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. ลงทะเบียน API Routers (ต้องอยู่หลังจากประกาศ app แล้วเท่านั้น)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(admin.router)
app.include_router(assessments.router)

# 5. Health Check Endpoint สำหรับตรวจสอบว่า Backend ทำงานปกติ
@app.get("/healthy")
def health_check():
    return {"status": "Healthy", "message": "IRB System Backend is running!"}