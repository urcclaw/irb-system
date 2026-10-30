import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth.jsx";

export default function Navbar() {
  const { isAuthed, role, isIRB, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-blue-700 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-wide flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          ระบบ IRB
        </Link>

        <div className="flex items-center gap-4">
          {isAuthed ? (
            <>
              {role === 'admin' && (
                <>
                  <Link to="/admin/settings" className="text-sm hover:text-blue-200 transition">ตั้งค่าหน่วยงาน</Link>
                  <Link to="/admin/users" className="text-sm hover:text-blue-200 transition">จัดการผู้ใช้</Link>
                  <Link to="/admin/backup" className="text-sm hover:text-blue-200 transition">สำรองข้อมูล</Link>
                </>
              )}

              {role === 'irb_officer' && (
                <Link to="/irb-dashboard" className="text-sm hover:text-blue-200 transition">หน้าจอเจ้าหน้าที่ IRB</Link>
              )}
              
              {role === 'committee' && (
                <Link to="/committee-dashboard" className="text-sm hover:text-blue-200 transition">หน้าจอคณะกรรมการ</Link>
              )}

              {role === 'pi' && (
                <Link to="/dashboard" className="text-sm hover:text-blue-200 transition">โครงการของฉัน</Link>
              )}

              <div className="h-6 w-px bg-blue-500 mx-2"></div>
              
              <button onClick={handleLogout} className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition font-medium shadow-sm">ออกจากระบบ</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:text-blue-200 transition">เข้าสู่ระบบ</Link>
              <Link to="/register" className="text-sm bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition font-medium shadow-sm">ลงทะเบียน</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}