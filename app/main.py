from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .models import Base
from .database import engine
from .routers import auth, admin, projects  # <-- ลบ todos, users ออก และเพิ่ม projects

app = FastAPI(root_path="/api") 

Base.metadata.create_all(bind=engine)

# CORS for React (เพิ่มพอร์ต 8080 สำหรับ Docker Frontend)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",   # <-- เพิ่มสำหรับ Docker
    "http://127.0.0.1:8080",   # <-- เพิ่มสำหรับ Docker
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(projects.router) # <-- เปลี่ยนจาก todos เป็น projects

@app.get("/healthy")
def health_check():
    return {"status": "Healthy"}