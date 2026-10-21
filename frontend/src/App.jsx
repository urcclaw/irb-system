import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth.jsx";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/projects/Dashboard.jsx";
import IRBDashboard from "./pages/irb/IRBDashboard.jsx";
import CommitteeDashboard from "./pages/irb/CommitteeDashboard.jsx"; // สร้างไฟล์นี้เพิ่ม

export default function App() {
  const { isAuthed, role, isIRB, isCommittee } = useAuth(); 

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to={isAuthed ? (isCommittee ? "/committee-dashboard" : isIRB ? "/irb-dashboard" : "/dashboard") : "/login"} />} />
          <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthed ? <Navigate to="/" /> : <Register />} />
          
          <Route path="/dashboard" element={isAuthed && (role === 'pi' || role === 'assistant') ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/irb-dashboard" element={isAuthed && isIRB ? <IRBDashboard /> : <Navigate to="/" />} />
          <Route path="/committee-dashboard" element={isAuthed && isCommittee ? <CommitteeDashboard /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}