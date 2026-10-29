import { useState, useEffect } from 'react';
import api from '../../api';
import Datepicker from "react-tailwindcss-datepicker";

export default function IRBDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [summary, setSummary] = useState('');
  const [finalDecision, setFinalDecision] = useState('needs_revision');

  // State สำหรับ Modal สร้างหนังสือ
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState({ startDate: null, endDate: null });
  const [docDate, setDocDate] = useState({ startDate: null, endDate: null });
  const [meetingData, setMeetingData] = useState({
    doc_type: 'internal', 
    doc_number: 'สธ 0315.2(40.1)/', 
    time_start: '09:00', 
    time_end: '16:00',
    location: 'ห้องประชุมสิทธิก ร บุญฉิม', 
    agenda: '1. เรื่องแจ้งเพื่อทราบ\n2. เรื่องพิจารณาโครงการวิจัย'
  });

  // State สำหรับ Template Builder
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({});
  const [templateFields, setTemplateFields] = useState([]);

  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      options.push(`${hour}:00`, `${hour}:30`);
    }
    return options;
  };
  const timeOptions = generateTimeOptions();

  useEffect(() => { 
    fetchAllProjects(); 
    fetchTemplates();
  }, []);

  const fetchAllProjects = async () => {
    try {
      const res = await api.get('/admin/projects');
      setProjects(res.data);
    } catch (err) { console.error("Error fetching projects:", err); }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/templates');
      setTemplates(res.data);
    } catch (err) { console.error("Error fetching templates:", err); }
  };

  const openSummaryModal = (project) => {
    setSelectedProject(project);
    setSummary(project.secretary_summary || '');
    setFinalDecision(project.status === 'approved' ? 'approved' : 'needs_revision');
  };

  const handleSaveSummary = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/projects/${selectedProject.id}/summary`, {
        summary: summary,
        final_decision: finalDecision
      });
      alert('บันทึกข้อสรุปของเลขาเรียบร้อย');
      setSelectedProject(null);
      fetchAllProjects();
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleGenerateMeetingDoc = async (e) => {
    e.preventDefault();
    let formattedMeetingDate = '';
    if (meetingDate.startDate) {
      const dateObj = new Date(meetingDate.startDate);
      formattedMeetingDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    } else { alert('กรุณาเลือกวันที่ประชุม'); return; }

    let formattedDocDate = '';
    if (docDate.startDate) {
      const dateObj = new Date(docDate.startDate);
      formattedDocDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    } else { alert('กรุณาเลือกวันที่ออกหนังสือ'); return; }

    const payload = { ...meetingData, meeting_date: formattedMeetingDate, doc_date: formattedDocDate };

    try {
      const res = await api.post('/admin/generate-meeting-invitation', payload, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meeting_invitation_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowMeetingModal(false);
    } catch (err) { alert('เกิดข้อผิดพลาดในการสร้างหนังสือ'); }
  };

  // ฟังก์ชัน通用 สำหรับดาวน์โหลด Report
  const downloadReport = async (endpoint, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert('เกิดข้อผิดพลาดในการสร้างรายงาน'); }
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setTemplateFields(JSON.parse(tpl.fields_json));
    setTemplateFormData({});
  };

  const handleGenerateFromTemplate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/admin/templates/${selectedTemplate.id}/generate`, templateFormData, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowTemplateModal(false);
      setSelectedTemplate(null);
    } catch (err) { alert('เกิดข้อผิดพลาดในการสร้างเอกสาร'); }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* ✅ Sidebar (เมนูด้านซ้าย) */}
      <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit sticky top-24">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">เมนูหลัก</h2>
        <nav className="space-y-1">
          <button className="w-full text-left px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium flex items-center gap-3">
            <span>📁</span> จัดการโครงการ
          </button>
          <button onClick={() => setShowMeetingModal(true)} className="w-full text-left px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg font-medium flex items-center gap-3 transition">
            <span>📝</span> สร้างหนังสือเชิญประชุม
          </button>
        </nav>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-4 px-2">ออกรายงาน</h2>
        <nav className="space-y-1">
          <button onClick={() => downloadReport('/admin/reports/project-status', 'project_status')} className="w-full text-left px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg font-medium flex items-center gap-3 transition">
            <span>📊</span> สถานะโครงการ
          </button>
          <button onClick={() => downloadReport('/admin/reports/expiring-projects', 'expiring_projects')} className="w-full text-left px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-red-600 rounded-lg font-medium flex items-center gap-3 transition">
            <span>⚠️</span> โครงการใกล้หมดอายุ
          </button>
          <button onClick={() => downloadReport('/admin/reports/meeting-agenda', 'meeting_agenda')} className="w-full text-left px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg font-medium flex items-center gap-3 transition">
            <span>📋</span> วาระการประชุม
          </button>
        </nav>
      </aside>

      {/* ✅ Main Content (เนื้อหาด้านขวา) */}
      <main className="flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ภาพรวมโครงการวิจัย</h1>
            <p className="text-slate-500 text-sm mt-1">จัดการและติดตามสถานะโครงการทั้งหมดในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplateModal(true)} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium shadow-sm flex items-center gap-2 transition">
              📄 สร้างจาก Template
            </button>
            <button onClick={() => setShowMeetingModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2 transition">
              <span>+</span> สร้างหนังสือ
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <h3 className="text-slate-500 text-sm font-medium">โครงการทั้งหมด</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
            <h3 className="text-slate-500 text-sm font-medium">อนุมัติแล้ว</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{projects.filter(p => p.status === 'approved').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-yellow-500">
            <h3 className="text-slate-500 text-sm font-medium">รอดำเนินการ</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{projects.filter(p => p.status !== 'approved').length}</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">รายการโครงการล่าสุด</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-600">ชื่อโครงการ</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">สถานะ</th>
                  <th className="p-4 text-sm font-semibold text-slate-600 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-4 text-sm text-slate-800 font-medium">{p.title}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        p.status === 'forwarded' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <button onClick={() => openSummaryModal(p)} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">รวบรวมความเห็น/สรุปผล</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal สรุปผลของเลขา */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
             <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="text-lg font-bold">รวบรวมความเห็นคณะกรรมการ</h3>
              <button onClick={() => setSelectedProject(null)} className="text-red-500 text-xl font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2">ความเห็นจากกรรมการ:</h4>
                {selectedProject.reviews && selectedProject.reviews.length > 0 ? (
                  <ul className="space-y-3">
                    {selectedProject.reviews.map((r, i) => (
                      <li key={i} className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-blue-500">
                        <div className="font-bold">{r.reviewer_name}</div>
                        <div className="text-xs font-bold text-blue-600 uppercase mt-1">{r.decision}</div>
                        <p className="mt-1 text-slate-700">{r.comments || "ไม่ได้ระบุเหตุผล"}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-blue-600 italic">ยังไม่มีกรรมการให้ความเห็น</p>}
              </div>
              <form onSubmit={handleSaveSummary} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ข้อสรุปของเลขานุการ</label>
                  <textarea required rows="5" className="w-full border p-2 rounded-lg" value={summary} onChange={e => setSummary(e.target.value)}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ผลการตัดสินใจขั้นสุดท้าย</label>
                  <select value={finalDecision} onChange={e => setFinalDecision(e.target.value)} className="w-full border p-2 rounded-lg">
                    <option value="approved">อนุมัติ (Approved)</option>
                    <option value="needs_revision">ให้แก้ไข (Needs Revision)</option>
                    <option value="disapproved">ไม่อนุมัติ (Disapproved)</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setSelectedProject(null)} className="px-4 py-2 border rounded-lg">ยกเลิก</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">บันทึกข้อสรุป</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal สร้างหนังสือ (Manual) */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-6">สร้างหนังสือ</h3>
            <form onSubmit={handleGenerateMeetingDoc} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทหนังสือ</label>
                <select className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={meetingData.doc_type} onChange={e => setMeetingData({...meetingData, doc_type: e.target.value})}>
                  <option value="internal">บันทึกข้อความ (ภายใน)</option>
                  <option value="external">หนังสือภายนอก (ขอเชิญประชุม)</option>
                </select>
              </div>
              {meetingData.doc_type === 'internal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">เลขที่หนังสือ</label>
                    <input type="text" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={meetingData.doc_number} onChange={e => setMeetingData({...meetingData, doc_number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ออกหนังสือ</label>
                    <Datepicker value={docDate} onChange={newValue => setDocDate(newValue)} displayFormat="DD/MM/YYYY" useRange={false} asSingle={true} placeholder="เลือกวันที่" containerClassName="relative w-full" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ประชุม</label>
                  <Datepicker value={meetingDate} onChange={newValue => setMeetingDate(newValue)} displayFormat="DD/MM/YYYY" useRange={false} asSingle={true} placeholder="เลือกวันที่ประชุม" containerClassName="relative w-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">เวลาจาก</label>
                    <select className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={meetingData.time_start} onChange={e => setMeetingData({...meetingData, time_start: e.target.value})}>
                      {timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ถึง</label>
                    <select className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={meetingData.time_end} onChange={e => setMeetingData({...meetingData, time_end: e.target.value})}>
                      {timeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สถานที่</label>
                <input type="text" required className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={meetingData.location} onChange={e => setMeetingData({...meetingData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">วาระการประชุม (ถ้ามี)</label>
                <textarea rows="4" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={meetingData.agenda} onChange={e => setMeetingData({...meetingData, agenda: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowMeetingModal(false)} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">ยกเลิก</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition">ดาวน์โหลดหนังสือ (PDF)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal สร้างจาก Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {!selectedTemplate ? (
              <>
                <h3 className="text-xl font-bold mb-4">เลือกแม่แบบหนังสือ</h3>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map(tpl => (
                    <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)} className="text-left p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition">
                      <h4 className="font-bold text-slate-800">{tpl.template_name}</h4>
                      <p className="text-sm text-slate-500 mt-1">มี {JSON.parse(tpl.fields_json).length} ช่องให้กรอก</p>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 border rounded-lg">ปิด</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">กรอกข้อมูล: {selectedTemplate.template_name}</h3>
                  <button onClick={() => setSelectedTemplate(null)} className="text-sm text-blue-600 hover:underline">← เปลี่ยน Template</button>
                </div>
                <form onSubmit={handleGenerateFromTemplate} className="space-y-4">
                  {templateFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      {field.key.includes('content') || field.key.includes('detail') ? (
                        <textarea required rows="4" className="w-full border p-2 rounded-lg" onChange={e => setTemplateFormData({...templateFormData, [field.key]: e.target.value})}></textarea>
                      ) : (
                        <input type="text" required className="w-full border p-2 rounded-lg" onChange={e => setTemplateFormData({...templateFormData, [field.key]: e.target.value})} />
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={() => setShowTemplateModal(false)} className="px-4 py-2 border rounded-lg">ยกเลิก</button>
                    <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">ดาวน์โหลด PDF</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}