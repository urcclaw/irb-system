import { useState, useEffect } from 'react';
import api from '../../api';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    president_name: '',
    hospital_name: '',
    committee_name: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings({
        president_name: res.data.president_name || 'นางสาวมาณิดา พิทักษ์',
        hospital_name: res.data.hospital_name || 'โรงพยาบาลมะเร็งลพบุรี',
        committee_name: res.data.committee_name || 'คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์'
      });
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      for (const [key, value] of Object.entries(settings)) {
        await api.post('/admin/settings', { key, value });
      }
      alert('บันทึกการตั้งค่าสำเร็จ!');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  if (loading) return <div className="text-center mt-10">กำลังโหลด...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าหน่วยงาน</h1>
        <p className="text-slate-500 text-sm mt-1">ข้อมูลนี้จะถูกนำไปใช้ในใบรับรองและหนังสือราชการ</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อประธานกรรมการฯ</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              value={settings.president_name} 
              onChange={e => setSettings({...settings, president_name: e.target.value})} 
              placeholder="เช่น นางสาวมาณิดา พิทักษ์" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อคณะกรรมการฯ</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              value={settings.committee_name} 
              onChange={e => setSettings({...settings, committee_name: e.target.value})} 
              placeholder="เช่น คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อหน่วยงาน/โรงพยาบาล</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              value={settings.hospital_name} 
              onChange={e => setSettings({...settings, hospital_name: e.target.value})} 
              placeholder="เช่น โรงพยาบาลมะเร็งลพบุรี" 
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition">
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}