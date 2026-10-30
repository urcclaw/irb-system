import { useState } from 'react';
import api from '../../api';

export default function BackupManager() {
  const [activeTab, setActiveTab] = useState('backup');
  const [restoreFile, setRestoreFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [selectedTable, setSelectedTable] = useState('users');
  const [tableData, setTableData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const tables = [
    { key: 'users', label: 'ผู้ใช้งาน (Users)' },
    { key: 'projects', label: 'โครงการวิจัย (Projects)' },
    { key: 'committee_reviews', label: 'ความเห็นกรรมการ (Reviews)' },
    { key: 'audit_logs', label: 'บันทึกการทำงาน (Audit Logs)' },
    { key: 'document_templates', label: 'แม่แบบหนังสือ (Templates)' },
    { key: 'system_settings', label: 'ตั้งค่าระบบ (Settings)' },
  ];

  const handleBackup = async () => {
    try {
      const res = await api.get('/admin/backup', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${Date.now()}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('ไม่สามารถสำรองข้อมูลได้');
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!restoreFile) return;
    
    if (!window.confirm('คำเตือน: การนำเข้าข้อมูลจะลบข้อมูลปัจจุบันทั้งหมดและแทนที่ด้วยไฟล์ที่อัปโหลด ยืนยันหรือไม่?')) return;
    
    setIsRestoring(true);
    const formData = new FormData();
    formData.append('file', restoreFile);
    
    try {
      const res = await api.post('/admin/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleViewData = async () => {
    setIsLoadingData(true);
    try {
      const res = await api.get(`/admin/view-data/${selectedTable}`);
      setTableData(res.data);
    } catch (err) {
      alert('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">จัดการฐานข้อมูล</h1>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('backup')} className={`px-6 py-3 font-medium ${activeTab === 'backup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>📥 สำรองข้อมูล</button>
        <button onClick={() => setActiveTab('restore')} className={`px-6 py-3 font-medium ${activeTab === 'restore' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>📤 นำเข้าข้อมูล</button>
        <button onClick={() => setActiveTab('view')} className={`px-6 py-3 font-medium ${activeTab === 'view' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>🔍 ดูข้อมูล</button>
      </div>

      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <p className="text-slate-600">การสำรองข้อมูลจะดาวน์โหลดไฟล์ฐานข้อมูลทั้งหมด (PostgreSQL Dump) เพื่อเก็บไว้เป็น Backup ในกรณีฉุกเฉิน</p>
          <button onClick={handleBackup} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition">📥 ดาวน์โหลด Backup (.sql)</button>
        </div>
      )}

      {activeTab === 'restore' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 max-w-lg">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
            ⚠️ <strong>คำเตือน:</strong> การนำเข้าข้อมูลจะ<strong>ลบข้อมูลปัจจุบันทั้งหมด</strong> และแทนที่ด้วยไฟล์ที่อัปโหลด กรุณาสำรองข้อมูลก่อนดำเนินการ
          </div>
          <form onSubmit={handleRestore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">เลือกไฟล์ .sql</label>
              <input type="file" accept=".sql" onChange={e => setRestoreFile(e.target.files[0])} className="w-full border p-2 rounded-lg" required />
            </div>
            <button type="submit" disabled={isRestoring} className={`w-full py-2.5 rounded-lg font-medium shadow-sm transition ${isRestoring ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
              {isRestoring ? 'กำลังนำเข้าข้อมูล...' : '📤 นำเข้าข้อมูล'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">เลือกตาราง</label>
              <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} className="w-full border p-2 rounded-lg">
                {tables.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <button onClick={handleViewData} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium shadow-sm transition">🔍 แสดงข้อมูล</button>
          </div>

          {isLoadingData ? (
            <div className="text-center py-10">กำลังโหลด...</div>
          ) : tableData.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {Object.keys(tableData[0]).map(key => (
                      <th key={key} className="p-3 font-semibold text-slate-600 whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="p-3 text-slate-700 max-w-xs truncate">
                          {val !== null ? String(val) : <span className="text-slate-400 italic">NULL</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">ไม่มีข้อมูลในตารางนี้ (หรือยังไม่ได้กด "แสดงข้อมูล")</div>
          )}
        </div>
      )}
    </div>
  );
}