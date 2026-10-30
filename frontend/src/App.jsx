import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth.jsx";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/projects/Dashboard.jsx";
import IRBDashboard from "./pages/irb/IRBDashboard.jsx";
import CommitteeDashboard from "./pages/irb/CommitteeDashboard.jsx";
import SystemSettings from "./pages/admin/SystemSettings.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import BackupManager from "./pages/admin/BackupManager.jsx";

export default function App() {
  const { isAuthed, role } = useAuth(); 

  const getHomePath = () => {
    if (!isAuthed) return "/login";
    if (role === 'admin') return "/admin/settings"; 
    if (role === 'irb_officer') return "/irb-dashboard";
    if (role === 'committee') return "/committee-dashboard";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to={getHomePath()} />} />
          <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthed ? <Navigate to="/" /> : <Register />} />
          
          <Route path="/dashboard" element={isAuthed && (role === 'pi' || role === 'assistant') ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/irb-dashboard" element={isAuthed && (role === 'irb_officer' || role === 'admin') ? <IRBDashboard /> : <Navigate to="/" />} />
          <Route path="/committee-dashboard" element={isAuthed && (role === 'committee' || role === 'admin') ? <CommitteeDashboard /> : <Navigate to="/" />} />
          
          <Route path="/admin/settings" element={isAuthed && role === 'admin' ? <SystemSettings /> : <Navigate to="/" />} />
          <Route path="/admin/users" element={isAuthed && role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
          <Route path="/admin/backup" element={isAuthed && role === 'admin' ? <BackupManager /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}