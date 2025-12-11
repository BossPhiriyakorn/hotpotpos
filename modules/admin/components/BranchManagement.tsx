import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

interface Branch {
  id: number;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    is_active: true,
  });

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getBranches(false); // Only active branches
      // apiService.getBranches() returns the data array directly (not wrapped in { data: [...] })
      // Filter to show only active branches
      const activeBranches = Array.isArray(result) ? result.filter((b: Branch) => b.is_active) : [];
      setBranches(activeBranches);
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || formData.name.trim() === '') {
        alert('กรุณากรอกชื่อสาขา');
        return;
      }
      
      await apiService.createBranch({
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        is_active: formData.is_active,
      });
      
      setShowCreateModal(false);
      resetForm();
      fetchBranches();
      alert('สร้างสาขาสำเร็จ');
    } catch (err: any) {
      console.error('Failed to create branch:', err);
      alert(err.message || 'ไม่สามารถสร้างสาขาได้');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      is_active: branch.is_active,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (!editingBranch) return;
      
      if (!formData.name || formData.name.trim() === '') {
        alert('กรุณากรอกชื่อสาขา');
        return;
      }
      
      await apiService.updateBranch(editingBranch.id, {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        is_active: formData.is_active,
      });
      
      setShowEditModal(false);
      setEditingBranch(null);
      resetForm();
      fetchBranches();
      alert('อัพเดทสาขาสำเร็จ');
    } catch (err: any) {
      console.error('Failed to update branch:', err);
      alert(err.message || 'ไม่สามารถอัพเดทสาขาได้');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสาขานี้?')) {
      return;
    }
    
    try {
      await apiService.deleteBranch(id);
      fetchBranches();
      alert('ลบสาขาสำเร็จ');
    } catch (err: any) {
      console.error('Failed to delete branch:', err);
      alert(err.message || 'ไม่สามารถลบสาขาได้');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
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
          <h2 className="text-3xl font-bold text-slate-800">จัดการสาขา (Branch Management)</h2>
          <p className="text-slate-500 mt-1">สร้าง แก้ไข และจัดการสาขาในระบบ</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-[#BF0A30] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#a00828] transition-colors"
        >
          + สร้างสาขาใหม่
        </button>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">ชื่อสาขา</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">รหัสสาขา</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">ที่อยู่</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">เบอร์โทร</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">สถานะ</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-slate-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{branch.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {branch.code || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {branch.address || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {branch.phone || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      branch.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {branch.is_active ? 'ใช้งาน' : 'ปิดการใช้งาน'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    ยังไม่มีสาขา
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
            <h3 className="text-2xl font-bold text-slate-800">สร้างสาขาใหม่</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อสาขา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="กรอกชื่อสาขา"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสสาขา</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="เช่น B001, B002"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="กรอกที่อยู่สาขา"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="เช่น 02-123-4567"
              />
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
      {showEditModal && editingBranch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-slate-800">แก้ไขสาขา</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อสาขา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสสาขา</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="เช่น B001, B002"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="กรอกที่อยู่สาขา"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:border-[#BF0A30] focus:ring-1 focus:ring-[#BF0A30] outline-none"
                placeholder="เช่น 02-123-4567"
              />
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
                  setEditingBranch(null);
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

export default BranchManagement;

