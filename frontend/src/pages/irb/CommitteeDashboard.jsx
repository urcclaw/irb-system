import { useState, useEffect } from 'react';
import api from '../../api';

export default function CommitteeDashboard() {
  const [projects, setProjects] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [decision, setDecision] = useState('approved');

  useEffect(() => { fetchAllProjects(); }, []);

  const fetchAllProjects = async () => {
    const res = await api.get('/admin/projects');
    setProjects(res.data.filter(p => p.status === 'forwarded'));
  };

  const handleViewPdf = async (projectId, docKey) => {
    try {
      const res = await api.get(`/admin/projects/${projectId}/document/${docKey}`, { responseType: 'blob' });
      setPdfUrl(URL.createObjectURL(res.data));
    } catch (err) { alert('ไม่พบไฟล์'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/projects/${selectedProject}/review`, {
        decision: decision,
        certificate_url: decision === 'approved' ? `uploads/certificate_${selectedProject}.pdf` : null
      });
      alert('บันทึกผลการพิจารณาเรียบร้อย');
      setSelectedProject(null);
      fetchAllProjects();
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">หน้าจอคณะกรรมการพิจารณาจริยธรรม</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold">ประเภท</th>
              <th className="p-4 text-sm font-semibold">ผู้วิจัย</th>
              <th className="p-4 text-sm font-semibold">เอกสาร</th>
              <th className="p-4 text-sm font-semibold">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">{p.title}</td>
                <td className="p-4 text-sm uppercase text-blue-600 font-bold">{p.review_type}</td>
                <td className="p-4 text-sm">{p.owner_name}</td>
                <td className="p-4 text-sm">
                  <div className="flex gap-1">
                    {Object.entries(p.docs).map(([key, uploaded]) => uploaded && (
                      <button key={key} onClick={() => handleViewPdf(p.id, key)} className="text-[10px] bg-slate-100 px-1 rounded hover:bg-slate-200">
                        ดู
                      </button>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-sm">
                  <button onClick={() => setSelectedProject(p.id)} className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">พิจารณา</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">ผลการพิจารณา</h3>
            <form onSubmit={handleReviewSubmit}>
              <select value={decision} onChange={e => setDecision(e.target.value)} className="w-full border p-2 rounded-lg mb-4">
                <option value="approved">อนุมัติ (Approved)</option>
                <option value="needs_revision">ให้แก้ไข (Needs Revision)</option>
                <option value="disapproved">ไม่อนุมัติ (Disapproved)</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setSelectedProject(null)} className="px-4 py-2 border rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">ยืนยันผล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="text-lg font-bold">เอกสารโครงการ</h3>
              <button onClick={() => setPdfUrl(null)} className="text-red-500 text-xl font-bold">✕</button>
            </div>
            <div className="flex-1 bg-slate-200">
              <object data={pdfUrl} type="application/pdf" width="100%" height="100%"></object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}