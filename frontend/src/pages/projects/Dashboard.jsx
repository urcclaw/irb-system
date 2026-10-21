import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../store/auth';

export default function Dashboard() {
  const { isPI } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', irb_number: '', approval_date: '', expiry_date: '' });
  const [file, setFile] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, approval_date: new Date(formData.approval_date).toISOString(), expiry_date: new Date(formData.expiry_date).toISOString() };
      await api.post('/projects/', payload);
      alert('สร้างโครงการสำเร็จ!');
      setFormData({ title: '', irb_number: '', approval_date: '', expiry_date: '' });
      fetchProjects();
    } catch (err) { alert(err.response?.data?.detail || 'เกิดข้อผิดพลาด'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedProject) return;
    const uploadData = new FormData();
    uploadData.append('file', file);
    try {
      await api.post(`/projects/${selectedProject}/upload`, uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('อัปโหลดเอกสารสำเร็จ!');
      setFile(null); setSelectedProject(null); fetchProjects();
    } catch (err) { alert(err.response?.data?.detail || 'อัปโหลดล้มเหลว'); }
  };

  const handleViewPdf = async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/document`, { responseType: 'blob' });
      const fileUrl = URL.createObjectURL(response.data);
      setPdfUrl(fileUrl);
    } catch (err) { alert('ไม่สามารถเปิดไฟล์ได้'); }
  };

  const closePdfModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  if (loading) return <div className="text-center mt-10">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">หน้าจอจัดการโครงการ</h1>
      </div>

      {isPI && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-700">ยื่นขออนุมัติโครงการใหม่</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="ชื่อโครงการ" required className="border p-2 rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="text" placeholder="เลขที่ IRB" required className="border p-2 rounded-lg" value={formData.irb_number} onChange={e => setFormData({...formData, irb_number: e.target.value})} />
            <div><label className="text-xs text-slate-500 block mb-1">วันอนุมัติ</label><input type="date" required className="border p-2 rounded-lg w-full" value={formData.approval_date} onChange={e => setFormData({...formData, approval_date: e.target.value})} /></div>
            <div><label className="text-xs text-slate-500 block mb-1">วันหมดอายุ</label><input type="date" required className="border p-2 rounded-lg w-full" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} /></div>
            <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">สร้างโครงการ</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">เลข IRB</th>
              <th className="p-4 text-sm font-semibold text-slate-600">สถานะ</th>
              <th className="p-4 text-sm font-semibold text-slate-600">เอกสาร</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">{p.title}</td>
                <td className="p-4 text-sm">{p.irb_number}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  {p.document_path ? (
                    <div className="flex space-x-3">
                      <button onClick={() => handleViewPdf(p.id)} className="text-green-600 hover:underline font-medium">ดูเอกสาร</button>
                      <button onClick={() => setSelectedProject(p.id)} className="text-slate-400 hover:text-slate-600 text-xs">เปลี่ยนไฟล์</button>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedProject(p.id)} className="text-blue-600 hover:underline">แนบไฟล์ PDF</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">แนบเอกสารอนุมัติ (PDF)</h3>
            <form onSubmit={handleUpload}>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="w-full mb-4" required />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setSelectedProject(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">อัปโหลด</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">เอกสารโครงการ</h3>
              <button onClick={closePdfModal} className="text-red-500 hover:text-red-700 font-bold text-xl">✕</button>
            </div>
            <div className="flex-1 bg-slate-200">
              <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
                <p className="text-center mt-10">เบราว์เซอร์ไม่รองรับการแสดง PDF <a href={pdfUrl} download className="text-blue-600 underline">คลิกเพื่อดาวน์โหลด</a></p>
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}