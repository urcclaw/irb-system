import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function MeetingHistory() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ decision_type: '', start_date: '', end_date: '' });

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.decision_type) params.decision_type = filter.decision_type;
      if (filter.start_date) params.start_date = filter.start_date;
      if (filter.end_date) params.end_date = filter.end_date;
      const res = await api.get('/meetings/history/decisions', { params });
      setDecisions(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const getDecisionBadge = (decision) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      approved_with_conditions: 'bg-blue-100 text-blue-800',
      revise: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
      deferred: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      approved: '✓ อนุมัติ',
      approved_with_conditions: '✓ อนุมัติมีเงื่อนไข',
      revise: '✎ แก้ไข',
      rejected: '✗ ไม่อนุมัติ',
      deferred: '⏸ เลื่อน'
    };
    return <span className={`px-3 py-1 rounded-full text-sm ${styles[decision]}`}>{labels[decision]}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📜 ประวัติมติที่ประชุม</h1>
        <button
          onClick={() => navigate('/meetings')}
          className="text-blue-600 hover:underline"
        >
          ← กลับ
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ประเภทมติ</label>
            <select
              value={filter.decision_type}
              onChange={(e) => setFilter({ ...filter, decision_type: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">ทั้งหมด</option>
              <option value="approved">อนุมัติ</option>
              <option value="approved_with_conditions">อนุมัติมีเงื่อนไข</option>
              <option value="revise">แก้ไข</option>
              <option value="rejected">ไม่อนุมัติ</option>
              <option value="deferred">เลื่อน</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ตั้งแต่</label>
            <input
              type="date"
              value={filter.start_date}
              onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ถึง</label>
            <input
              type="date"
              value={filter.end_date}
              onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">กำลังโหลด...</div>
      ) : decisions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          ไม่พบประวัติมติที่ตรงตามเงื่อนไข
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">โครงการ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภทวาระ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">มติ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เหตุผล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {decisions.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{formatDate(d.decision_date)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{d.project.title}</div>
                    <div className="text-xs text-gray-500">{d.project.irb_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{d.agenda_type}</td>
                  <td className="px-6 py-4">{getDecisionBadge(d.decision)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={d.decision_reason}>
                    {d.decision_reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}