import { useState, useEffect } from 'react';
import api from '../../api';

export default function IRBDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

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
    } catch (err) { alert(err.response?.data?.detail || 'เกิดข้อผิดพลาด'); }
  };

  const handleViewPdf = async (projectId) => {
    try {
      const response = await api.get(`/admin/projects/${projectId}/document`, { responseType: 'blob' });
      const fileUrl = URL.createObjectURL(response.data);
      setPdfUrl(fileUrl);
    } catch (err) { alert('ไม่สามารถเปิดไฟล์ได้ หรือไม่มีไฟล์เอกสาร'); }
  };

  const closePdfModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
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
              <th className="p-4 text-sm font-semibold text-slate-600">เอกสาร</th>
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
                  {p.document_path ? (
                    <button onClick={() => handleViewPdf(p.id)} className="text-blue-600 hover:underline">
                      ดูเอกสาร PDF
                    </button>
                  ) : (
                    <span className="text-slate-400">ไม่มีเอกสาร</span>
                  )}
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

      {pdfUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">ตรวจสอบเอกสารโครงการ</h3>
              <button onClick={closePdfModal} className="text-red-500 hover:text-red-700 font-bold text-xl">✕</button>
            </div>
            <div className="flex-1 bg-slate-200">
              <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-600">เบราว์เซอร์ของคุณไม่รองรับการแสดงผล PDF <br />
                  <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">คลิกที่นี่เพื่อดาวน์โหลด</a></p>
                </div>
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}