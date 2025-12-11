import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    user_type: 'kiosk',
    branch_id: null as number | null,
    is_active: true,
  });

  // Fetch users and branches
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, branchesData] = await Promise.all([
        apiService.getUsers(),
        apiService.getBranches(),
      ]);
      
      // Filter to show only active users
      const activeUsers = Array.isArray(usersData) ? usersData.filter((u: any) => u.is_active) : [];
      setUsers(activeUsers);
      setBranches(branchesData || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const result: any = await apiService.generatePassword();
      setFormData({ ...formData, password: result.password });
    } catch (err: any) {
      console.error('Failed to generate password:', err);
      alert('ไม่สามารถสร้างรหัสผ่านได้');
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.username || !formData.password) {
        alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
        return;
      }
      
      await apiService.createUser(formData);
      setShowCreateModal(false);
      setFormData({
        username: '',
        password: '',
        user_type: 'kiosk',
        branch_id: null,
        is_active: true,
      });
      fetchData();
      alert('สร้างผู้ใช้สำเร็จ');
    } catch (err: any) {
      console.error('Failed to create user:', err);
      alert(err.message || 'ไม่สามารถสร้างผู้ใช้ได้');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      user_type: user.user_type,
      branch_id: user.branch_id,
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (!editingUser) return;
      
      const updateData: any = {
        user_type: formData.user_type,
        branch_id: formData.branch_id,
        is_active: formData.is_active,
      };
      
      if (formData.username !== editingUser.username) {
        updateData.username = formData.username;
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await apiService.updateUser(editingUser.id, updateData);
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        user_type: 'kiosk',
        branch_id: null,
        is_active: true,
      });
      fetchData();
      alert('อัพเดทผู้ใช้สำเร็จ');
    } catch (err: any) {
      console.error('Failed to update user:', err);
      alert(err.message || 'ไม่สามารถอัพเดทผู้ใช้ได้');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการปิดการใช้งานผู้ใช้นี้?')) {
      return;
    }
    
    try {
      await apiService.deleteUser(id);
      fetchData();
      alert('ปิดการใช้งานผู้ใช้สำเร็จ');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      alert(err.message || 'ไม่สามารถปิดการใช้งานผู้ใช้ได้');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      user_type: 'kiosk',
      branch_id: null,
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-[fade-in_0.5s_ease-in-out] max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">จัดการผู้ใช้ (User Management)</h2>
          <p className="text-slate-500 mt-1">สร้าง แก้ไข และจัดการผู้ใช้ในระบบ</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">ชื่อผู้ใช้</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">ประเภท</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">สาขา</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">สถานะ</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.user_type === 'admin' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.user_type === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {user.branch_name || 'ไม่ระบุสาขา'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.is_active ? 'ใช้งาน' : 'ปิดการใช้งาน'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-slate-800">สร้างผู้ใช้ใหม่</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                  placeholder="รหัสผ่าน"
                />
                <button
                  onClick={handleGeneratePassword}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium"
                >
                  สุ่ม
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทผู้ใช้</label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
              >
                <option value="kiosk">User (Kiosk/Kitchen/Queue)</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">สาขา</label>
              <select
                value={formData.branch_id || ''}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
              >
                <option value="">ไม่ระบุสาขา</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} {branch.code ? `(${branch.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreate}
                className="flex-1 bg-[#BF0A30] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a00828] transition-colors"
              >
                สร้าง
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-slate-800">แก้ไขผู้ใช้</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                  placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน"
                />
                <button
                  onClick={handleGeneratePassword}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium"
                >
                  สุ่ม
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทผู้ใช้</label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
              >
                <option value="kiosk">User (Kiosk/Kitchen/Queue)</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">สาขา</label>
              <select
                value={formData.branch_id || ''}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
              >
                <option value="">ไม่ระบุสาขา</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} {branch.code ? `(${branch.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#BF0A30] border-slate-300 rounded focus:ring-[#BF0A30]"
                />
                <span className="text-sm text-slate-700">เปิดการใช้งาน</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-[#BF0A30] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a00828] transition-colors"
              >
                บันทึก
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

