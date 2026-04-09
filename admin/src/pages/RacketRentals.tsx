import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2, Edit2 } from "lucide-react";

interface Racket {
  id: string;
  name: string;
  type: string;
  brand?: string;
}

interface RacketRental {
  id: string;
  racketId: string;
  rentalPrice: number;
  durationHours: number;
  stock: number;
  isActive: boolean;
  racket?: Racket;
}

const RacketRentals = () => {
  const [rentals, setRentals] = useState<RacketRental[]>([]);
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    racketId: "",
    rentalPrice: 0,
    durationHours: 1,
    stock: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rentalsRes, rocketsRes] = await Promise.all([
      api.get<RacketRental[]>("/racket-rentals"),
      api.get<Racket[]>("/rackets"),
    ]);

    if (rentalsRes.error) {
      setError(rentalsRes.error);
    } else {
      setRentals(rentalsRes.data || []);
    }

    if (!rocketsRes.error) {
      setRackets(rocketsRes.data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSave called, formData:', formData);
    if (!formData.racketId || formData.rentalPrice <= 0 || formData.durationHours <= 0) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingId) {
      console.log('Sending PUT to /racket-rentals/' + editingId, 'payload:', formData);
      const { error: err } = await api.put(`/racket-rentals/${editingId}`, formData);
      console.log('PUT response, error:', err);
      if (err) {
        setError(err);
      } else {
        // Fetch lại từ server để đảm bảo data đúng
        await fetchData();
        setShowModal(false);
        resetForm();
      }
    } else {
      const { data, error: err } = await api.post("/racket-rentals", formData);
      if (err) {
        setError(err);
      } else {
        setRentals([...rentals, data as RacketRental]);
        setShowModal(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa cho thuê vợt này?")) return;
    const { error: err } = await api.delete(`/racket-rentals/${id}`);
    if (err) {
      setError(err);
    } else {
      setRentals(rentals.filter((r) => r.id !== id));
    }
  };

  const handleEdit = (rental: RacketRental) => {
    console.log('handleEdit called, rental:', rental);
    setEditingId(rental.id);
    setFormData({
      racketId: rental.racketId || rental.racket?.id || "",
      rentalPrice: rental.rentalPrice,
      durationHours: rental.durationHours,
      stock: rental.stock,
      isActive: rental.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      racketId: "",
      rentalPrice: 0,
      durationHours: 1,
      stock: 0,
      isActive: true,
    });
    setEditingId(null);
  };

  const getRacketName = (racketId: string) => {
    const racket = rackets.find((r) => r.id === racketId);
    return racket ? `${racket.name} (${racket.brand || "N/A"})` : "Không xác định";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Cho Thuê Vợt</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm Cấu Hình Thuê
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-3 text-left">Vợt</th>
                <th className="border p-3 text-left">Thời Lượng (giờ)</th>
                <th className="border p-3 text-left">Giá Thuê</th>
                <th className="border p-3 text-left">Số Lượng Kho</th>
                <th className="border p-3 text-left">Trạng Thái</th>
                <th className="border p-3 text-left">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-gray-50">
                  <td className="border p-3">{getRacketName(rental.racketId)}</td>
                  <td className="border p-3">{rental.durationHours}</td>
                  <td className="border p-3">{new Intl.NumberFormat("vi-VN").format(rental.rentalPrice)}đ</td>
                  <td className="border p-3">{rental.stock}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded text-sm ${rental.isActive ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>
                      {rental.isActive ? "Hoạt Động" : "Ngừng"}
                    </span>
                  </td>
                  <td className="border p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(rental)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(rental.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rentals.length === 0 && <div className="text-center py-8 text-gray-500">Không có cấu hình cho thuê nào</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded w-[600px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Cập Nhật Cho Thuê Vợt" : "Thêm Cấu Hình Cho Thuê"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chọn Vợt *</label>
                <select
                  required
                  className="w-full border p-2 rounded"
                  value={formData.racketId}
                  onChange={(e) => setFormData({ ...formData, racketId: e.target.value })}
                >
                  <option value="">-- Chọn Vợt --</option>
                  {rackets.map((racket) => (
                    <option key={racket.id} value={racket.id}>
                      {racket.name} ({racket.brand || "N/A"}) - {racket.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thời Lượng (giờ) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="w-full border p-2 rounded"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá Thuê *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border p-2 rounded"
                    value={formData.rentalPrice}
                    onChange={(e) => setFormData({ ...formData, rentalPrice: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Số Lượng Kho *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full border p-2 rounded"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Hoạt Động</span>
              </label>

              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {editingId ? "Cập Nhật" : "Tạo Cấu Hình"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RacketRentals;
