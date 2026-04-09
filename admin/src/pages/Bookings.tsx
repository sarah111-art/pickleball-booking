import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Status colors mapping
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
};

interface Booking {
  id: string;
  court: {
    name: string;
  };
  date: string;
  user: {
    email: string;
  };
  status: "pending" | "confirmed" | "cancelled" | "paid";
  slot: {
    start: string;
    end: string;
  };
  addons?: Array<{
    type: 'product' | 'racket_rental';
    itemId: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  totalAmount?: number;
}

interface Court {
  id: string;
  courtName: string;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  isBooked?: boolean;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [courts, setCourts] = useState<Court[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    userEmail: "",
    courtId: "",
    date: "",
    slotId: "",
    paymentMethod: "cash",
    note: "",
  });

  const [editData, setEditData] = useState({
    courtId: "",
    date: "",
    slotId: "",
    status: "" as "pending" | "confirmed" | "cancelled" | "paid",
    note: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);

    const res = await api.get<Booking[]>("/bookings");

    setLoading(false);

    if (res.data) {
      setBookings(res.data);
    } else {
      setError(res.error || "Could not load bookings");
    }
  };

  const fetchCourts = async () => {
    const res = await api.get<Court[]>("/courts");

    if (res.data) {
      setCourts(res.data);
    }
  };

  const fetchAvailableSlots = async (courtId: string, date: string) => {
    const res = await api.get(`/courts/${courtId}/slots?date=${date}`);

    if (res.data) {
      const availableOnly = res.data.filter((slot: any) => !slot.isBooked);
      setAvailableSlots(availableOnly);
    }
  };

  const handleCourtChange = (courtId: string) => {
    setFormData((prev) => ({
      ...prev,
      courtId,
      slotId: "",
    }));

    if (formData.date && courtId) {
      fetchAvailableSlots(courtId, formData.date);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.userEmail ||
      !formData.courtId ||
      !formData.slotId ||
      !formData.date
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setCreating(true);

    try {
      const res = await api.post("/bookings/admin", formData);

      if (res.data) {
        alert("Tạo đặt sân thành công");

        setShowCreateModal(false);

        setFormData({
          userEmail: "",
          courtId: "",
          date: "",
          slotId: "",
          paymentMethod: "cash",
          note: "",
        });

        fetchBookings();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    }

    setCreating(false);
  };

  const handleEditClick = (booking: Booking) => {
    setEditData({
      courtId: "",
      date: booking.date,
      slotId: "",
      status: booking.status,
      note: "",
    });
    setShowDetailsModal(false);
    setShowEditModal(true);
    fetchCourts();
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editData.date || !editData.status) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSaving(true);

    try {
      const res = await api.put(`/bookings/${selectedBooking?.id}`, {
        date: editData.date,
        slotId: editData.slotId || undefined,
        status: editData.status,
        note: editData.note,
      });

      if (res.data) {
        alert("Cập nhật đặt sân thành công");
        setShowEditModal(false);
        fetchBookings();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    }

    setSaving(false);
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;

    setDeleting(true);

    try {
      const res = await api.delete(`/bookings/${selectedBooking.id}`);

      if (res.data) {
        alert("Xóa đặt sân thành công");
        setShowDeleteConfirm(false);
        setShowDetailsModal(false);
        fetchBookings();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    }

    setDeleting(false);
  };

  // FIX 1: dùng đúng date truyền vào
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString("sv-SE");

    return bookings.filter((b) => b.date === dateStr);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);

    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];

    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);

      if (direction === "prev") newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setMonth(newDate.getMonth() + 1);

      return newDate;
    });

    setSelectedDate(null);
  };

  const handleDayClick = (day: Date) => {

    // FIX 2: tránh lỗi timezone
    const dateStr = day.toLocaleDateString("sv-SE");

    setFormData((prev) => ({
      ...prev,
      date: dateStr,
      courtId: "",
      slotId: "",
    }));

    setAvailableSlots([]);

    setShowCreateModal(true);

    fetchCourts();
  };

  const calendarDays = generateCalendarDays();

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lịch đặt sân</h1>

        <div className="flex items-center gap-4">
          <button onClick={() => navigateMonth("prev")}>
            <ChevronLeft />
          </button>

          <h2>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button onClick={() => navigateMonth("next")}>
            <ChevronRight />
          </button>
        </div>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p>{error}</p>}

      <div className="grid grid-cols-7 gap-1">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
          <div key={d} className="text-center font-medium">
            {d}
          </div>
        ))}

        {calendarDays.map((day, i) => {
          const dayBookings = getBookingsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`min-h-[120px] border p-2 cursor-pointer transition-all hover:shadow-md ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
            >
              <div className={`font-semibold text-sm mb-2 ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'} ${isToday ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((b) => {
                  const colors = statusColors[b.status] || statusColors.pending;
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(b);
                        setShowDetailsModal(true);
                      }}
                      className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 mb-1 truncate ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      <span className="font-medium">{b.slot.start}</span>
                      <span className="ml-1 opacity-75">- {b.court?.name}</span>
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        {Object.entries(statusLabels).map(([key, label]) => {
          const colors = statusColors[key];
          return (
            <div key={key} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}>
              <span className={`w-2 h-2 rounded-full ${colors.bg.replace('100', '500')}`}></span>
              {label}
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white p-6 rounded w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Tạo đặt sân mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full border p-2"
                value={formData.userEmail}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    userEmail: e.target.value,
                  }))
                }
              />

              <select
                className="w-full border p-2"
                value={formData.courtId}
                onChange={(e) =>
                  handleCourtChange(e.target.value)
                }
              >
                <option value="">Chọn sân</option>

                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courtName}
                  </option>
                ))}
              </select>

              <select
                className="w-full border p-2"
                value={formData.slotId}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    slotId: e.target.value,
                  }))
                }
              >
                <option value="">Chọn khung giờ</option>

                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.start} - {slot.end}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full bg-black text-white p-2"
              >
                {creating ? "Đang tạo..." : "Tạo booking"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white p-6 rounded w-[500px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Chi Tiết Đặt Sân
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-medium">Khách hàng:</span>
                <p>{selectedBooking.user?.email}</p>
              </div>
              <div>
                <span className="font-medium">Sân:</span>
                <p>{selectedBooking.court?.name}</p>
              </div>
              <div>
                <span className="font-medium">Ngày:</span>
                <p>{selectedBooking.date}</p>
              </div>
              <div>
                <span className="font-medium">Giờ:</span>
                <p>{selectedBooking.slot?.start} - {selectedBooking.slot?.end}</p>
              </div>
              <div>
                <span className="font-medium">Trạng thái:</span>
                {(() => {
                  const colors = statusColors[selectedBooking.status] || statusColors.pending;
                  return (
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {statusLabels[selectedBooking.status] || selectedBooking.status}
                    </span>
                  );
                })()}
              </div>

              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div>
                  <span className="font-medium block mb-2">Sản Phẩm & Dịch Vụ Thêm:</span>
                  <div className="space-y-1 bg-gray-50 p-3 rounded">
                    {selectedBooking.addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{addon.name} x {addon.quantity}</span>
                        <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(addon.price * addon.quantity)}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBooking.totalAmount && (
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Tổng tiền:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(selectedBooking.totalAmount)}đ</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleEditClick(selectedBooking)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                >
                  <Pencil size={16} />
                  Sửa
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white p-6 rounded w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Sửa đặt sân
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Khách hàng</label>
                <p className="border p-2 bg-gray-50 rounded">{selectedBooking.user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ngày</label>
                <input
                  type="date"
                  required
                  className="w-full border p-2"
                  value={editData.date}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      date: e.target.value,
                      slotId: "",
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sân</label>
                <select
                  className="w-full border p-2"
                  value={editData.courtId}
                  onChange={(e) => {
                    setEditData((p) => ({
                      ...p,
                      courtId: e.target.value,
                      slotId: "",
                    }));
                    if (editData.date && e.target.value) {
                      fetchAvailableSlots(e.target.value, editData.date);
                    }
                  }}
                >
                  <option value="">Giữ nguyên sân cũ</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courtName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Khung giờ</label>
                <select
                  className="w-full border p-2"
                  value={editData.slotId}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      slotId: e.target.value,
                    }))
                  }
                >
                  <option value="">Giữ nguyên giờ cũ</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.start} - {slot.end}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  className="w-full border p-2"
                  value={editData.status}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      status: e.target.value as any,
                    }))
                  }
                >
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white p-6 rounded w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Xác nhận xóa
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa đặt sân này? Hành động này không thể hoàn tác.
              </p>
              <div className="space-y-2 text-sm bg-gray-50 p-3 rounded mb-4">
                <p><strong>Khách hàng:</strong> {selectedBooking.user?.email}</p>
                <p><strong>Ngày:</strong> {selectedBooking.date}</p>
                <p><strong>Giờ:</strong> {selectedBooking.slot?.start} - {selectedBooking.slot?.end}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteBooking}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white p-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;