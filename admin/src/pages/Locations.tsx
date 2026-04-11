import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Location {
  id: string;
  name: string;
  address: string;
  mapUrl?: string;
  createdAt?: string;
}

const Locations = () => {
  const { hasPermission } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    mapUrl: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const canAdd = hasPermission("locations", "add");
  const canEdit = hasPermission("locations", "edit");
  const canDelete = hasPermission("locations", "delete");

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Location[]>("/locations");
    if (err) {
      setError(err);
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((editingId && !canEdit) || (!editingId && !canAdd)) {
      setError("Bạn không có quyền thực hiện thao tác này");
      return;
    }
    if (!formData.name || !formData.address) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingId) {
      const { error: err } = await api.put(`/locations/${editingId}`, formData);
      if (err) {
        setError(err);
      } else {
        setLocations(locations.map(l => l.id === editingId ? { ...l, ...formData } : l));
        setShowModal(false);
        resetForm();
      }
    } else {
      const { data, error: err } = await api.post("/locations", formData);
      if (err) {
        setError(err);
      } else {
        setLocations([...locations, data as Location]);
        setShowModal(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      setError("Bạn không có quyền xóa địa điểm");
      return;
    }
    if (!confirm("Xác nhận xóa địa điểm?")) return;
    const { error: err } = await api.delete(`/locations/${id}`);
    if (err) {
      setError(err);
    } else {
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  const handleEdit = (location: Location) => {
    if (!canEdit) {
      setError("Bạn không có quyền chỉnh sửa địa điểm");
      return;
    }
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address,
      mapUrl: location.mapUrl || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", mapUrl: "" });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Địa Điểm</h1>
        {canAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Thêm Địa Điểm
          </button>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <div key={location.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{location.name}</h3>
                  <p className="text-sm text-gray-600">{location.address}</p>
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && locations.length === 0 && <div className="text-center py-8 text-gray-500">Không có địa điểm nào</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Cập Nhật Địa Điểm" : "Thêm Địa Điểm Mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                placeholder="Tên Địa Điểm"
                required
                className="w-full border p-2 rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Địa Chỉ"
                required
                className="w-full border p-2 rounded"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                type="url"
                placeholder="URL Google Maps"
                className="w-full border p-2 rounded"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
              />
              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {editingId ? "Cập Nhật" : "Tạo Địa Điểm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations;
