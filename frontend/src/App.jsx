import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth.jsx";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/projects/Dashboard.jsx";
import IRBDashboard from "./pages/irb/IRBDashboard.jsx";

export default function App() {
  const { isAuthed, role, isIRB } = useAuth(); 
  const isStaff = isIRB;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to={isAuthed ? (isStaff ? "/irb-dashboard" : "/dashboard") : "/login"} />} />
          <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthed ? <Navigate to="/" /> : <Register />} />
          
          {/* หน้าสำหรับ PI และ Assistant */}
          <Route path="/dashboard" element={isAuthed && (role === 'pi' || role === 'assistant') ? <Dashboard /> : <Navigate to="/" />} />
          
          {/* หน้าสำหรับ IRB และ Admin */}
          <Route path="/irb-dashboard" element={isAuthed && isStaff ? <IRBDashboard /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}