import React from 'react';

export default function AgendaCard({ agenda, canVote, quorumMet, onRecordDecision }) {
  const getDecisionBadge = (decision) => {
    if (!decision) return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">⏳ รอพิจารณา</span>;
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
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[decision]}`}>{labels[decision]}</span>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      new: '🆕 โครงการใหม่',
      continuation: '🔄 ติดตามต่อเนื่อง',
      amendment: '✏️ แก้ไขเพิ่มเติม',
      acknowledgement: '📢 รับทราบ'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-400">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
              วาระที่ {agenda.agenda_order}
            </span>
            <span className="text-sm text-gray-600">{getTypeLabel(agenda.agenda_type)}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{agenda.project.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            เลขที่ IRB: {agenda.project.irb_number || 'ยังไม่กำหนด'} • 
            ประเภท: {agenda.project.review_type}
          </p>
        </div>
        <div className="ml-4">{getDecisionBadge(agenda.decision)}</div>
      </div>

      {agenda.decision_reason && (
        <div className="mt-3 p-3 bg-gray-50 rounded border-l-2 border-gray-400">
          <p className="text-xs font-semibold text-gray-600 mb-1">เหตุผล/เงื่อนไข:</p>
          <p className="text-sm text-gray-700">{agenda.decision_reason}</p>
        </div>
      )}

      {!agenda.decision && canVote && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onRecordDecision(agenda)}
            disabled={!quorumMet}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              quorumMet
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {quorumMet ? '📝 บันทึกมติ' : '⚠️ ไม่ครบองค์ประชุม'}
          </button>
        </div>
      )}
    </div>
  );
}