import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTimeStr = (minutes: number) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

interface SlotCell {
  start: string; // e.g. "06:00"
  end: string;   // e.g. "06:30"
  isBooked: boolean;
}

const TimeSlotSelection = ({ bookingData, updateBookingData, onNext }: TimeSlotSelectionProps) => {
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [pricePerHour, setPricePerHour] = useState<number>(150000);
  const [loading, setLoading] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHourDay[]>(DEFAULT_BUSINESS_HOURS);

  // Selection: anchor = first click index, tail = second click index
  const [anchorIdx, setAnchorIdx] = useState<number | null>(null);
  const [tailIdx, setTailIdx]     = useState<number | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingData.courtId && bookingData.date) {
      fetchAvailability();
    }
  }, [bookingData.courtId, bookingData.date]);

  // Reset selection when date/court changes
  useEffect(() => {
    setAnchorIdx(null);
    setTailIdx(null);
    setRangeError(null);
  }, [bookingData.courtId, bookingData.date]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
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
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const selectedWeekday = bookingData.date ? bookingData.date.getDay() : -1;
  const selectedBusinessDay = businessHours.find((d) => d.day === selectedWeekday) ?? null;
  const isClosedDay = !selectedBusinessDay || !selectedBusinessDay.enabled;

  // Build slot cells
  const slotCells: SlotCell[] = (() => {
    if (!selectedBusinessDay || !selectedBusinessDay.enabled) return [];
    const openMin  = toMinutes(selectedBusinessDay.open);
    const closeMin = toMinutes(selectedBusinessDay.close);
    const cells: SlotCell[] = [];
    for (let min = openMin; min < closeMin; min += 30) {
      const start = toTimeStr(min);
      const end   = toTimeStr(min + 30);
      const isBooked = bookedSlots.some(
        (b) => start < b.end && end > b.start
      );
      cells.push({ start, end, isBooked });
    }
    return cells;
  })();

  const hasBlockedInRange = (from: number, to: number) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    for (let i = lo; i <= hi; i++) {
      if (slotCells[i]?.isBooked) return true;
    }
    return false;
  };

  const handleCellClick = (idx: number) => {
    const cell = slotCells[idx];
    if (cell.isBooked) return;
    setRangeError(null);

    if (anchorIdx === null) {
      // First click
      setAnchorIdx(idx);
      setTailIdx(null);
      return;
    }

    if (anchorIdx === idx) {
      // Deselect
      setAnchorIdx(null);
      setTailIdx(null);
      return;
    }

    // Second click – validate range
    const lo = Math.min(anchorIdx, idx);
    const hi = Math.max(anchorIdx, idx);

    if (hasBlockedInRange(lo, hi)) {
      setRangeError("Khoảng giờ bạn chọn có chứa khung đã bị đặt. Vui lòng chọn khoảng trống liên tiếp.");
      return;
    }

    setAnchorIdx(lo);
    setTailIdx(hi);
  };

  // Derived selection times
  const selStart = anchorIdx !== null ? slotCells[anchorIdx]?.start ?? null : null;
  const selEnd   = tailIdx   !== null ? slotCells[tailIdx]?.end     ?? null
                 : anchorIdx !== null ? slotCells[anchorIdx]?.end  ?? null : null;

  const duration = selStart && selEnd ? (toMinutes(selEnd) - toMinutes(selStart)) / 60 : 0;
  const total    = Math.round(duration * pricePerHour);

  const getCellState = (idx: number): "booked" | "selected" | "anchor" | "available" => {
    const cell = slotCells[idx];
    if (cell.isBooked) return "booked";
    if (anchorIdx === null) return "available";
    const lo = tailIdx !== null ? Math.min(anchorIdx, tailIdx) : anchorIdx;
    const hi = tailIdx !== null ? Math.max(anchorIdx, tailIdx) : anchorIdx;
    if (idx >= lo && idx <= hi) return idx === lo || idx === hi ? "anchor" : "selected";
    return "available";
  };

  const handleNext = () => {
    if (!selStart || !selEnd || selStart >= selEnd) return;
    updateBookingData({
      timeSlots: [{ start: selStart, end: selEnd, price: total }],
      totalAmount: total,
    });
    onNext();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold">Chọn Giờ Đặt Sân</h2>

      {/* Court & date info banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6 px-4 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bookingData.courtName && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sân đang chọn</p>
                <p className="text-lg font-bold text-primary">{bookingData.courtName}</p>
              </div>
            )}
            {bookingData.date && (
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ngày chơi</p>
                <p className="text-lg font-bold text-primary">
                  {bookingData.date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-7 rounded border border-slate-200 bg-white" />
          Còn trống
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-7 rounded border border-red-200 bg-red-100" />
          Đã đặt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-7 rounded border border-primary bg-primary" />
          Đang chọn
        </span>
      </div>

      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        {anchorIdx === null
          ? "Nhấn vào ô trắng để chọn giờ bắt đầu."
          : tailIdx === null
          ? "Nhấn thêm một ô để chọn giờ kết thúc. Nhấn lại ô đã chọn để bỏ."
          : `Đã chọn ${selStart} – ${selEnd}. Nhấn "Tiếp tục" hoặc chọn lại.`}
      </p>

      {rangeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {rangeError}
        </div>
      )}

      {/* Closed day notice */}
      {isClosedDay ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-8 text-center text-orange-700 font-medium">
          Sân không hoạt động vào ngày này.
        </div>
      ) : (
        <>
          {/* Time slot grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {slotCells.map((cell, idx) => {
              const state = getCellState(idx);
              const isAnchorOrTail = state === "anchor";
              return (
                <button
                  key={cell.start}
                  type="button"
                  disabled={cell.isBooked}
                  onClick={() => handleCellClick(idx)}
                  title={cell.isBooked ? "Đã được đặt" : `${cell.start} – ${cell.end}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 text-center transition-all select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    state === "booked" && "cursor-not-allowed border-red-100 bg-red-50 text-red-400",
                    state === "available" && "cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-primary/50 hover:bg-primary/5",
                    state === "selected" && "cursor-pointer border-primary/40 bg-primary/20 text-primary font-semibold",
                    isAnchorOrTail && "cursor-pointer border-primary bg-primary text-white font-bold shadow-md shadow-primary/25",
                  )}
                >
                  <span className="text-[11px] leading-tight font-semibold">{cell.start}</span>
                  {state === "booked" && (
                    <span className="mt-0.5 text-[9px] leading-none font-bold uppercase tracking-wide text-red-300">Đầy</span>
                  )}
                  {(state === "anchor" || state === "selected") && (
                    <span className="mt-0.5 text-[9px] leading-none font-bold uppercase tracking-wide opacity-70">
                      {isAnchorOrTail ? "●" : "—"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hour labels hint */}
          {selectedBusinessDay && (
            <p className="text-xs text-muted-foreground">
              Giờ hoạt động hôm nay: {selectedBusinessDay.open} – {selectedBusinessDay.close} · Mỗi ô = 30 phút
            </p>
          )}
        </>
      )}

      {/* Summary card */}
      {duration > 0 && (
        <Card className="border-primary/50 bg-primary/5 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex justify-between items-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Tóm tắt
              </span>
              <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                {pricePerHour.toLocaleString("vi-VN")}đ/h
              </span>
            </div>
            <div className="p-5 flex flex-col sm:flex-row justify-between items-center gap-5">
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Khung giờ</p>
                <p className="text-2xl font-black text-foreground">{selStart} – {selEnd}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{duration} tiếng</p>
              </div>
              <div className="hidden sm:block h-12 w-px bg-primary/20" />
              <div className="text-center sm:text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Tạm tính</p>
                <p className="text-3xl font-black text-primary">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={handleNext}
          disabled={isClosedDay || !selStart || !selEnd || selStart >= selEnd}
          className="w-full sm:w-auto h-14 px-10 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Tiếp tục đặt sân
        </Button>
      </div>
    </div>
  );
};

export default TimeSlotSelection;
