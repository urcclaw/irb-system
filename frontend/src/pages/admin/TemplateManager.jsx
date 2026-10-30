import { useState, useEffect } from 'react';
import api from '../../api';

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  
  const [settings, setSettings] = useState({
    president_name: '',
    hospital_name: '',
    committee_name: ''
  });

  const [formData, setFormData] = useState({
    template_name: '',
    html_layout: '<div class="text-center">\n  <h1>{{title}}</h1>\n</div>\n<p>เรียน {{to}}</p>\n<p class="indent">{{content}}</p>\n<div class="text-right">\n  <p>ลงชื่อ ......................</p>\n  <p>({{signer}})</p>\n</div>',
    fields_json: '[\n  {"key": "title", "label": "หัวข้อเรื่อง"},\n  {"key": "to", "label": "เรียน"},\n  {"key": "content", "label": "เนื้อหา"},\n  {"key": "signer", "label": "ชื่อผู้ลงนาม"}\n]'
  });

  useEffect(() => { 
    fetchTemplates(); 
    fetchSettings();
  }, []);

  const fetchTemplates = async () => {
    const res = await api.get('/admin/templates');
    setTemplates(res.data);
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings({
        president_name: res.data.president_name || 'นางสาวมาณิดา พิทักษ์',
        hospital_name: res.data.hospital_name || 'โรงพยาบาลมะเร็งลพบุรี',
        committee_name: res.data.committee_name || 'คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์'
      });
    } catch (err) { console.error(err); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      for (const [key, value] of Object.entries(settings)) {
        await api.post('/admin/settings', { key, value });
      }
      alert('บันทึกการตั้งค่าสำเร็จ!');
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
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
        <h1 className="text-2xl font-bold text-slate-800">จัดการระบบ</h1>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('templates')} 
          className={`px-6 py-3 font-medium ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          จัดการแม่แบบหนังสือ
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`px-6 py-3 font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          ตั้งค่าหน่วยงาน
        </button>
      </div>

      {activeTab === 'templates' && (
        <div>
          <div className="flex justify-end mb-4">
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
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
          <h2 className="text-lg font-bold mb-4">ตั้งค่าข้อมูลหน่วยงาน (ใช้ในใบรับรอง/หนังสือ)</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อประธานกรรมการฯ</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded-lg" 
                value={settings.president_name} 
                onChange={e => setSettings({...settings, president_name: e.target.value})} 
                placeholder="เช่น นางสาวมาณิดา พิทักษ์" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อคณะกรรมการฯ</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded-lg" 
                value={settings.committee_name} 
                onChange={e => setSettings({...settings, committee_name: e.target.value})} 
                placeholder="เช่น คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อหน่วยงาน/โรงพยาบาล</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded-lg" 
                value={settings.hospital_name} 
                onChange={e => setSettings({...settings, hospital_name: e.target.value})} 
                placeholder="เช่น โรงพยาบาลมะเร็งลพบุรี" 
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">บันทึกการตั้งค่า</button>
            </div>
          </form>
        </div>
      )}

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