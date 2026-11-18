from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, protocols, review_assignments
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)

# เพิ่ม protocols router (ไม่ต้องใส่ prefix/tags ซ้ำ เพราะกำหนดไว้ในไฟล์ protocols.py แล้ว)
api_router.include_router(protocols.router)
api_router.include_router(review_assignments.router)

if settings.FASTAPI_ENV == "development":
    api_router.include_router(private.router)
