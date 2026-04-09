import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2, Edit2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: "admin" | "manager" | "staff" | "user";
  createdAt?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    role: "user" as const,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<User[]>("/users");
    if (err) {
      setError(err);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Email là bắt buộc");
      return;
    }

    if (editingId) {
      const { error: err } = await api.put(`/users/${editingId}`, formData);
      if (err) {
        setError(err);
      } else {
        setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } : u));
        setShowModal(false);
        resetForm();
      }
    } else {
      const { data, error: err } = await api.post("/users", formData);
      if (err) {
        setError(err);
      } else {
        setUsers([...users, data as User]);
        setShowModal(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa người dùng?")) return;
    const { error: err } = await api.delete(`/users/${id}`);
    if (err) {
      setError(err);
    } else {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      email: user.email,
      fullName: user.fullName || "",
      phone: user.phone || "",
      role: user.role,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ email: "", fullName: "", phone: "", role: "user" });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Người Dùng</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm Người Dùng
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Tên</th>
                <th className="p-3 text-left">Số điện thoại</th>
                <th className="p-3 text-left">Quyền</th>
                <th className="p-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.fullName || "-"}</td>
                  <td className="p-3">{user.phone || "-"}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{user.role}</span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded inline-block"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded inline-block"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center py-8 text-gray-500">Không có người dùng nào</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Cập Nhật Người Dùng" : "Thêm Người Dùng Mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full border p-2 rounded"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Tên Đầy Đủ"
                className="w-full border p-2 rounded"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Số Điện Thoại"
                className="w-full border p-2 rounded"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {editingId ? "Cập Nhật" : "Tạo Người Dùng"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
