import { useState, useEffect } from 'react';
import api from '../../api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', review_type: 'exempt' });
  
  // State สำหรับ Modal จัดการเอกสาร
  const [selectedProject, setSelectedProject] = useState(null); 
  const [uploadingDoc, setUploadingDoc] = useState(null); 
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  // ✅ State สำหรับ Modal ยื่นคำร้อง (ต่ออายุ, แก้ไข, ปิดโครงการ)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('renewal'); // renewal, amendment, closure
  const [requestProject, setRequestProject] = useState(null);

  // รายการเอกสารทั้ง 10 ประเภท
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
      await api.post('/projects/', formData);
      alert('สร้างโครงการสำเร็จ! กรุณาแนบเอกสาร');
      setFormData({ title: '', review_type: 'exempt' });
      fetchProjects();
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedProject || !uploadingDoc) return;
    const uploadData = new FormData();
    uploadData.append('file', file);
    try {
      await api.post(`/projects/${selectedProject.id}/upload/${uploadingDoc}`, uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('อัปโหลดสำเร็จ!');
      setFile(null); setUploadingDoc(null);
      const updatedRes = await api.get('/projects/');
      setProjects(updatedRes.data);
      setSelectedProject(updatedRes.data.find(p => p.id === selectedProject.id));
    } catch (err) { alert('อัปโหลดล้มเหลว'); }
  };

  const handleViewPdf = async (projectId, docKey) => {
    try {
      const res = await api.get(`/projects/${projectId}/document/${docKey}`, { responseType: 'blob' });
      setPdfUrl(URL.createObjectURL(res.data));
    } catch (err) { alert('ไม่พบไฟล์'); }
  };

  const handleDownloadCertificate = async (projectId) => {
    try {
      const res = await api.get(`/admin/projects/${projectId}/certificate`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert('ไม่สามารถออกใบรับรองได้'); }
  };

  // ✅ ฟังก์ชันยื่นคำร้องใหม่ (ต่ออายุ, แก้ไข, ปิด)
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      // ส่งคำร้องไปที่ API ใหม่ (Backend จะเปลี่ยนสถานะเป็น needs_revision หรือ pending_docs)
      await api.post(`/projects/${requestProject.id}/request/${requestType}`);
      alert('ส่งคำร้องเรียบร้อย! กรุณาอัปโหลดเอกสารเพิ่มเติม');
      setShowRequestModal(false);
      setRequestProject(null);
      fetchProjects();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งคำร้อง');
    }
  };

  const isDocumentLocked = (status) => {
    return ['approved', 'forwarded', 'under_review'].includes(status);
  };

  if (loading) return <div className="text-center mt-10">กำลังโหลด...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">หน้าจอจัดการโครงการ</h1>

      {/* ฟอร์มสร้างโครงการใหม่ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">ยื่นขออนุมัติโครงการใหม่</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="ชื่อโครงการ" required className="border p-2 rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <select required className="border p-2 rounded-lg" value={formData.review_type} onChange={e => setFormData({...formData, review_type: e.target.value})}>
            <option value="exempt">แบบยกเว้น (Exempt)</option>
            <option value="expedited">แบบเร็ว (Expedited)</option>
            <option value="full_board">แบบ Full Board</option>
          </select>
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">สร้างโครงการ</button>
        </form>
      </div>

      {/* ตารางรายการโครงการ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold">เลข IRB</th>
              <th className="p-4 text-sm font-semibold">สถานะ</th>
              <th className="p-4 text-sm font-semibold">วันอนุมัติ</th>
              <th className="p-4 text-sm font-semibold">วันหมดอายุ</th>
              <th className="p-4 text-sm font-semibold">เอกสาร</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">{p.title}</td>
                <td className="p-4 text-sm">{p.irb_number || <span className="text-slate-400">รอ จนท. ระบุ</span>}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    p.status === 'needs_revision' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.status === 'approved' ? 'อนุมัติแล้ว' : p.status === 'needs_revision' ? 'ต้องแก้ไข' : p.status}
                  </span>
                </td>
                <td className="p-4 text-sm">{p.approval_date ? new Date(p.approval_date).toLocaleDateString('th-TH') : '-'}</td>
                <td className="p-4 text-sm">{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('th-TH') : '-'}</td>
                <td className="p-4 text-sm space-x-2">
                  <button onClick={() => setSelectedProject(p)} className="text-blue-600 hover:underline font-medium">จัดการเอกสาร</button>
                  {p.status === 'approved' && (
                    <>
                      <button onClick={() => handleDownloadCertificate(p.id)} className="text-green-600 hover:underline font-medium">ใบรับรอง</button>
                      
                      {/* ✅ ปุ่มยื่นคำร้อง (ต่ออายุ, แก้ไข, ปิด) */}
                      <div className="mt-2 flex gap-1">
                        <button onClick={() => { setRequestProject(p); setRequestType('renewal'); setShowRequestModal(true); }} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">ต่ออายุ</button>
                        <button onClick={() => { setRequestProject(p); setRequestType('amendment'); setShowRequestModal(true); }} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">ขอแก้ไข</button>
                        <button onClick={() => { setRequestProject(p); setRequestType('closure'); setShowRequestModal(true); }} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">ปิดโครงการ</button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal ยื่นคำร้อง */}
      {showRequestModal && requestProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">ยื่นคำร้อง</h3>
            <p className="text-sm text-slate-600 mb-4">
              โครงการ: <strong>{requestProject.title}</strong> <br/>
              ประเภทคำร้อง: 
              <span className="font-bold text-blue-600 ml-1">
                {requestType === 'renewal' ? 'ขอต่ออายุโครงการ' : requestType === 'amendment' ? 'ขอแก้ไขโครงการ' : 'แจ้งปิดโครงการ'}
              </span>
            </p>
            <form onSubmit={handleSubmitRequest}>
              <div className="mb-4 text-sm text-slate-500 bg-blue-50 p-3 rounded-lg">
                เมื่อยืนยันแล้ว สถานะโครงการจะเปลี่ยนเป็น <strong>"ต้องแก้ไข"</strong> เพื่อให้คุณสามารถอัปโหลดเอกสารใหม่ได้
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">ยืนยันการยื่นคำร้อง</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal จัดการเอกสาร */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">จัดการเอกสารโครงการ</h3>
                <p className="text-sm text-slate-500">{selectedProject.title}</p>
                {selectedProject.approval_date && (
                  <p className="text-xs text-green-600 mt-1">
                    อนุมัติเมื่อ: {new Date(selectedProject.approval_date).toLocaleDateString('th-TH')} | 
                    หมดอายุ: {new Date(selectedProject.expiry_date).toLocaleDateString('th-TH')}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-red-500 hover:text-red-700 font-bold text-2xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {docTypes.map((doc) => {
                const isRenewalOrClosure = doc.key === 'doc_renewal_form' || doc.key === 'doc_closure_form';
                if (isRenewalOrClosure && selectedProject.status !== 'approved') return null;
                
                const isUploaded = selectedProject[doc.key];
                const locked = isDocumentLocked(selectedProject.status);

                return (
                  <div key={doc.key} className={`flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg ${locked ? 'bg-slate-100' : 'hover:bg-slate-50'} transition`}>
                    <span className={`text-sm font-medium ${locked ? 'text-slate-500' : 'text-slate-700'} mb-2 md:mb-0 md:pr-4`}>
                      {doc.label}
                      {locked && <span className="ml-2 text-xs text-red-500">🔒 ล็อก</span>}
                    </span>
                    <div className="flex space-x-2 shrink-0">
                      {isUploaded ? (
                        <>
                          <button onClick={() => handleViewPdf(selectedProject.id, doc.key)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">ดูไฟล์ PDF</button>
                          {!locked && (
                            <button onClick={() => setUploadingDoc(doc.key)} className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-300">เปลี่ยนไฟล์</button>
                          )}
                        </>
                      ) : (
                        <>
                          {!locked ? (
                            <button onClick={() => setUploadingDoc(doc.key)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">อัปโหลด</button>
                          ) : (
                            <span className="text-xs text-red-500">ไม่สามารถอัปโหลดได้</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t bg-slate-50 text-right">
              <button onClick={() => setSelectedProject(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">เสร็จสิ้น</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal อัปโหลดไฟล์ */}
      {uploadingDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">อัปโหลดเอกสาร</h3>
            <p className="text-sm text-slate-600 mb-4">{docTypes.find(d => d.key === uploadingDoc)?.label}</p>
            <form onSubmit={handleUpload}>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="w-full mb-4" required />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setUploadingDoc(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">ยืนยันอัปโหลด</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แสดง PDF */}
      {pdfUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70]">
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