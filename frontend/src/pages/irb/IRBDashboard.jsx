import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../store/auth';

export default function IRBDashboard() {
  const { role } = useAuth(); // ดึง Role ของคนที่ล็อกอินอยู่
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllProjects(); }, []);

  const fetchAllProjects = async () => {
    try {
      const res = await api.get('/admin/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('ยืนยันการอนุมัติโครงการนี้?')) return;
    try {
      await api.put(`/admin/projects/${id}/approve`);
      alert('อนุมัติสำเร็จ!');
      fetchAllProjects();
    } catch (err) { 
      // แสดง Error ที่ส่งกลับมาจาก Backend (เช่น ห้ามอนุมัติตัวเอง)
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาด'); 
    }
  };

  if (loading) return <div className="text-center mt-10">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">หน้าจอเจ้าหน้าที่ IRB</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">เลข IRB</th>
              <th className="p-4 text-sm font-semibold text-slate-600">ผู้วิจัย</th>
              <th className="p-4 text-sm font-semibold text-slate-600">สถานะ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">{p.title}</td>
                <td className="p-4 text-sm">{p.irb_number}</td>
                <td className="p-4 text-sm">{p.owner_name}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  {p.status === 'pending' && (
                    <button 
                      onClick={() => handleApprove(p.id)} 
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      อนุมัติ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}