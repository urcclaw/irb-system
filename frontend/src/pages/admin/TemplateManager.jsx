import { useState, useEffect } from 'react';
import api from '../../api';

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    template_name: '',
    html_layout: `<div style="text-align: center; margin-bottom: 20px;">
    <h2 style="margin: 0;">คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัย</h2>
    <h3 style="margin: 5px 0;">โรงพยาบาลมะเร็งลพบุรี</h3>
</div>
<table style="width: 100%; margin-bottom: 20px;">
    <tr>
        <td style="width: 70%;">ที่ {{doc_number}}</td>
        <td style="width: 30%; text-align: right;">วันที่ {{doc_date}}</td>
    </tr>
</table>
<p><strong>เรื่อง</strong> {{subject}}</p>
<p><strong>เรียน</strong> {{to}}</p>
<p style="text-indent: 50px; text-align: justify;">{{content}}</p>
<p style="text-indent: 50px; text-align: justify;">จึงเรียนมาเพื่อโปรดพิจารณา</p>
<table style="width: 100%; margin-top: 50px;">
    <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%; text-align: center;">
            <p>ลงชื่อ ...................................................</p>
            <p>({{signer}})</p>
            <p>ประธานคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัย</p>
        </td>
    </tr>
</table>`,
    fields_json: `[
  {"key": "doc_number", "label": "เลขที่หนังสือ"},
  {"key": "doc_date", "label": "วันที่"},
  {"key": "subject", "label": "เรื่อง"},
  {"key": "to", "label": "เรียน"},
  {"key": "content", "label": "เนื้อหา"},
  {"key": "signer", "label": "ชื่อผู้ลงนาม"}
]`
  });

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    const res = await api.get('/admin/templates');
    setTemplates(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/templates', formData);
      alert('สร้าง Template สำเร็จ!');
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      alert('เกิดข้อผิดพลาด (ต้องเป็น Admin เท่านั้น)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">จัดการแม่แบบหนังสือ (Template Builder)</h1>
        <button onClick={() => setShowModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">+ สร้าง Template ใหม่</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800">{tpl.template_name}</h3>
            <p className="text-sm text-slate-500 mt-1">สร้างเมื่อ: {new Date(tpl.created_at).toLocaleDateString('th-TH')}</p>
            <div className="mt-4 border-t pt-2">
              <p className="text-xs text-slate-400">Fields: {JSON.parse(tpl.fields_json).length} ช่อง</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-4xl w-full my-8">
            <h3 className="text-xl font-bold mb-4">สร้าง Template ใหม่</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อประเภทหนังสือ</label>
                <input type="text" required className="w-full border p-2 rounded-lg" value={formData.template_name} onChange={e => setFormData({...formData, template_name: e.target.value})} placeholder="เช่น หนังสือขอความอนุเคราะห์" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">HTML Layout (ใช้ {'{{key}}'} สำหรับตัวแปร)</label>
                  <textarea required rows="12" className="w-full border p-2 rounded-lg font-mono text-sm" value={formData.html_layout} onChange={e => setFormData({...formData, html_layout: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fields (JSON Array)</label>
                  <textarea required rows="12" className="w-full border p-2 rounded-lg font-mono text-sm" value={formData.fields_json} onChange={e => setFormData({...formData, fields_json: e.target.value})}></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">บันทึก Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}