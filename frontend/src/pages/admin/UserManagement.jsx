import { useState, useEffect } from 'react';
import api from '../../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('อัปเดต Role สำเร็จ');
      fetchUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`ยืนยันการลบผู้ใช้ ${username}?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาด');
    }
  };

  if (loading) return <div className="text-center mt-10">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">จัดการผู้ใช้งาน</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">ชื่อ-นามสกุล</th>
              <th className="p-4 text-sm font-semibold">Username</th>
              <th className="p-4 text-sm font-semibold">อีเมล</th>
              <th className="p-4 text-sm font-semibold">Role</th>
              <th className="p-4 text-sm font-semibold text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">{u.first_name} {u.last_name}</td>
                <td className="p-4 text-sm font-medium">{u.username}</td>
                <td className="p-4 text-sm">{u.email}</td>
                <td className="p-4 text-sm">
                  <select 
                    value={u.role} 
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="border p-1 rounded text-sm"
                  >
                    <option value="pi">ผู้วิจัย (PI)</option>
                    <option value="assistant">ผู้ช่วยวิจัย</option>
                    <option value="committee">กรรมการ</option>
                    <option value="irb_officer">เจ้าหน้าที่ IRB</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </td>
                <td className="p-4 text-sm text-right">
                  <button 
                    onClick={() => handleDelete(u.id, u.username)} 
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    ลบผู้ใช้
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}