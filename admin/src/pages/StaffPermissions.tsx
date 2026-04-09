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
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'bookings', label: 'Bookings', icon: '📅' },
  { key: 'courts', label: 'Courts', icon: '🏸' },
  { key: 'timeslots', label: 'Timeslots', icon: '⏰' },
  { key: 'locations', label: 'Locations', icon: '📍' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'payments', label: 'Payments', icon: '💳' },
  { key: 'products', label: 'Products', icon: '🎾' },
  { key: 'rackets', label: 'Rackets', icon: '🏑' },
  { key: 'racket_rentals', label: 'Racket Rentals', icon: '🔄' },
  { key: 'reviews', label: 'Reviews', icon: '⭐' },
  { key: 'staff', label: 'Staff Permissions', icon: '👮' },
];

const PERMISSION_LEVELS = [
  { value: 'none', label: 'No Access', color: 'bg-slate-100 text-slate-600' },
  { value: 'view', label: 'View Only', color: 'bg-blue-100 text-blue-700' },
  { value: 'add', label: 'Add Only', color: 'bg-green-100 text-green-700' },
  { value: 'edit', label: 'View + Add + Edit', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'full', label: 'Full Access', color: 'bg-purple-100 text-purple-700' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

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
        setError(res.error || 'Failed to load staff permissions');
      }
    } catch (err) {
      setError('Failed to load staff permissions');
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
        alert('Failed to save: ' + res.error);
      }
    } catch (err) {
      alert('Failed to save permissions');
    }
    setSaving(null);
  };

  const addNewStaff = async () => {
    if (!newEmail.trim()) {
      alert('Email is required');
      return;
    }
    
    try {
      const res = await api.post<StaffMember>('/staff-permissions', {
        email: newEmail.trim(),
        name: newName.trim() || undefined,
        permissions: ALL_SECTIONS.map(s => ({ section: s.key, actions: [] }))
      });
      
      if (res.data) {
        setStaff(prev => [...prev, res.data!]);
        setAddDialogOpen(false);
        setNewEmail('');
        setNewName('');
      } else {
        alert('Failed to add staff: ' + res.error);
      }
    } catch (err) {
      alert('Failed to add staff member');
    }
  };

  const removeStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      const res = await api.delete(`/staff-permissions/${staffId}`);
      if (res.data) {
        setStaff(prev => prev.filter(s => s.id !== staffId));
      } else {
        alert('Failed to remove: ' + res.error);
      }
    } catch (err) {
      alert('Failed to remove staff member');
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
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            👮 Staff Permissions
          </h1>
          <p className="text-muted-foreground">Manage staff access and permissions</p>
        </div>
        
        <button
          onClick={() => setAddDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          <span>+</span> Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search staff by email or name..."
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
            <p className="mt-4 text-muted-foreground">No staff members found</p>
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
                        <h3 className="font-medium">{member.name || 'Unnamed'}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
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
                        💾 {saving === member.id ? 'Saving...' : 'Save'}
                      </button>
                      
                      <button
                        onClick={() => removeStaff(member.id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                        title="Remove staff"
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
                    {expandedRow === member.id ? '▼ Hide' : '▶ Show'} Permissions
                  </button>

                  {/* Full Permission Matrix */}
                  {expandedRow === member.id && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Section</th>
                            <th className="text-left p-3 font-medium">Quick Set</th>
                            <th className="text-left p-3 font-medium">Actions</th>
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
                                            "capitalize",
                                            isChecked ? 'text-foreground' : 'text-muted-foreground'
                                          )}>
                                            {action}
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
            <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <input
                  type="text"
                  placeholder="Enter name"
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
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setAddDialogOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={addNewStaff}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        * Only users with Staff Permissions access can modify these settings.
      </p>
    </div>
  );
};

export default StaffPermissions;