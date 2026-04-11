import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2 } from "lucide-react";
import { vietnamProvinces, getDistrictsByProvince, getWardsByDistrict } from "@/lib/vietnamProvinces";
import { uploadImageToCloudinary } from "@/lib/upload-image";
import { useAuth } from "@/hooks/use-auth";

interface Location {
  id: string;
  name: string;
  address: string;
  mapUrl?: string;
}

interface Court {
  id: string;
  courtName: string;
  description?: string;
  pricePerHour: number | string;
  images?: string[];
  locationId?: string;
  location?: Location;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  createdAt?: string;
}

const Courts = () => {
  const { hasPermission } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCourtId, setEditCourtId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    courtName: "",
    description: "",
    pricePerHour: "" as string | number,
    imageUrl: "",
    locationId: "",
    province: "",
    district: "",
    ward: "",
    address: "",
  });

  useEffect(() => {
    fetchCourts();
    fetchLocations();
  }, []);

  const canAdd = hasPermission("courts", "add");
  const canEdit = hasPermission("courts", "edit");
  const canDelete = hasPermission("courts", "delete");

  const fetchCourts = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Court[]>("/courts");
    if (err) {
      setError(err);
    } else {
      setCourts(data || []);
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    const { data } = await api.get<Location[]>("/locations");
    if (data) {
      setLocations(data);
    }
  };

  const handleOpenEdit = (court: Court) => {
    if (!canEdit) {
      setError("Bạn không có quyền chỉnh sửa sân");
      return;
    }
    setEditCourtId(court.id);
    setFormData({
      courtName: court.courtName,
      description: court.description || "",
      pricePerHour: court.pricePerHour,
      imageUrl: court.images?.[0] || "",
      locationId: court.locationId || "",
      province: court.province || "",
      district: court.district || "",
      ward: court.ward || "",
      address: court.address || "",
    });
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    if (!canAdd) {
      setError("Bạn không có quyền tạo sân");
      return;
    }
    setEditCourtId(null);
    setFormData({
      courtName: "",
      description: "",
      pricePerHour: "",
      imageUrl: "",
      locationId: "",
      province: "",
      district: "",
      ward: "",
      address: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((editCourtId && !canEdit) || (!editCourtId && !canAdd)) {
      setError("Bạn không có quyền thực hiện thao tác này");
      return;
    }
    if (!formData.courtName) {
      setError("Vui lòng nhập tên sân");
      return;
    }

    // Nếu chọn location thì dùng address từ location
    let finalAddress = formData.address;
    if (formData.locationId) {
      const selectedLocation = locations.find(l => l.id === formData.locationId);
      if (selectedLocation) {
        finalAddress = selectedLocation.address;
      }
    }

    setDeleting(true);
    const payload = {
      courtName: formData.courtName,
      description: formData.description || undefined,
      images: formData.imageUrl ? [formData.imageUrl] : undefined,
      pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour.toString()) : 0,
      locationId: formData.locationId || undefined,
      province: formData.province || undefined,
      district: formData.district || undefined,
      ward: formData.ward || undefined,
      address: finalAddress || undefined,
    };

    const { data, error: err } = editCourtId 
      ? await api.put(`/courts/${editCourtId}`, payload)
      : await api.post("/courts", payload);

    if (err) {
      setError(err);
    } else {
      if (editCourtId) {
        setCourts(courts.map(c => c.id === editCourtId ? (data as Court) : c));
      } else {
        setCourts([...courts, data as Court]);
      }
      setShowModal(false);
      setError(null);
    }
    setDeleting(false);
  };

  const handleDeleteCourt = async (courtId: string) => {
    if (!canDelete) {
      setError("Bạn không có quyền xóa sân");
      return;
    }
    if (!confirm("Bạn chắc chắn muốn xóa sân này?")) return;

    setDeleting(true);
    const { error: err } = await api.delete(`/courts/${courtId}`);
    if (err) {
      setError(err);
    } else {
      setCourts(courts.filter((c) => c.id !== courtId));
    }
    setDeleting(false);
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload ảnh thất bại";
      setError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Sân</h1>
        {canAdd && (
          <button
            onClick={handleOpenCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Tạo Sân
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div key={court.id} className="border rounded-lg bg-white shadow overflow-hidden">
              {court.images && court.images.length > 0 && (
                <img
                  src={court.images[0]}
                  alt={court.courtName}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <h3 className="font-semibold text-lg">{court.courtName}</h3>
                    {court.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{court.description}</p>
                    )}
                    
                    <p className="text-blue-600 font-bold mt-2">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(court.pricePerHour))} / giờ
                    </p>

                    {/* Hiển thị Location nếu có */}
                    {court.locationId && (
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {court.location?.name || "Location#" + court.locationId.slice(0, 8)}
                      </p>
                    )}
                    
                    {/* Địa chỉ cụ thể */}
                    {court.address && (
                      <p className="text-sm text-gray-700 mt-1 font-medium italic">
                        {court.address}
                      </p>
                    )}
                    
                    {/* Phường/Xã, Quận/Huyện, Tỉnh/TP */}
                    {(court.ward || court.district || court.province) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {court.ward && vietnamProvinces
                          .find(p => p.code === court.province)
                          ?.districts.find(d => d.code === court.district)
                          ?.wards.find(w => w.code === court.ward)?.name}
                        {court.ward && ", "}
                        {court.district && vietnamProvinces
                          .find(p => p.code === court.province)
                          ?.districts.find(d => d.code === court.district)?.name}
                        {court.district && ", "}
                        {court.province && vietnamProvinces.find(p => p.code === court.province)?.name}
                      </p>
                    )}
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex flex-col gap-2">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(court)}
                          className="p-2 hover:bg-blue-100 rounded transition text-blue-600 flex-shrink-0"
                          title="Chỉnh sửa"
                        >
                          Sửa
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteCourt(court.id)}
                          disabled={deleting}
                          className="p-2 hover:bg-red-100 rounded transition text-red-600 flex-shrink-0"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded w-[500px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editCourtId ? "Chỉnh sửa Sân" : "Tạo Sân Mới"}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tên sân *</label>
                <input
                  type="text"
                  placeholder="Nhập tên sân"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.courtName}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      courtName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Giá thuê (VND/giờ) *</label>
                  <input
                    type="number"
                    placeholder="VD: 150000"
                    required
                    min="0"
                    step="1000"
                    className="w-full border p-2 rounded"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        pricePerHour: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Mô tả</label>
                <textarea
                  placeholder="Mô tả sân (tùy chọn)"
                  rows={3}
                  className="w-full border p-2 rounded resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Ảnh sân (Cloudinary)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border p-2 rounded"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
                <input
                  type="text"
                  className="w-full border p-2 rounded bg-gray-50"
                  value={formData.imageUrl}
                  readOnly
                  placeholder={uploadingImage ? "Đang upload ảnh..." : "URL ảnh sau khi upload sẽ hiện ở đây"}
                />
              </div>
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="preview"
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}

              {/* Chọn Location */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Chọn Địa điểm (Location)</label>
                <select
                  className="w-full border p-2 rounded bg-white cursor-pointer"
                  value={formData.locationId}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      locationId: e.target.value,
                      // Reset address nếu chọn location mới
                      address: e.target.value ? "" : p.address,
                    }))
                  }
                >
                  <option value="">-- Không chọn (nhập thủ công bên dưới) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.address}
                    </option>
                  ))}
                </select>
                {formData.locationId && (
                  <p className="text-xs text-green-600">
                    ✓ Sẽ sử dụng địa chỉ từ Location đã chọn
                  </p>
                )}
              </div>

              {/* Hoặc nhập thủ công nếu không chọn Location */}
              {!formData.locationId && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Chọn Tỉnh/Thành phố</label>
                    <select
                      className="w-full border p-2 rounded bg-white cursor-pointer"
                      value={formData.province}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          province: e.target.value,
                          district: "",
                          ward: "",
                        }))
                      }
                    >
                      <option value="">-- Chọn Tỉnh/Thành phố --</option>
                      {vietnamProvinces.map((prov) => (
                        <option key={prov.code} value={prov.code}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.province && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Chọn Quận/Huyện</label>
                      <select
                        className="w-full border p-2 rounded bg-white cursor-pointer"
                        value={formData.district}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            district: e.target.value,
                            ward: "",
                          }))
                        }
                      >
                        <option value="">-- Chọn Quận/Huyện --</option>
                        {getDistrictsByProvince(formData.province).map((dist) => (
                          <option key={dist.code} value={dist.code}>
                            {dist.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.district && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Chọn Phường/Xã</label>
                      <select
                        className="w-full border p-2 rounded bg-white cursor-pointer"
                        value={formData.ward}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            ward: e.target.value,
                          }))
                        }
                      >
                        <option value="">-- Chọn Phường/Xã --</option>
                        {getWardsByDistrict(formData.district, formData.province).map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Địa chỉ cụ thể (VD: số nhà, đường,...)"
                    className="w-full border p-2 rounded"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                  />
                </>
              )}

              <button
                type="submit"
                disabled={deleting}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {deleting ? "Đang xử lý..." : (editCourtId ? "Lưu thay đổi" : "Tạo Sân")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courts;