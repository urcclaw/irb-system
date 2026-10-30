import { useState, useEffect } from 'react';
import api from '../../api';

export default function CommitteeDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [decision, setDecision] = useState('needs_revision');
  const [comments, setComments] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null); // ✅ เก็บ ID แทนชื่อ

  useEffect(() => { 
    fetchAllProjects(); 
    // ✅ ดึง ID จาก Token (payload.id)
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.id); 
    }
  }, []);

  const fetchAllProjects = async () => {
    try {
      const res = await api.get('/admin/projects');
      setProjects(res.data.filter(p => ['forwarded', 'needs_revision', 'approved'].includes(p.status)));
    } catch (err) { console.error(err); }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/projects/${selectedProject}/comment`, {
        decision: decision,
        comments: comments
      });
      alert('ส่งความเห็นส่วนตัวเรียบร้อยแล้ว');
      setSelectedProject(null);
      setComments('');
      fetchAllProjects(); // รีเฟรชข้อมูลเพื่ออัปเดตสถานะ
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  // ✅ ตรวจสอบด้วย ID (แม่นยำ 100%)
  const getMyReview = (project) => {
    return project.reviews?.find(r => r.reviewer_id === currentUserId);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">หน้าจอคณะกรรมการพิจารณาจริยธรรม</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold">ความเห็นของคุณ</th>
              <th className="p-4 text-sm font-semibold">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => {
              const myReview = getMyReview(p);
              return (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 text-sm">{p.title}</td>
                  <td className="p-4 text-sm">
                    {myReview ? (
                      <div className="flex flex-col">
                        <span className={`px-2 py-1 rounded text-xs font-bold w-fit ${
                          myReview.decision === 'approved' ? 'bg-green-100 text-green-700' : 
                          myReview.decision === 'needs_revision' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {myReview.decision === 'approved' ? 'เห็นชอบ' : 
                           myReview.decision === 'needs_revision' ? 'ให้แก้ไข' : 'ไม่เห็นชอบ'}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                          {myReview.comments || "ไม่ได้ระบุเหตุผล"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">ยังไม่ได้ให้ความเห็น</span>
                    )}
                  </td>
                  <td className="p-4 text-sm space-x-2">
                    <button 
                      onClick={() => { 
                        setSelectedProject(p.id); 
                        if(myReview) { 
                          setDecision(myReview.decision); 
                          setComments(myReview.comments || ''); 
                        } else {
                          setDecision('needs_revision');
                          setComments('');
                        }
                      }} 
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        myReview 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {myReview ? 'แก้ไข' : 'พิจารณา'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal พิจารณา */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">ส่งความเห็นการพิจารณา</h3>
            <form onSubmit={handleSubmitComment}>
              <label className="block text-sm font-medium mb-1">ผลการพิจารณา</label>
              <select value={decision} onChange={e => setDecision(e.target.value)} className="w-full border p-2 rounded-lg mb-4">
                <option value="approved">อนุมัติ (Approved)</option>
                <option value="needs_revision">ให้แก้ไข (Needs Revision)</option>
                <option value="disapproved">ไม่อนุมัติ (Disapproved)</option>
              </select>
              
              <label className="block text-sm font-medium mb-1">เหตุผล / ข้อเสนอแนะ</label>
              <textarea required rows="4" className="w-full border p-2 rounded-lg mb-4" value={comments} onChange={e => setComments(e.target.value)}></textarea>
              
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setSelectedProject(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">ส่งความเห็น</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}