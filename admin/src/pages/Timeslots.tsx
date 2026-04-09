import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2 } from "lucide-react";

interface TimeSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  courtId?: string;
  court?: {
    courtName: string;
  };
  createdAt?: string;
}

interface Court {
  id: string;
  courtName: string;
}

const Timeslots = () => {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    start: "",
    end: "",
    courtId: "",
  });

  useEffect(() => {
    fetchTimeslots();
    fetchCourts();
  }, []);

  const fetchTimeslots = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<TimeSlot[]>("/timeslots");
    if (err) {
      setError(err);
    } else {
      setTimeslots(data || []);
    }
    setLoading(false);
  };

  const fetchCourts = async () => {
    const { data, error: err } = await api.get<Court[]>("/courts");
    if (!err && data) {
      setCourts(data);
    }
  };

  const handleCreateTimeslot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.start || !formData.end || !formData.courtId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setDeleting(true);
    const { data, error: err } = await api.post("/timeslots", {
      courtId: formData.courtId,
      date: formData.date,
      start: formData.start,
      end: formData.end,
    });

    if (err) {
      setError(err);
    } else {
      const created = Array.isArray(data) ? data : [data];
      setTimeslots([...timeslots, ...(created as TimeSlot[])]);
      setFormData({ date: "", start: "", end: "", courtId: "" });
      setShowModal(false);
      setError(null);
    }
    setDeleting(false);
  };

  const handleDeleteTimeslot = async (slotId: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa khung giờ này?")) return;

    setDeleting(true);
    const { error: err } = await api.delete(`/timeslots/${slotId}`);
    if (err) {
      setError(err);
    } else {
      setTimeslots(timeslots.filter((t) => t.id !== slotId));
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Khung Giờ</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Tạo Khung Giờ
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border">
                <th className="p-3 text-left">Sân</th>
                <th className="p-3 text-left">Ngày</th>
                <th className="p-3 text-left">Giờ Bắt Đầu</th>
                <th className="p-3 text-left">Giờ Kết Thúc</th>
                <th className="p-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {timeslots.map((slot) => (
                <tr key={slot.id} className="border hover:bg-gray-50">
                  <td className="p-3">{slot.court?.courtName || "N/A"}</td>
                  <td className="p-3">{slot.date}</td>
                  <td className="p-3">{slot.start}</td>
                  <td className="p-3">{slot.end}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteTimeslot(slot.id)}
                      disabled={deleting}
                      className="p-2 hover:bg-red-100 rounded transition text-red-600 inline-block"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {timeslots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Chưa có khung giờ nào
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tạo Khung Giờ Mới</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTimeslot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ngày</label>
                <input
                  type="date"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>

              <select
                className="w-full border p-2 rounded"
                value={formData.courtId}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    courtId: e.target.value,
                  }))
                }
              >
                <option value="">Chọn Sân</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.courtName}
                  </option>
                ))}
              </select>

              <input
                type="time"
                required
                className="w-full border p-2 rounded"
                value={formData.start}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    start: e.target.value,
                  }))
                }
              />

              <input
                type="time"
                required
                className="w-full border p-2 rounded"
                value={formData.end}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    end: e.target.value,
                  }))
                }
              />

              <button
                type="submit"
                disabled={deleting}
                className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 transition disabled:opacity-50"
              >
                {deleting ? "Đang tạo..." : "Tạo Khung Giờ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeslots;
