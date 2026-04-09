import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2, Edit2 } from "lucide-react";

interface Racket {
  id: string;
  name: string;
  type: "beginner" | "intermediate" | "professional";
  description?: string;
  price: number;
  stock: number;
  brand?: string;
  image?: string;
  isActive: boolean;
}

const Rackets = () => {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "beginner" as const,
    description: "",
    price: 0,
    stock: 0,
    brand: "",
    image: "",
    isActive: true,
  });

  useEffect(() => {
    fetchRackets();
  }, []);

  const fetchRackets = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Racket[]>("/rackets");
    if (err) {
      setError(err);
    } else {
      setRackets(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    console.log('handleSave called, editingId:', editingId, 'formData:', formData);

    if (editingId) {
      console.log('Sending PUT request to /rackets/' + editingId);
      const { error: err } = await api.put(`/rackets/${editingId}`, formData);
      console.log('PUT response, error:', err);
      if (err) {
        setError(err);
        // Fetch lại từ server để đảm bảo data đúng
        await fetchRackets();
        setShowModal(false);
        resetForm();
      }
    } else {
      const { data, error: err } = await api.post("/rackets", formData);
      if (err) {
        setError(err);
      } else {
        setRackets([...rackets, data as Racket]);
        setShowModal(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa vợt?")) return;
    const { error: err } = await api.delete(`/rackets/${id}`);
    if (err) {
      setError(err);
    } else {
      setRackets(rackets.filter(r => r.id !== id));
    }
  };

  const handleEdit = (racket: Racket) => {
    setEditingId(racket.id);
    setFormData({
      name: racket.name,
      type: racket.type,
      description: racket.description || "",
      price: racket.price,
      stock: racket.stock,
      brand: racket.brand || "",
      image: racket.image || "",
      isActive: racket.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "beginner",
      description: "",
      price: 0,
      stock: 0,
      brand: "",
      image: "",
      isActive: true,
    });
    setEditingId(null);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      beginner: "Người Mới",
      intermediate: "Trung Bình",
      professional: "Chuyên Nghiệp",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Vợt Bán</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm Vợt
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rackets.map((racket) => (
            <div key={racket.id} className="border rounded-lg p-4 bg-white shadow">
              {racket.image && (
                <img src={racket.image} alt={racket.name} className="w-full h-40 object-cover rounded mb-2" />
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{racket.name}</h3>
                  {racket.brand && <p className="text-sm text-gray-600">Hãng: {racket.brand}</p>}
                  <p className="text-sm text-gray-600">{racket.description}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Loại:</span> {getTypeLabel(racket.type)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Giá:</span> {new Intl.NumberFormat("vi-VN").format(racket.price)}đ
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Kho:</span> {racket.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(racket)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(racket.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && rackets.length === 0 && <div className="text-center py-8 text-gray-500">Không có vợt nào</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded w-[600px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Cập Nhật Vợt" : "Thêm Vợt Mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                placeholder="Tên Vợt"
                required
                className="w-full border p-2 rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Hãng"
                className="w-full border p-2 rounded"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
              <textarea
                placeholder="Mô Tả"
                className="w-full border p-2 rounded"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="beginner">Người Mới</option>
                <option value="intermediate">Trung Bình</option>
                <option value="professional">Chuyên Nghiệp</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border p-2 rounded"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Số Lượng Kho"
                  required
                  min="0"
                  className="w-full border p-2 rounded"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                />
              </div>
              <input
                type="url"
                placeholder="URL Hình Ảnh"
                className="w-full border p-2 rounded"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Hoạt Động</span>
              </label>
              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {editingId ? "Cập Nhật" : "Tạo Vợt"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rackets;
