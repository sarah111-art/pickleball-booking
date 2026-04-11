import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Calendar as CalendarIcon, Clock, MapPin, Mail, CreditCard, StickyNote, Phone, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    id: string;
    courtName: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  customerName?: string;
  customerPhone?: string;
  user: {
    email: string;
    fullName?: string;
    phone?: string;
  };
  status: "pending" | "confirmed" | "cancelled" | "paid";
  totalAmount?: number;
  note?: string;
}

interface Court {
  id: string;
  courtName: string;
}

const Bookings = () => {
  const { hasPermission } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    userEmail: "",
    courtId: "",
    date: "",
    startTime: "",
    endTime: "",
    status: "pending",
    note: "",
  });

  const canAdd = hasPermission('bookings', 'add');
  const canEdit = hasPermission('bookings', 'edit');
  const canDelete = hasPermission('bookings', 'delete');

  useEffect(() => {
    fetchBookings();
    fetchCourts();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await api.get<Booking[]>("/bookings");
    setLoading(false);
    if (res.data) setBookings(res.data);
    else setError(res.error || "Could not load bookings");
  };

  const fetchCourts = async () => {
    const res = await api.get<Court[]>("/courts");
    if (res.data) setCourts(res.data);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert("Bạn không có quyền tạo đặt sân");
      return;
    }
    if (!formData.userEmail || !formData.courtId || !formData.startTime || !formData.endTime || !formData.date) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/bookings/admin", formData);
      if (res.data) {
        alert("Tạo đặt sân thành công");
        setShowCreateModal(false);
        setFormData({ userEmail: "", courtId: "", date: "", startTime: "", endTime: "", status: "pending", note: "" });
        fetchBookings();
      } else alert("Lỗi: " + res.error);
    } catch (err) { alert("Có lỗi xảy ra"); }
    setCreating(false);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Bạn không có quyền chỉnh sửa đặt sân");
      return;
    }
    if (!selectedBooking) return;
    setUpdating(true);
    try {
      const res = await api.put(`/bookings/${selectedBooking.id}`, formData);
      if (res.data) {
        alert("Cập nhật thành công");
        setShowEditModal(false);
        fetchBookings();
      } else alert("Lỗi: " + res.error);
    } catch (err) { alert("Có lỗi xảy ra"); }
    setUpdating(false);
  };

  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      userEmail: booking.user?.email || "",
      courtId: booking.court?.id || "",
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      note: booking.note || "",
    });
    setShowEditModal(true);
    setShowDetailsModal(false);
  };

  const handleDeleteBooking = async () => {
    if (!canDelete) {
      alert("Bạn không có quyền xóa đặt sân");
      return;
    }
    if (!selectedBooking) return;
    if (!confirm("Bạn có chắc chắn muốn xóa đặt sân này?")) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/bookings/${selectedBooking.id}`);
      if (res.data) {
        alert("Xóa đặt sân thành công");
        setShowDetailsModal(false);
        fetchBookings();
      } else alert("Lỗi: " + res.error);
    } catch (err) { alert("Có lỗi xảy ra"); }
    setDeleting(false);
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
    setCurrentDate(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return nextMonth;
    });
    setSelectedDate(null);
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString("sv-SE");
    return bookings.filter(b => b.date === dateStr);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản Lý Đặt Sân</h1>
          <p className="text-gray-500 mt-1">Lịch trình đặt sân của toàn hệ thống</p>
        </div>
        {canAdd && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <CalendarIcon className="w-5 h-5" />
            Đặt Sân Mới
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="bg-gray-50 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
            {generateCalendarDays().map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = new Date().toDateString() === day.toDateString();
              const dateBookings = getBookingsForDate(day);
              const isSelected = selectedDate?.toDateString() === day.toDateString();

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[120px] bg-white p-2 cursor-pointer transition-all hover:bg-blue-50/30",
                    !isCurrentMonth && "bg-gray-50/50 grayscale-[0.5]",
                    isSelected && "ring-2 ring-primary ring-inset z-10 bg-blue-50/50"
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                      isToday ? "bg-primary text-white font-bold" : "text-gray-700",
                      !isCurrentMonth && "text-gray-400"
                    )}>
                      {day.getDate()}
                    </span>
                    {dateBookings.length > 0 && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                        {dateBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dateBookings.slice(0, 3).map((b) => (
                      <div 
                        key={b.id}
                        className={cn(
                          "text-[10px] px-1.5 py-1 rounded border truncate font-medium",
                          statusColors[b.status]?.bg,
                          statusColors[b.status]?.text,
                          statusColors[b.status]?.border
                        )}
                      >
                        {b.startTime}-{b.endTime} | {b.court?.courtName}
                      </div>
                    ))}
                    {dateBookings.length > 3 && (
                      <div className="text-[9px] text-gray-400 font-medium pl-1">
                        + {dateBookings.length - 3} lịch khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Lịch Ngày {selectedDate ? selectedDate.getDate() : new Date().getDate()}
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {selectedDate ? (
              getBookingsForDate(selectedDate).length > 0 ? (
                [...getBookingsForDate(selectedDate)].sort((a,b) => (a.startTime || "").localeCompare(b.startTime || "")).map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); }}
                    className="group p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-primary/30 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {b.startTime} - {b.endTime}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                        statusColors[b.status]?.bg,
                        statusColors[b.status]?.text
                      )}>
                        {statusLabels[b.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="flex items-center gap-1.5 font-medium"><MapPin className="w-3 h-3" /> {b.court?.courtName}</p>
                      <p className="truncate flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> {b.customerName || b.user?.fullName || "N/A"}</p>
                      <p className="truncate flex items-center gap-1.5"><Phone className="w-3 h-3" /> {b.customerPhone || b.user?.phone || "N/A"}</p>
                      <p className="truncate flex items-center gap-1.5"><Mail className="w-3 h-3" /> {b.user?.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Không có lịch đặt</p>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-12">Chọn một ngày để xem chi tiết</p>
            )}
          </div>
        </div>
      </div>

      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Chi Tiết Đặt Sân</h3>
                <p className="text-gray-400 text-xs mt-1 lowercase">ID: {selectedBooking.id}</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thời Gian</p>
                      <p className="text-lg font-bold text-gray-800">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                      <p className="text-sm text-gray-500 font-medium">
                        {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString('vi-VN') : "---"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sân Pickleball</p>
                      <p className="text-lg font-bold text-gray-800">{selectedBooking?.court?.courtName || "N/A"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Khách Hàng</p>
                      <p className="text-sm font-bold text-gray-800 break-all">{selectedBooking?.customerName || selectedBooking?.user?.fullName || "N/A"}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedBooking?.customerPhone || selectedBooking?.user?.phone || "N/A"}</p>
                      <p className="text-xs text-gray-500 mt-1 break-all">{selectedBooking?.user?.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng Thanh Toán</p>
                      <p className="text-lg font-bold text-green-700">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.totalAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedBooking.note && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3">
                  <StickyNote className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ghi chú</p>
                    <p className="text-sm text-gray-600 italic">"{selectedBooking.note}"</p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <div className="flex gap-2">
                  {canEdit && (
                    <button 
                      onClick={() => handleEditClick(selectedBooking)}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold"
                    >
                      <Pencil className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  )}
                  <div className="flex items-center gap-3 ml-4">
                    <p className="text-sm font-bold text-gray-500 uppercase">Trạng Thái:</p>
                    <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-extrabold uppercase",
                          selectedBooking.status && statusColors[selectedBooking.status] ? statusColors[selectedBooking.status].bg : "bg-gray-100",
                          selectedBooking.status && statusColors[selectedBooking.status] ? statusColors[selectedBooking.status].text : "text-gray-800",
                          "border",
                          selectedBooking.status && statusColors[selectedBooking.status] ? statusColors[selectedBooking.status].border : "border-gray-300"
                    )}>
                      {selectedBooking.status ? (statusLabels[selectedBooking.status] || selectedBooking.status) : "N/A"}
                    </span>
                  </div>
                </div>
                {canDelete && (
                  <button 
                    disabled={deleting}
                    onClick={handleDeleteBooking}
                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-3 rounded-2xl transition-all duration-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <EditBookingModal 
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateBooking}
        formData={formData}
        setFormData={setFormData}
        courts={courts}
        loading={updating}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-primary p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold">Đặt Sân Hộ Khách</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateBooking} className="p-8 space-y-6">
              <div className="space-y-4">
                <input 
                  type="email" placeholder="Email khách hàng" required
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={formData.userEmail} onChange={e => setFormData({...formData, userEmail: e.target.value})}
                />
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm appearance-none"
                  value={formData.courtId} onChange={e => setFormData({...formData, courtId: e.target.value})}
                >
                  <option value="">Chọn sân</option>
                  {courts.map(c => <option key={c.id} value={c.id}>{c.courtName}</option>)}
                </select>
                <input 
                  type="date" required
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Giờ bắt đầu</label>
                    <input 
                      type="time" required
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Giờ kết thúc</label>
                    <input 
                      type="time" required
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <textarea 
                  placeholder="Ghi chú (tùy chọn)"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm h-24"
                  value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit" disabled={creating}
                className="w-full bg-primary text-white p-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
              >
                {creating ? "Đang xử lý..." : "Xác nhận đặt sân"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;

// Helper component for the Edit Modal
const EditBookingModal = ({ 
  show, 
  onClose, 
  onSave, 
  formData, 
  setFormData, 
  courts, 
  loading 
}: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <h3 className="text-xl font-bold">Chỉnh Sửa Đặt Sân</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={onSave} className="p-8 space-y-4">
          <div className="space-y-4">
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Trạng thái</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none mt-1"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  {Object.entries(statusLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
             </div>
             
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Sân</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mt-1"
                  value={formData.courtId} onChange={e => setFormData({...formData, courtId: e.target.value})}
                >
                  <option value="">-- Chọn sân --</option>
                  {courts.map((c: any) => <option key={c.id} value={c.id}>{c.courtName}</option>)}
                </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Giờ bắt đầu</label>
                  <input 
                    type="time" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mt-1"
                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Giờ kết thúc</label>
                  <input 
                    type="time" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mt-1"
                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ghi chú</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 mt-1"
                  value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}
                ></textarea>
             </div>
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Cập nhật thông tin"}
          </button>
        </form>
      </div>
    </div>
  );
};
