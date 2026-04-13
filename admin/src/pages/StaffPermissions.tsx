import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

interface Permission {
  section: string;
  actions: PermissionAction[];
}

interface StaffMember {
  id: string;
  email: string;
  name?: string;
  permissions: Permission[];
  createdAt?: string;
}

const ALL_SECTIONS = [
  { key: 'dashboard', label: 'Tổng Quan', icon: '📊' },
  { key: 'bookings', label: 'Đặt Sân', icon: '📅' },
  { key: 'courts', label: 'Sân Pickleball', icon: '🏸' },
  { key: 'timeslots', label: 'Khung Giờ', icon: '⏰' },
  { key: 'locations', label: 'Địa Điểm', icon: '📍' },
  { key: 'users', label: 'Người Dùng', icon: '👥' },
  { key: 'payments', label: 'Thanh Toán', icon: '💳' },
  { key: 'products', label: 'Sản Phẩm', icon: '🎾' },
  { key: 'rackets', label: 'Vợt Bán', icon: '🏑' },
  { key: 'racket_rentals', label: 'Cho Thuê Vợt', icon: '🔄' },
  { key: 'racket_orders', label: 'Đơn Vợt', icon: '📦' },
  { key: 'news', label: 'Tin Tức', icon: '📰' },
  { key: 'reviews', label: 'Đánh Giá', icon: '⭐' },
  { key: 'settings', label: 'Cài Đặt Hệ Thống', icon: '⚙️' },
  { key: 'staff', label: 'Phân Quyền Nhân Viên', icon: '👮' },
];

const PERMISSION_LEVELS = [
  { value: 'none', label: 'Không Có Quyền', color: 'bg-slate-100 text-slate-600' },
  { value: 'view', label: 'Chỉ Xem', color: 'bg-blue-100 text-blue-700' },
  { value: 'add', label: 'Chỉ Thêm', color: 'bg-green-100 text-green-700' },
  { value: 'edit', label: 'Xem + Thêm + Sửa', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'full', label: 'Toàn Quyền', color: 'bg-purple-100 text-purple-700' },
];

const getPermissionLevel = (actions: PermissionAction[]): string => {
  if (!actions || actions.length === 0) return 'none';
  if (actions.length === 1 && actions[0] === 'view') return 'view';
  if (actions.includes('view') && actions.includes('add') && actions.includes('edit') && actions.includes('delete')) return 'full';
  if (actions.includes('view') && actions.includes('add') && actions.includes('edit')) return 'edit';
  if (actions.includes('add') && actions.length === 1) return 'add';
  return 'custom';
};

const parseActionsFromLevel = (level: string): PermissionAction[] => {
  switch (level) {
    case 'none': return [];
    case 'view': return ['view'];
    case 'add': return ['view', 'add'];
    case 'edit': return ['view', 'add', 'edit'];
    case 'full': return ['view', 'add', 'edit', 'delete'];
    default: return [];
  }
};

const StaffPermissions = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; staffId: string | null; staffName: string }>(
    { open: false, staffId: null, staffName: '' }
  );
  const [passwordValue, setPasswordValue] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get<StaffMember[]>('/staff-permissions');
      if (res.data) {
        setStaff(res.data.map(s => ({
          ...s,
          permissions: ensureAllSections(s.permissions)
        })));
      } else {
        setError(res.error || 'Không thể tải danh sách phân quyền nhân viên');
      }
    } catch (err) {
      setError('Không thể tải danh sách phân quyền nhân viên');
    }
    setLoading(false);
  };

  const ensureAllSections = (perms: Permission[]): Permission[] => {
    return ALL_SECTIONS.map(section => {
      const existing = perms.find(p => p.section === section.key);
      return existing || { section: section.key, actions: [] };
    });
  };

  const updatePermission = (staffId: string, section: string, level: string) => {
    const actions = parseActionsFromLevel(level);
    setStaff(prev =>
      prev.map(s =>
        s.id === staffId
          ? {
              ...s,
              permissions: ensureAllSections(s.permissions).map(p =>
                p.section === section ? { ...p, actions } : p
              )
            }
          : s
      )
    );
  };

  const updateSingleAction = (staffId: string, section: string, action: PermissionAction, checked: boolean) => {
    setStaff(prev =>
      prev.map(s =>
        s.id === staffId
          ? {
              ...s,
              permissions: ensureAllSections(s.permissions).map(p => {
                if (p.section !== section) return p;
                const newActions = checked
                  ? [...new Set([...p.actions, action])]
                  : p.actions.filter(a => a !== action);
                if (newActions.length > 1 && !newActions.includes('view')) {
                  return { ...p, actions: ['view', ...newActions.filter(a => a !== 'view')] };
                }
                return { ...p, actions: newActions };
              })
            }
          : s
      )
    );
  };

  const savePermissions = async (staffId: string) => {
    setSaving(staffId);
    try {
      const member = staff.find(s => s.id === staffId);
      if (!member) return;
      
      const res = await api.put(`/staff-permissions/${staffId}`, { 
        permissions: member.permissions 
      });
      
      if (!res.data) {
        setNotice({ type: 'error', message: 'Lưu thất bại: ' + res.error });
      } else {
        setNotice({ type: 'success', message: 'Đã lưu phân quyền thành công' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Không thể lưu phân quyền' });
    }
    setSaving(null);
  };

  const addNewStaff = async () => {
    if (!newEmail.trim()) {
      alert('Email là bắt buộc');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      alert('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    
    try {
      const res = await api.post<StaffMember>('/staff-permissions', {
        email: newEmail.trim(),
        name: newName.trim() || undefined,
        password: newPassword,
        permissions: ALL_SECTIONS.map(s => ({ section: s.key, actions: [] }))
      });
      
      if (res.data) {
        setStaff(prev => [...prev, res.data!]);
        setAddDialogOpen(false);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNotice({ type: 'success', message: 'Đã thêm nhân viên thành công' });
      } else {
        setNotice({ type: 'error', message: 'Thêm nhân viên thất bại: ' + res.error });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Không thể thêm nhân viên' });
    }
  };

  const changeStaffPassword = async () => {
    if (!passwordDialog.staffId) return;
    if (!passwordValue || passwordValue.length < 6) {
      setNotice({ type: 'error', message: 'Mật khẩu mới tối thiểu 6 ký tự' });
      return;
    }

    const res = await api.put(`/staff-permissions/${passwordDialog.staffId}/password`, {
      password: passwordValue,
    });

    if (res.data) {
      setNotice({ type: 'success', message: 'Đổi mật khẩu thành công' });
      setPasswordDialog({ open: false, staffId: null, staffName: '' });
      setPasswordValue('');
    } else {
      setNotice({ type: 'error', message: 'Đổi mật khẩu thất bại: ' + res.error });
    }
  };

  const removeStaff = async (staffId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa nhân viên này?')) return;
    
    try {
      const res = await api.delete(`/staff-permissions/${staffId}`);
      if (res.data) {
        setStaff(prev => prev.filter(s => s.id !== staffId));
        setNotice({ type: 'success', message: 'Đã xóa nhân viên thành công' });
      } else {
        setNotice({ type: 'error', message: 'Xóa thất bại: ' + res.error });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Không thể xóa nhân viên' });
    }
  };

  const filteredStaff = staff.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSectionPermission = (permissions: Permission[], section: string): PermissionAction[] => {
    const perm = permissions.find(p => p.section === section);
    return perm?.actions || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
        <button 
          onClick={fetchStaff}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {notice && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm font-medium border',
            notice.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          )}
        >
          {notice.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            👮 Phân Quyền Nhân Viên
          </h1>
          <p className="text-muted-foreground">Quản lý quyền truy cập của nhân viên</p>
        </div>
        
        <button
          onClick={() => setAddDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          <span>+</span> Thêm Nhân Viên
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm nhân viên theo email hoặc tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">👥</span>
      </div>

      {/* Staff Cards */}
      <div className="space-y-4">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <span className="text-4xl">👥</span>
            <p className="mt-4 text-muted-foreground">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          filteredStaff.map((member) => {
            const actions = getSectionPermission(member.permissions, 'bookings');
            const level = getPermissionLevel(actions);
            
            return (
              <div key={member.id} className="border rounded-lg overflow-hidden">
                {/* Card Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold">
                          {(member.name || member.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{member.name || 'Chưa đặt tên'}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPasswordDialog({ open: true, staffId: member.id, staffName: member.name || member.email })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border hover:bg-muted"
                      >
                        🔐 Đổi mật khẩu
                      </button>
                      <button
                        onClick={() => savePermissions(member.id)}
                        disabled={saving !== null}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 rounded text-sm",
                          saving === member.id 
                            ? "bg-primary text-white" 
                            : "border hover:bg-muted"
                        )}
                      >
                        💾 {saving === member.id ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      
                      <button
                        onClick={() => removeStaff(member.id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                        title="Xóa nhân viên"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Permissions View */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ALL_SECTIONS.map((section) => {
                      const secActions = getSectionPermission(member.permissions, section.key);
                      const secLevel = getPermissionLevel(secActions);
                      const levelInfo = PERMISSION_LEVELS.find(l => l.value === secLevel);
                      
                      return (
                        <span
                          key={section.key}
                          className={cn(
                            "px-2 py-1 rounded text-xs",
                            levelInfo?.color || 'bg-slate-100'
                          )}
                        >
                          {section.icon} {section.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => setExpandedRow(expandedRow === member.id ? null : member.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {expandedRow === member.id ? '▼ Ẩn' : '▶ Hiện'} Quyền
                  </button>

                  {/* Full Permission Matrix */}
                  {expandedRow === member.id && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Chức Năng</th>
                            <th className="text-left p-3 font-medium">Đặt Nhanh</th>
                            <th className="text-left p-3 font-medium">Hành Động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ALL_SECTIONS.map((section) => {
                            const secActions = getSectionPermission(member.permissions, section.key);
                            const secLevel = getPermissionLevel(secActions);
                            
                            return (
                              <tr key={section.key} className="border-t">
                                <td className="p-3">
                                  <span className="font-medium">
                                    {section.icon} {section.label}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <select
                                    value={secLevel}
                                    onChange={(e) => updatePermission(member.id, section.key, e.target.value)}
                                    className="border rounded px-2 py-1 bg-background"
                                  >
                                    {PERMISSION_LEVELS.map((l) => (
                                      <option key={l.value} value={l.value}>
                                        {l.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-3">
                                    {['view', 'add', 'edit', 'delete'].map((action) => {
                                      const isChecked = secActions.includes(action as PermissionAction);
                                      return (
                                        <label
                                          key={action}
                                          className="flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => 
                                              updateSingleAction(
                                                member.id, 
                                                section.key, 
                                                action as PermissionAction, 
                                                e.target.checked
                                              )
                                            }
                                            className="w-4 h-4"
                                          />
                                          <span className={cn(
                                            "",
                                            isChecked ? 'text-foreground' : 'text-muted-foreground'
                                          )}>
                                            {{ view: 'Xem', add: 'Thêm', edit: 'Sửa', delete: 'Xóa' }[action] ?? action}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {addDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Thêm Nhân Viên Mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên (không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Nhập tên"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu (>= 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setAddDialogOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Hủy
              </button>
              <button
                onClick={addNewStaff}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
              >
                Thêm Nhân Viên
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Đổi Mật Khẩu Nhân Viên</h2>
            <p className="text-sm text-muted-foreground mb-4">Nhân viên: {passwordDialog.staffName}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới (>= 6 ký tự)"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setPasswordDialog({ open: false, staffId: null, staffName: '' });
                  setPasswordValue('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Hủy
              </button>
              <button
                onClick={changeStaffPassword}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        * Chỉ người dùng có quyền Phân Quyền Nhân Viên mới có thể thay đổi cài đặt này.
      </p>
    </div>
  );
};

export default StaffPermissions;