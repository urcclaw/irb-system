import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth.jsx";
import Navbar from "./components/navbar/Navbar.jsx";

// Auth Pages
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

// Project Pages
import Dashboard from "./pages/projects/Dashboard.jsx";

// IRB & Committee Pages
import IRBDashboard from "./pages/irb/IRBDashboard.jsx";
import CommitteeDashboard from "./pages/irb/CommitteeDashboard.jsx";
import AssessmentForm from "./pages/irb/AssessmentForm.jsx";
import AssessmentSummary from "./pages/irb/AssessmentSummary.jsx";

// Admin Pages
import SystemSettings from "./pages/admin/SystemSettings.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import BackupManager from "./pages/admin/BackupManager.jsx";
import LocationManagement from './pages/admin/LocationManagement.jsx';

// ✅ Meeting System Pages (เพิ่มใหม่)
import MeetingDashboard from "./pages/meetings/MeetingDashboard.jsx";
import MeetingDetail from "./pages/meetings/MeetingDetail.jsx";
import CreateMeeting from "./pages/meetings/CreateMeeting.jsx";
import MeetingHistory from "./pages/meetings/MeetingHistory.jsx";

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
          
          {/* Protected Routes สำหรับ Dashboard ต่างๆ */}
          <Route path="/dashboard" element={isAuthed && (role === 'pi' || role === 'assistant') ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/irb-dashboard" element={isAuthed && (role === 'irb_officer' || role === 'admin') ? <IRBDashboard /> : <Navigate to="/" />} />
          <Route path="/committee-dashboard" element={isAuthed && (role === 'committee' || role === 'admin') ? <CommitteeDashboard /> : <Navigate to="/" />} />
          
          {/* ✅ Route สำหรับหน้าแบบประเมินจริยธรรมการวิจัย (สำหรับ Committee) */}
          <Route 
            path="/projects/:projectId/assess" 
            element={isAuthed && (role === 'committee' || role === 'irb_officer' || role === 'admin') ? <AssessmentForm /> : <Navigate to="/" />} 
          />

          {/* ✅ Route สำหรับหน้าสรุปผลการประเมิน (สำหรับ IRB Officer / Admin) */}
          <Route 
            path="/projects/:projectId/assessment-summary" 
            element={isAuthed && (role === 'irb_officer' || role === 'admin') ? <AssessmentSummary /> : <Navigate to="/" />} 
          />

          {/* ========================================== */}
          {/* ✅ Meeting System Routes (เพิ่มใหม่)       */}
          {/* ========================================== */}
          
          {/* หน้ารายการประชุม: ทุกคนที่ล็อกอินเข้าได้ (Backend จะกรองข้อมูลให้ PI เห็นเฉพาะโครงการตัวเอง) */}
          <Route 
            path="/meetings" 
            element={isAuthed ? <MeetingDashboard /> : <Navigate to="/" />} 
          />
          
          {/* หน้าสร้างนัดประชุม: เฉพาะ Admin และ IRB Officer */}
          <Route 
            path="/meetings/new" 
            element={isAuthed && (role === 'admin' || role === 'irb_officer') ? <CreateMeeting /> : <Navigate to="/" />} 
          />
          
          {/* หน้าประวัติมติที่ประชุม: เฉพาะ Admin, IRB Officer และ Committee */}
          <Route 
            path="/meetings/history" 
            element={isAuthed && (role === 'admin' || role === 'irb_officer' || role === 'committee') ? <MeetingHistory /> : <Navigate to="/" />} 
          />
          
          {/* หน้ารายละเอียดการประชุม: ทุกคนที่ล็อกอินเข้าได้ (Backend กรองวาระให้ PI) */}
          <Route 
            path="/meetings/:meetingId" 
            element={isAuthed ? <MeetingDetail /> : <Navigate to="/" />} 
          />

          {/* Admin Routes */}
          <Route path="/admin/settings" element={isAuthed && role === 'admin' ? <SystemSettings /> : <Navigate to="/" />} />
          <Route path="/admin/users" element={isAuthed && role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
          <Route path="/admin/backup" element={isAuthed && role === 'admin' ? <BackupManager /> : <Navigate to="/" />} />
          <Route path="/admin/locations" element={isAuthed && role === 'admin' ? <LocationManagement /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}