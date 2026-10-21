docker compose exec backend python -c "
import bcrypt
import psycopg

# สร้าง Hash ใหม่สำหรับ 'password123'
hashed = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# เชื่อมต่อ Database และอัปเดตทุกคน (ใช้ psycopg เวอร์ชัน 3)
conn = psycopg.connect(host='db', dbname='appdb', user='app', password='secret')
cur = conn.cursor()
cur.execute('UPDATE users SET hashed_password = %s;', (hashed,))
conn.commit()
print(f'อัปเดตรหัสผ่านทุกคนเป็น password123 สำเร็จ! (Rows affected: {cur.rowcount})')
cur.close()
conn.close()
"