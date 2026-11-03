FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# system utilities for building some libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ✅ ตอนนี้ requirements.txt อยู่ในโฟลเดอร์ backend แล้ว COPY ได้ปกติ
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ✅ COPY โค้ดทั้งหมดในโฟลเดอร์ backend เข้ามา
COPY . .

EXPOSE 8000

# ✅ เปลี่ยนจาก app.main:app เป็น main:app (สำคัญมาก!)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]