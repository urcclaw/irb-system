import React, { useState } from 'react';
import api from '../../api';

export default function AttendanceTable({ attendances, meetingId, onAttendanceChange }) {
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (attendanceId, newStatus) => {
    setSaving(true);
    try {
      await api.put(`/meetings/${meetingId}/attendance/${attendanceId}`, {
        status: newStatus
      });
      onAttendanceChange();
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('ไม่สามารถอัปเดตสถานะได้');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      leave: 'bg-yellow-100 text-yellow-800'
    };
    const labels = { present: '✓ เข้าร่วม', absent: '✗ ขาด', leave: 'ลา' };
    return <span className={`px-3 py-1 rounded-full text-sm ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ตำแหน่ง</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บทบาท</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">สถานะ</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {attendances.map((att) => (
            <tr key={att.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">
                  {att.user.first_name} {att.user.last_name}
                  {att.is_chairperson && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">ประธาน</span>}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{att.user.position || '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{att.user.role}</td>
              <td className="px-6 py-4 text-center">{getStatusBadge(att.status)}</td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-1">
                  {['present', 'absent', 'leave'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(att.id, s)}
                      disabled={saving}
                      className={`px-3 py-1 text-xs rounded transition ${
                        att.status === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {s === 'present' ? 'มา' : s === 'absent' ? 'ขาด' : 'ลา'}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}