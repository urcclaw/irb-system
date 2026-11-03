from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from models import Base
from database import engine
from routers import auth, admin, projects, assessments
from routers import meetings  # ✅ เพิ่มบรรทัดนี้
from routers import locations

# 1. ประกาศตัวแปร app
app = FastAPI(root_path="/api") 

# 2. สร้างตารางในฐานข้อมูล
Base.metadata.create_all(bind=engine)

# 3. CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. ลงทะเบียน Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(admin.router)
app.include_router(assessments.router)
app.include_router(meetings.router)  # ✅ เพิ่มบรรทัดนี้
app.include_router(locations.router)

# 5. Health Check
@app.get("/healthy")
def health_check():
    return {"status": "Healthy", "message": "IRB System Backend is running!"}