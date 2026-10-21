import { useState, useEffect } from 'react';
import api from '../../api';

export default function IRBDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({ irb_number: '', approval_date: '', expiry_date: '' });
  const [viewDocsProject, setViewDocsProject] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const docTypes = [
    { key: 'doc_proposal', label: '1. บันทึกข้อความ ข้อเสนอโครงการวิจัย' },
    { key: 'doc_submission_form', label: '2. แบบฟอร์มขอส่งคำร้องขอยื่นเสนอขอรับการพิจารณาจริยธรรม' },
    { key: 'doc_ethics_form', label: '3. แบบฟอร์มยื่นขอรับการพิจารณาจริยธรรม' },
    { key: 'doc_self_assessment', label: '4. แบบฟอร์มการประเมินตนเองโดยผู้วิจัย (Self-Assessment)' },
    { key: 'doc_consent_form', label: '5. แบบฟอร์มเอกสารแสดงความยินยอมเข้าร่วมในโครงการวิจัย' },
    { key: 'doc_info_sheet', label: '6. แบบฟอร์มเอกสารข้อมูลคำอธิบายสำหรับผู้รับการวิจัย' },
    { key: 'doc_coi_form', label: '7. แบบฟอร์มเปิดเผยการมีผลประโยชน์ทับซ้อนและทุนวิจัย' },
    { key: 'doc_researcher_cv', label: '8. แบบฟอร์มประวัติผู้วิจัย' },
    { key: 'doc_renewal_form', label: '9. แบบฟอร์มเอกสารต่ออายุโครงการวิจัย' },
    { key: 'doc_closure_form', label: '10. แบบฟอร์มแจ้งปิดโครงการวิจัย' },
  ];

  useEffect(() => { fetchAllProjects(); }, []);

  const fetchAllProjects = async () => {
    const res = await api.get('/admin/projects');
    setProjects(res.data);
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        irb_number: formData.irb_number,
        approval_date: new Date(formData.approval_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
      };
      await api.put(`/admin/projects/${selectedProject}/update`, payload);
      alert('อัปเดตข้อมูลสำเร็จ!');
      setSelectedProject(null);
      fetchAllProjects();
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleForward = async (id) => {
    if (!window.confirm('ยืนยันว่าตรวจสอบเอกสารครบถ้วน และต้องการส่งต่อให้กรรมการ?')) return;
    try {
      await api.put(`/admin/projects/${id}/forward`);
      alert('ส่งต่อเรียบร้อย!');
      fetchAllProjects();
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleViewPdf = async (projectId, docKey) => {
    try {
      const res = await api.get(`/admin/projects/${projectId}/document/${docKey}`, { responseType: 'blob' });
      setPdfUrl(URL.createObjectURL(res.data));
    } catch (err) { alert('ไม่พบไฟล์ หรือไฟล์ยังไม่ได้อัปโหลด'); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">หน้าจอเจ้าหน้าที่ IRB</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold">เลข IRB</th>
              <th className="p-4 text-sm font-semibold">สถานะ</th>
              <th className="p-4 text-sm font-semibold">เอกสาร</th>
              <th className="p-4 text-sm font-semibold">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">{p.title}</td>
                <td className="p-4 text-sm">{p.irb_number || <span className="text-red-500 italic">ยังไม่ระบุ</span>}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  <button onClick={() => setViewDocsProject(p)} className="text-blue-600 hover:underline font-medium">
                    ตรวจสอบเอกสาร ({Object.values(p.docs).filter(Boolean).length}/10)
                  </button>
                </td>
                <td className="p-4 text-sm space-x-2">
                  <button onClick={() => { setSelectedProject(p.id); setFormData({irb_number: p.irb_number || '', approval_date: '', expiry_date: ''}); }} className="text-indigo-600 hover:underline text-sm">กรอกข้อมูล จนท.</button>
                  {p.status === 'under_review' && (
                    <button onClick={() => handleForward(p.id)} className="text-green-600 hover:underline text-sm font-medium">ส่งต่อกรรมการ</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal กรอกข้อมูล จนท. */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">ข้อมูลสำหรับเจ้าหน้าที่</h3>
            <form onSubmit={handleUpdateInfo}>
              <label className="block text-sm mb-1">เลขที่ IRB</label>
              <input type="text" required className="w-full border p-2 rounded-lg mb-4" value={formData.irb_number} onChange={e => setFormData({...formData, irb_number: e.target.value})} />
              <label className="block text-sm mb-1">วันอนุมัติ</label>
              <input type="date" required className="w-full border p-2 rounded-lg mb-4" value={formData.approval_date} onChange={e => setFormData({...formData, approval_date: e.target.value})} />
              <label className="block text-sm mb-1">วันหมดอายุ</label>
              <input type="date" required className="w-full border p-2 rounded-lg mb-4" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setSelectedProject(null)} className="px-4 py-2 border rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ตรวจสอบเอกสาร */}
      {viewDocsProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">ตรวจสอบเอกสาร</h3>
                <p className="text-sm text-slate-500">{viewDocsProject.title}</p>
              </div>
              <button onClick={() => setViewDocsProject(null)} className="text-red-500 hover:text-red-700 font-bold text-2xl">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {docTypes.map((doc) => {
                // [สำคัญ] ซ่อนฟอร์ม 9 และ 10 ถ้าโครงการยังไม่ approved
                const isRenewalOrClosure = doc.key === 'doc_renewal_form' || doc.key === 'doc_closure_form';
                if (isRenewalOrClosure && viewDocsProject.status !== 'approved') return null;

                const isUploaded = viewDocsProject.docs[doc.key];
                return (
                  <div key={doc.key} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <span className="text-sm font-medium text-slate-700 mb-2 md:mb-0 md:pr-4">{doc.label}</span>
                    <div>
                      {isUploaded ? (
                        <button onClick={() => handleViewPdf(viewDocsProject.id, doc.key)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 font-medium">ดูไฟล์ PDF</button>
                      ) : (
                        <span className="bg-red-50 text-red-500 px-3 py-1 rounded text-sm border border-red-100">ยังไม่แนบ</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t bg-slate-50 text-right">
              <button onClick={() => setViewDocsProject(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แสดง PDF */}
      {pdfUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="text-lg font-bold">เอกสาร PDF</h3>
              <button onClick={() => setPdfUrl(null)} className="text-red-500 text-xl font-bold">✕</button>
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