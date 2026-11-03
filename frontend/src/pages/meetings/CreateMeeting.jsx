import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  
  // ✅ แยก state เป็นวันที่และเวลา (เริ่ม + สิ้นสุด)
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');  // ✅ เพิ่ม
  
  const [form, setForm] = useState({
    meeting_type: 'Full Board',
    location_id: '',
    custom_location: '',
    quorum_required: 5
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await api.get('/locations/');
      setLocations(res.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ รวมวันที่ + เวลาเริ่ม และ เวลาสิ้นสุด
    const meetingDateTime = `${meetingDate}T${startTime}:00`;
    const endDateTime = `${meetingDate}T${endTime}:00`;
    
    // เลือกสถานที่
    const finalLocation = form.location_id 
      ? locations.find(l => l.id === parseInt(form.location_id))?.name 
      : form.custom_location;

    setSaving(true);
    try {
      const res = await api.post('/meetings/', {
        meeting_date: meetingDateTime,
        end_time: endDateTime,  // ✅ เพิ่ม
        meeting_type: form.meeting_type,
        location: finalLocation,
        quorum_required: form.quorum_required
      });
      navigate(`/meetings/${res.data.id}`);
    } catch (error) {
      alert(error.response?.data?.detail || 'สร้างนัดประชุมไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">📅 สร้างนัดประชุมใหม่</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* ✅ แยกเป็น 3 ฟิลด์: วันที่, เวลาเริ่ม, เวลาสิ้นสุด */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ *</label>
            <input
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด *</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการประชุม *</label>
          <select
            value={form.meeting_type}
            onChange={(e) => setForm({ ...form, meeting_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Full Board">Full Board (ประชุมเต็มคณะ)</option>
            <option value="Expedited">Expedited (ประชุมเร่งด่วน)</option>
            <option value="Subcommittee">Subcommittee (คณะอนุกรรมการ)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ *</label>
          <select
            value={form.location_id}
            onChange={(e) => setForm({ ...form, location_id: e.target.value, custom_location: '' })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- เลือกสถานที่ --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.capacity ? `(ความจุ ${loc.capacity} คน)` : ''}
              </option>
            ))}
            <option value="__custom__">✏️ กรอกสถานที่เอง...</option>
          </select>
          
          {form.location_id === '__custom__' && (
            <input
              type="text"
              value={form.custom_location}
              onChange={(e) => setForm({ ...form, custom_location: e.target.value })}
              placeholder="เช่น ห้องประชุมชั้น 3, ประชุมออนไลน์ผ่าน Zoom"
              className="w-full px-3 py-2 border rounded-lg mt-2 focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน Quorum ขั้นต่ำ *</label>
          <input
            type="number"
            required
            min="1"
            value={form.quorum_required}
            onChange={(e) => setForm({ ...form, quorum_required: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">จำนวนกรรมการขั้นต่ำที่ต้องเข้าร่วมเพื่อให้องค์ประชุมครบ</p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/meetings')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {saving ? 'กำลังสร้าง...' : '✓ สร้างนัดประชุม'}
          </button>
        </div>
      </form>
    </div>
  );
}