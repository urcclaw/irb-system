import React, { useState } from 'react';
import api from '../../api';

export default function DecisionModal({ agenda, meetingId, onSave, onClose }) {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision) {
      alert('กรุณาเลือกมติ');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/meetings/${meetingId}/agenda/${agenda.id}/decision`, {
        decision,
        decision_reason: reason
      });
      onSave();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'บันทึกมติไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const decisions = [
    { value: 'approved', label: '✓ อนุมัติ', color: 'green' },
    { value: 'approved_with_conditions', label: '✓ อนุมัติมีเงื่อนไข', color: 'blue' },
    { value: 'revise', label: '✎ แก้ไขเพิ่มเติม', color: 'orange' },
    { value: 'rejected', label: '✗ ไม่อนุมัติ', color: 'red' },
    { value: 'deferred', label: '⏸ เลื่อนการพิจารณา', color: 'gray' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">📝 บันทึกมติที่ประชุม</h2>
          <p className="text-sm text-gray-600 mt-1">วาระที่ {agenda.agenda_order}: {agenda.project.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">มติที่ประชุม *</label>
            <div className="grid grid-cols-2 gap-2">
              {decisions.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDecision(d.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                    decision === d.value
                      ? `border-${d.color}-500 bg-${d.color}-50 text-${d.color}-800`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: decision === d.value ? d.color === 'green' ? '#10b981' : d.color === 'blue' ? '#3b82f6' : d.color === 'orange' ? '#f97316' : d.color === 'red' ? '#ef4444' : '#6b7280' : undefined,
                    backgroundColor: decision === d.value ? d.color === 'green' ? '#d1fae5' : d.color === 'blue' ? '#dbeafe' : d.color === 'orange' ? '#ffedd5' : d.color === 'red' ? '#fee2e2' : '#f3f4f6' : undefined
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผล/เงื่อนไข</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ระบุเหตุผลหรือเงื่อนไข (ถ้ามี)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !decision}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? 'กำลังบันทึก...' : '✓ บันทึกมติ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}