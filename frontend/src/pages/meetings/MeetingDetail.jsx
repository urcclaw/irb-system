import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../store/auth.jsx';
import AttendanceTable from '../../components/meetings/AttendanceTable';
import AgendaCard from '../../components/meetings/AgendaCard';
import DecisionModal from '../../components/meetings/DecisionModal';

export default function MeetingDetail() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  
  // ✅ แก้ไข 1: ดึง role โดยตรงจาก hook (เหมือน Dashboard)
  const { role } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [meetingId]);

  const loadData = async () => {
    try {
      const res = await api.get(`/meetings/${meetingId}`);
      setData(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDecision = (agenda) => {
    setSelectedAgenda(agenda);
    setShowDecisionModal(true);
  };

  const handleDecisionSaved = () => {
    setShowDecisionModal(false);
    setSelectedAgenda(null);
    loadData(); // Reload ข้อมูลใหม่
  };

  // ✅ เพิ่ม: ฟังก์ชันลบการประชุม
  const handleDeleteMeeting = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบการประชุมนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }
    try {
      await api.delete(`/meetings/${meetingId}`);
      alert('ลบการประชุมสำเร็จ');
      navigate('/meetings');
    } catch (error) {
      alert(error.response?.data?.detail || 'ไม่สามารถลบการประชุมได้');
    }
  };

  if (loading) {
    return <div className="text-center py-12">กำลังโหลด...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-500">ไม่พบข้อมูลการประชุม</div>;
  }

  const { meeting, agendas, attendances, quorum_met, present_count } = data;
  
  // ✅ แก้ไข 2: ใช้ role โดยตรง แทน user?.role
  const canManage = ['admin', 'irb_officer'].includes(role);
  const canVote = ['admin', 'irb_officer', 'committee'].includes(role);

  // ✅ แก้ไข 3: ฟังก์ชันจัดรูปแบบวันที่และเวลา (เริ่ม - สิ้นสุด)
  const formatDateTimeRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return 'ไม่ระบุวันที่';
    const start = new Date(startDateStr);
    const dateStr = start.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const startTime = start.toLocaleTimeString('th-TH', {
      hour: '2-digit', minute: '2-digit'
    });
    
    if (endDateStr) {
      const end = new Date(endDateStr);
      const endTime = end.toLocaleTimeString('th-TH', {
        hour: '2-digit', minute: '2-digit'
      });
      return `${dateStr} | เวลา ${startTime} - ${endTime} น.`;
    }
    
    return `${dateStr} | เวลา ${startTime} น.`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/meetings')}
          className="text-blue-600 hover:underline mb-3 inline-block"
        >
          ← กลับไปรายการประชุม
        </button>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              {/* ✅ แสดงวันที่และเวลาเริ่ม-สิ้นสุด */}
              <h1 className="text-3xl font-bold text-gray-800">
                {formatDateTimeRange(meeting.meeting_date, meeting.end_time)}
              </h1>
              <p className="text-gray-600 mt-2">
                {meeting.meeting_type} • {meeting.location || 'ไม่ระบุสถานที่'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                meeting.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                meeting.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {meeting.status === 'scheduled' && '📅 นัดหมายแล้ว'}
                {meeting.status === 'ongoing' && '🔴 กำลังประชุม'}
                {meeting.status === 'completed' && '✅ เสร็จสิ้น'}
                {meeting.status === 'cancelled' && '❌ ยกเลิก'}
              </span>
              
              {/* ✅ เพิ่มปุ่มลบการประชุม */}
              {canManage && meeting.status === 'scheduled' && (
                <button
                  onClick={handleDeleteMeeting}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                >
                  🗑️ ลบ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quorum Status Banner */}
      {canManage && (
        <div className={`rounded-lg p-4 mb-6 ${
          quorum_met ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">
                สถานะองค์ประชุม (Quorum)
              </h3>
              <p className="text-sm mt-1">
                กรรมการเข้าร่วม: <span className="font-bold">{present_count}</span> / 
                ต้องการขั้นต่ำ: <span className="font-bold">{meeting.quorum_required}</span> คน
              </p>
            </div>
            <div className={`text-2xl font-bold ${quorum_met ? 'text-green-600' : 'text-red-600'}`}>
              {quorum_met ? '✓ ครบองค์ประชุม' : '✗ ไม่ครบองค์ประชุม'}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Section */}
      {canManage && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">✅ การเข้าร่วมประชุม</h2>
          <AttendanceTable
            attendances={attendances}
            meetingId={meetingId}
            onAttendanceChange={loadData}
          />
        </div>
      )}

      {/* Agendas Section */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          📋 วาระการประชุม ({agendas.length} รายการ)
        </h2>
        {agendas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            ยังไม่มีวาระในการประชุมนี้
          </div>
        ) : (
          <div className="space-y-4">
            {agendas.map((agenda) => (
              <AgendaCard
                key={agenda.id}
                agenda={agenda}
                canVote={canVote}
                quorumMet={quorum_met}
                onRecordDecision={handleRecordDecision}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedAgenda && (
        <DecisionModal
          agenda={selectedAgenda}
          meetingId={meetingId}
          onSave={handleDecisionSaved}
          onClose={() => setShowDecisionModal(false)}
        />
      )}
    </div>
  );
}