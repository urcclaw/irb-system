import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth.jsx";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/projects/Dashboard.jsx";
import IRBDashboard from "./pages/irb/IRBDashboard.jsx";
import CommitteeDashboard from "./pages/irb/CommitteeDashboard.jsx";
import TemplateManager from "./pages/admin/TemplateManager.jsx";

export default function App() {
  const { isAuthed, role } = useAuth(); 

  // ✅ ฟังก์ชันกำหนดหน้าแรกตาม Role
  const getHomePath = () => {
    if (!isAuthed) return "/login";
    if (role === 'admin') return "/admin/templates"; // Admin -> Template Manager
    if (role === 'irb_officer') return "/irb-dashboard";
    if (role === 'committee') return "/committee-dashboard";
    return "/dashboard"; // pi, assistant
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to={getHomePath()} />} />
          <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthed ? <Navigate to="/" /> : <Register />} />
          
          {/* หน้าสำหรับผู้วิจัย (PI) และผู้ช่วย */}
          <Route path="/dashboard" element={isAuthed && (role === 'pi' || role === 'assistant') ? <Dashboard /> : <Navigate to="/" />} />
          
          {/* หน้าสำหรับเจ้าหน้าที่ IRB */}
          <Route path="/irb-dashboard" element={isAuthed && (role === 'irb_officer' || role === 'admin') ? <IRBDashboard /> : <Navigate to="/" />} />
          
          {/* หน้าสำหรับคณะกรรมการ */}
          <Route path="/committee-dashboard" element={isAuthed && (role === 'committee' || role === 'admin') ? <CommitteeDashboard /> : <Navigate to="/" />} />
          
          {/* หน้าสำหรับ Admin (Template Manager) */}
          <Route path="/admin/templates" element={isAuthed && role === 'admin' ? <TemplateManager /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}