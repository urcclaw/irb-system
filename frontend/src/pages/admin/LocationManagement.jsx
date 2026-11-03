import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: '', description: '' });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await api.get('/locations/?active_only=false');
      setLocations(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/locations/${editId}`, form);
      } else {
        await api.post('/locations/', {
          ...form,
          capacity: form.capacity ? parseInt(form.capacity) : null
        });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', capacity: '', description: '' });
      loadLocations();
    } catch (error) {
      alert(error.response?.data?.detail || 'บันทึกไม่สำเร็จ');
    }
  };

  const handleEdit = (loc) => {
    setForm({
      name: loc.name,
      capacity: loc.capacity || '',
      description: loc.description || ''
    });
    setEditId(loc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการปิดใช้งานสถานที่นี้หรือไม่?')) return;
    try {
      await api.delete(`/locations/${id}`);
      loadLocations();
    } catch (error) {
      alert('ลบไม่สำเร็จ');
    }
  };

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🏢 จัดการสถานที่ประชุม</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', capacity: '', description: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + เพิ่มสถานที่ใหม่
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{editId ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อสถานที่ *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="เช่น ห้องประชุมชั้น 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ความจุ (คน)</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="เช่น 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">รายละเอียด</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                {editId ? '✓ บันทึกการแก้ไข' : '✓ เพิ่มสถานที่'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสถานที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ความจุ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{loc.name}</td>
                <td className="px-6 py-4">{loc.capacity ? `${loc.capacity} คน` : '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{loc.description || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    loc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {loc.is_active ? '✓ ใช้งาน' : '✗ ปิดใช้งาน'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleEdit(loc)}
                    className="text-blue-600 hover:underline text-sm mr-3"
                  >
                    แก้ไข
                  </button>
                  {loc.is_active && (
                    <button
                      onClick={() => handleDelete(loc.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      ปิดใช้งาน
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}