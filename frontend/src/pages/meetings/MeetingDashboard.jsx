import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../store/auth.jsx';

export default function MeetingDashboard() {
  const navigate = useNavigate();
  const { isAuthed, role } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await api.get('/meetings/');
      setMeetings(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันจัดรูปแบบวันที่และเวลา (เริ่ม - สิ้นสุด)
  const formatDateTimeRange = (startDateStr, endDateStr) => {
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

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-gray-100 text-gray-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      scheduled: '📅 นัดหมายแล้ว',
      ongoing: '🔴 กำลังประชุม',
      completed: '✅ เสร็จสิ้น',
      cancelled: '❌ ยกเลิก'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ระบบจัดการประชุมคณะกรรมการ</h1>
          <p className="text-gray-600 mt-1">IRB Meeting Management System</p>
        </div>
        <div className="flex gap-2">
          {['admin', 'irb_officer'].includes(role) && (
            <button
              onClick={() => navigate('/meetings/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
            >
              + สร้างนัดประชุม
            </button>
          )}
          {['admin', 'irb_officer', 'committee'].includes(role) && (
            <button
              onClick={() => navigate('/meetings/history')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              📜 ดูประวัติย้อนหลัง
            </button>
          )}
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-700">ยังไม่มีนัดประชุม</h3>
          <p className="text-gray-500 mt-2">
            {['admin', 'irb_officer'].includes(role) 
              ? 'คลิกปุ่ม "สร้างนัดประชุม" เพื่อเริ่มต้น' 
              : 'รอเจ้าหน้าที่ประกาศนัดประชุม'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => navigate(`/meetings/${meeting.id}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* ✅ แสดงวันที่และเวลาเริ่ม-สิ้นสุด */}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {formatDateTimeRange(meeting.meeting_date, meeting.end_time)}
                      </h3>
                      {getStatusBadge(meeting.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mt-3">
                      <div>
                        <span className="font-medium">ประเภท:</span> {meeting.meeting_type}
                      </div>
                      <div>
                        <span className="font-medium">สถานที่:</span> {meeting.location || '-'}
                      </div>
                      <div>
                        <span className="font-medium">Quorum:</span> {meeting.quorum_required} คน
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-xl">→</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}