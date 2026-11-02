import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ✅ เพิ่ม Import Link
import api from '../../api';

export default function CommitteeDashboard() {
  const [projects, setProjects] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => { 
    fetchAllProjects(); 
    
    // ✅ ดึง ID จาก Token (payload.id)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id); 
      } catch (e) {
        console.error("Invalid token", e);
      }
    }
  }, []);

  const fetchAllProjects = async () => {
    try {
      const res = await api.get('/admin/projects');
      // กรองเฉพาะสถานะที่รอการพิจารณาหรือแก้ไข
      setProjects(res.data.filter(p => ['forwarded', 'needs_revision', 'approved'].includes(p.status)));
    } catch (err) { 
      console.error("Error fetching projects:", err); 
    }
  };

  // ✅ ตรวจสอบความเห็นของ User คนปัจจุบันในโครงการนั้นๆ
  const getMyReview = (project) => {
    return project.reviews?.find(r => r.reviewer_id === currentUserId);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">หน้าจอคณะกรรมการพิจารณาจริยธรรม</h1>
        <span className="text-sm text-slate-500">แสดงโครงการที่รอการประเมินหรือมีการประเมินแล้ว</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-700">ชื่อโครงการ</th>
              <th className="p-4 text-sm font-semibold text-slate-700 w-1/3">ความเห็นของคุณ</th>
              <th className="p-4 text-sm font-semibold text-slate-700 w-48 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-500">ไม่พบโครงการที่ต้องพิจารณา</td>
              </tr>
            ) : (
              projects.map(p => {
                const myReview = getMyReview(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-800">{p.title}</div>
                      <div className="text-xs text-slate-500 mt-1">สถานะ: {p.status}</div>
                    </td>
                    <td className="p-4 text-sm">
                      {myReview ? (
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold w-fit ${
                            myReview.decision === 'approved' ? 'bg-green-100 text-green-700' : 
                            myReview.decision === 'needs_revision' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {myReview.decision === 'approved' ? 'เห็นชอบ' : 
                             myReview.decision === 'needs_revision' ? 'ให้แก้ไข' : 'ไม่เห็นชอบ'}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-xs" title={myReview.comments}>
                            {myReview.comments || "ไม่ได้ระบุเหตุผล"}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          ยังไม่ได้ประเมิน
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {/* ✅ เปลี่ยนจาก Button เป็น Link ไปยังหน้า AssessmentForm */}
                      <Link 
                        to={`/projects/${p.id}/assess`}
                        className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                          myReview 
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }`}
                      >
                        {myReview ? 'แก้ไขแบบประเมิน' : 'ประเมินโครงการ'}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ ลบ Modal เดิมออกทั้งหมด เพราะเราใช้หน้า AssessmentForm แทนแล้ว */}
    </div>
  );
}