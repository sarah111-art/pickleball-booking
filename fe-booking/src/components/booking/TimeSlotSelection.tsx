import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BookingData } from "@/pages/Booking";

interface TimeSlotSelectionProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface BookedSlot {
  start: string;
  end: string;
}

interface BusinessHourDay {
  day: number;
  label: string;
  open: string;
  close: string;
  enabled: boolean;
}

interface SettingsData {
  businessHours?: BusinessHourDay[];
}

const DEFAULT_BUSINESS_HOURS: BusinessHourDay[] = [
  { day: 0, label: "Chủ nhật", open: "06:00", close: "22:00", enabled: true },
  { day: 1, label: "Thứ 2", open: "06:00", close: "22:00", enabled: true },
  { day: 2, label: "Thứ 3", open: "06:00", close: "22:00", enabled: true },
  { day: 3, label: "Thứ 4", open: "06:00", close: "22:00", enabled: true },
  { day: 4, label: "Thứ 5", open: "06:00", close: "22:00", enabled: true },
  { day: 5, label: "Thứ 6", open: "06:00", close: "22:00", enabled: true },
  { day: 6, label: "Thứ 7", open: "06:00", close: "22:00", enabled: true },
];

const TimeSlotSelection = ({ bookingData, updateBookingData, onNext }: TimeSlotSelectionProps) => {
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [pricePerHour, setPricePerHour] = useState<number>(150000);
  const [loading, setLoading] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHourDay[]>(DEFAULT_BUSINESS_HOURS);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  useEffect(() => {
    if (bookingData.courtId && bookingData.date) {
      fetchAvailability();
    }
  }, [bookingData.courtId, bookingData.date]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      // Dùng toLocaleDateString("sv-SE") thay vì toISOString() để tránh bị lệch timezone
      const dateStr = bookingData.date!.toLocaleDateString("sv-SE");
      const { data, error } = await api.get<{ pricePerHour: number; bookedSlots: BookedSlot[] }>(
        `/bookings/availability?courtId=${bookingData.courtId}&date=${dateStr}`
      );

      if (error) throw new Error(error);

      if (data) {
        setPricePerHour(Number(data.pricePerHour) || 150000);
        setBookedSlots(data.bookedSlots || []);
      }

      const settingsRes = await api.get<SettingsData>("/settings");
      if (settingsRes.data?.businessHours && settingsRes.data.businessHours.length === 7) {
        setBusinessHours(settingsRes.data.businessHours);
      } else {
        setBusinessHours(DEFAULT_BUSINESS_HOURS);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const selectedWeekday = bookingData.date ? bookingData.date.getDay() : -1;
  const selectedBusinessDay = businessHours.find((d) => d.day === selectedWeekday) || null;
  const isClosedDay = !selectedBusinessDay || !selectedBusinessDay.enabled;

  const generateBoundaryOptions = () => {
    if (!selectedBusinessDay || !selectedBusinessDay.enabled) return [];
    const open = toMinutes(selectedBusinessDay.open);
    const close = toMinutes(selectedBusinessDay.close);
    const options: string[] = [];
    for (let minute = open; minute <= close; minute += 30) {
      const hour = Math.floor(minute / 60)
        .toString()
        .padStart(2, "0");
      const min = (minute % 60).toString().padStart(2, "0");
      options.push(`${hour}:${min}`);
    }
    return options;
  };

  const boundaryOptions = generateBoundaryOptions();
  const startOptions = boundaryOptions.slice(0, -1);

  useEffect(() => {
    if (!startTime || !endTime) return;
    if (!startOptions.includes(startTime) || !boundaryOptions.includes(endTime)) {
      setStartTime("");
      setEndTime("");
    }
  }, [selectedWeekday, businessHours]);

  const isTimeBooked = (time: string) => {
    return bookedSlots.some(slot => time >= slot.start && time < slot.end);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start >= end) return 0;
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = end.split(":").map(Number);
    return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  };

  const calculateTotal = (start: string, end: string) => {
    const hours = calculateDuration(start, end);
    return Math.round(hours * pricePerHour);
  };

  const handleNext = () => {
    if (startTime && endTime && startTime < endTime) {
      const hasOverlap = bookedSlots.some(slot => 
        (startTime < slot.end && endTime > slot.start)
      );

      if (hasOverlap) {
        alert("Khung giờ bạn chọn đã bị trùng với lịch đặt khác. Vui lòng chọn lại.");
        return;
      }

      const total = calculateTotal(startTime, endTime);
      updateBookingData({
        timeSlots: [{ start: startTime, end: endTime, price: total }],
        totalAmount: total
      });
      onNext();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTotal = calculateTotal(startTime, endTime);
  const currentDuration = calculateDuration(startTime, endTime);

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Chọn Giờ Đặt Sân</h2>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bookingData.courtName && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sân đang chọn</p>
                <p className="text-lg font-bold text-primary">{bookingData.courtName}</p>
              </div>
            )}
            {bookingData.date && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">Ngày chơi</p>
                <p className="text-lg font-bold text-primary text-right">
                  {bookingData.date.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Giờ bắt đầu
          </label>
          <Select value={startTime} onValueChange={(val) => {
            setStartTime(val);
            if (endTime && val >= endTime) setEndTime("");
          }} disabled={isClosedDay}>
            <SelectTrigger className="h-12 text-lg font-bold border-2 focus:ring-primary/50 transition-all shadow-sm">
              <SelectValue placeholder={isClosedDay ? "Ngày này đang đóng cửa" : "Bắt đầu từ..."} />
            </SelectTrigger>
            <SelectContent>
              {startOptions.map((time) => {
                const booked = isTimeBooked(time);
                return (
                  <SelectItem key={`start-${time}`} value={time} disabled={booked} className="py-3 font-semibold">
                    {time} {booked ? "(🔴 Đã đầy)" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Giờ kết thúc
          </label>
          <Select value={endTime} onValueChange={setEndTime} disabled={!startTime || isClosedDay}>
            <SelectTrigger className="h-12 text-lg font-bold border-2 focus:ring-primary/50 transition-all text-primary shadow-sm">
              <SelectValue placeholder={isClosedDay ? "Ngày này đang đóng cửa" : (startTime ? "Kết thúc lúc..." : "Chọn giờ bắt đầu trước")} />
            </SelectTrigger>
            <SelectContent>
              {boundaryOptions.filter(t => !startTime || t > startTime).map((time) => {
                const isBlocked = bookedSlots.some(slot => slot.start > startTime && slot.start < time);
                return (
                  <SelectItem key={`end-${time}`} value={time} disabled={isBlocked} className="py-3 font-semibold text-primary">
                    {time} {isBlocked ? "(⚠️ Đã có lịch khác)" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookedSlots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lịch đã bận hôm nay:</p>
          <div className="flex flex-wrap gap-2">
            {bookedSlots.map((slot, i) => (
              <div key={i} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100 uppercase">
                {slot.start} - {slot.end}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBusinessDay && (
        <p className="text-xs text-muted-foreground font-semibold">
          Giờ hoạt động hôm nay: {selectedBusinessDay.enabled ? `${selectedBusinessDay.open} - ${selectedBusinessDay.close}` : "Đóng cửa"}
        </p>
      )}

      {currentTotal > 0 && (
        <Card className="border-primary/50 bg-primary/5 overflow-hidden shadow-inner">
          <CardContent className="p-0">
            <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex justify-between items-center">
              <span className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-tighter">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Tóm tắt thời gian & giá
              </span>
              <span className="text-[10px] font-black text-primary/70 uppercase tracking-tighter">
                Đơn giá: {pricePerHour.toLocaleString('vi-VN')}đ/h
              </span>
            </div>
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Tổng thời lượng</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-foreground tabular-nums tracking-tighter">{currentDuration}</span>
                  <span className="text-xl font-bold text-muted-foreground uppercase">Giờ</span>
                </div>
              </div>
              
              <div className="hidden sm:block h-16 w-px bg-primary/20" />

              <div className="text-center sm:text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Thành tiền tạm tính</p>
                <p className="text-4xl font-black text-primary tabular-nums tracking-tighter">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(currentTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-6">
        <Button 
          size="lg" 
          onClick={handleNext} 
          disabled={isClosedDay || !startTime || !endTime || startTime >= endTime}
          className="w-full sm:w-auto h-14 px-10 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Tiếp tục đặt sân
        </Button>
      </div>
    </div>
  );
};

export default TimeSlotSelection;
