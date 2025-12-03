import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingData } from "@/pages/Booking";

interface TimeSlotSelectionProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface TimeSlot {
  id?: string;
  start: string;
  end: string;
  price: number;
  isAvailable: boolean;
}

interface ApiTimeSlot {
  id: string;
  start: string;
  end: string;
  isBooked: boolean;
  court?: {
    pricePerHour?: number | string;
  };
}

type SlotApiResponse = ApiTimeSlot[] | { slots: ApiTimeSlot[] };

const TimeSlotSelection = ({ bookingData, updateBookingData, onNext }: TimeSlotSelectionProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<Array<{ start: string; end: string; price: number }>>(
    bookingData.timeSlots
  );

  useEffect(() => {
    if (bookingData.courtId && bookingData.date && bookingData.venueId) {
      fetchTimeSlots();
    }
  }, [bookingData.courtId, bookingData.date, bookingData.venueId]);

  const normalizeTime = (time: string) => (time.length === 5 ? time : time.substring(0, 5));

  const mapApiSlots = (apiSlots: ApiTimeSlot[]): TimeSlot[] => {
    return apiSlots.map((slot) => ({
      id: slot.id,
      start: normalizeTime(slot.start),
      end: normalizeTime(slot.end),
      price: Number(slot.court?.pricePerHour ?? 100000),
      isAvailable: !slot.isBooked,
    }));
  };

  const buildDefaultSlots = () => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 22; hour++) {
      const start = `${hour.toString().padStart(2, "0")}:00`;
      const end = `${(hour + 1).toString().padStart(2, "0")}:00`;
      slots.push({
        start,
        end,
        price: 100000,
        isAvailable: true,
      });
    }
    return slots;
  };

  const fetchTimeSlots = async () => {
    try {
      const dateStr = bookingData.date!.toISOString().split("T")[0];

      // Fetch available time slots from API
      const { data, error } = await api.get<SlotApiResponse>(
        `/courts/${bookingData.courtId}/slots?date=${dateStr}&venueId=${bookingData.venueId}`
      );

      if (error) throw new Error(error);

      let apiSlots: ApiTimeSlot[] = [];
      if (Array.isArray(data)) {
        apiSlots = data;
      } else if (data?.slots) {
        apiSlots = data.slots;
      }

      if (apiSlots.length > 0) {
        setTimeSlots(mapApiSlots(apiSlots));
      } else {
        setTimeSlots(buildDefaultSlots());
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots(buildDefaultSlots());
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;

    const isSelected = selectedSlots.some((s) => s.start === slot.start);
    
    let newSelectedSlots;
    if (isSelected) {
      newSelectedSlots = selectedSlots.filter((s) => s.start !== slot.start);
    } else {
      newSelectedSlots = [...selectedSlots, { start: slot.start, end: slot.end, price: slot.price }];
    }

    // Sort by start time
    newSelectedSlots.sort((a, b) => a.start.localeCompare(b.start));

    setSelectedSlots(newSelectedSlots);
    
    const totalAmount = newSelectedSlots.reduce((sum, s) => sum + s.price, 0);
    updateBookingData({ timeSlots: newSelectedSlots, totalAmount });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleNext = () => {
    if (selectedSlots.length > 0) {
      onNext();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-muted-foreground">Đang tải khung giờ...</div>
      </div>
    );
  }

  const totalAmount = selectedSlots.reduce((sum, s) => sum + s.price, 0);

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Chọn Khung Giờ</h2>

      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlots.some((s) => s.start === slot.start);
              return (
                <button
                  key={slot.start}
                  onClick={() => handleToggleSlot(slot)}
                  disabled={!slot.isAvailable}
                  className={cn(
                    "p-2.5 sm:p-4 rounded-lg border-2 transition-all text-left",
                    slot.isAvailable
                      ? isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                      : "border-border bg-muted/50 cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {slot.isAvailable ? formatPrice(slot.price) : "Đã đặt"}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedSlots.length > 0 && (
        <Card className="mb-4 sm:mb-6 bg-muted/50">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-medium text-sm sm:text-base">Đã chọn:</span>
              <Badge variant="secondary" className="text-xs sm:text-sm">{selectedSlots.length} khung giờ</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {selectedSlots.map((slot) => (
                <Badge key={slot.start} variant="outline" className="text-xs">
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </Badge>
              ))}
            </div>
            <div className="pt-3 sm:pt-4 border-t border-border">
              <div className="flex items-center justify-between text-base sm:text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={selectedSlots.length === 0} size="lg" className="w-full sm:w-auto">
          Tiếp theo
        </Button>
      </div>
    </div>
  );
};

export default TimeSlotSelection;
