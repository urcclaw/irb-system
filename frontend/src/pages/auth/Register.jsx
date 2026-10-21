import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', username: '', email: '', phone_number: '', password: '', confirm_password: '', role: 'pi'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirm_password) return setError('รหัสผ่านไม่ตรงกัน');
    setIsLoading(true);

    try {
      await axios.post('/api/auth/', formData);
      alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10 px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">ลงทะเบียน</h2>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}
        
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="block text-slate-700 text-sm font-medium mb-1.5">ชื่อจริง</label><input type="text" name="first_name" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-slate-700 text-sm font-medium mb-1.5">นามสกุล</label><input type="text" name="last_name" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-slate-700 text-sm font-medium mb-1.5">ชื่อผู้ใช้</label><input type="text" name="username" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-slate-700 text-sm font-medium mb-1.5">อีเมล</label><input type="email" name="email" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          
          <div className="md:col-span-2">
            <label className="block text-slate-700 text-sm font-medium mb-1.5">สมัครในฐานะ</label>
            <select name="role" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="pi">ผู้วิจัยหลัก (PI)</option>
              <option value="assistant">ผู้ช่วยนักวิจัย (Assistant)</option>
            </select>
          </div>

          <div className="md:col-span-2"><label className="block text-slate-700 text-sm font-medium mb-1.5">เบอร์โทรศัพท์</label><input type="tel" name="phone_number" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-slate-700 text-sm font-medium mb-1.5">รหัสผ่าน</label><input type="password" name="password" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-slate-700 text-sm font-medium mb-1.5">ยืนยันรหัสผ่าน</label><input type="password" name="confirm_password" onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          
          <div className="md:col-span-2 mt-4">
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              {isLoading ? 'กำลังลงทะเบียน...' : 'สร้างบัญชี'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}