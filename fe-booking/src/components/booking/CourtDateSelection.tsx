import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingData } from "@/pages/Booking";

interface CourtDateSelectionProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface Court {
  id: string;
  courtName: string;
  surfaceType: string | null;
  isActive: boolean;
}

const CourtDateSelection = ({ bookingData, updateBookingData, onNext }: CourtDateSelectionProps) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(bookingData.courtId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(bookingData.date || undefined);
  const [showValidation, setShowValidation] = useState(false);

  // Check if court was pre-selected (from CourtCard click)
  const hasPreselectedCourt = !!bookingData.courtId;

  const fetchCourts = useCallback(async () => {
    try {
      const { data, error } = await api.get<Court[]>(`/locations/${bookingData.venueId}/courts`);

      if (error) throw new Error(error);
      setCourts(data?.filter(c => c.isActive) || []);
    } catch (error) {
      console.error("Error fetching courts:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingData.venueId]);

  useEffect(() => {
    if (bookingData.venueId && !hasPreselectedCourt) {
      fetchCourts();
    } else {
      setLoading(false);
    }
  }, [bookingData.venueId, hasPreselectedCourt, fetchCourts]);

  const handleSelectCourt = (court: Court) => {
    setSelectedCourtId(court.id);
    updateBookingData({
      courtId: court.id,
      courtName: court.courtName,
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    updateBookingData({ date: date || null });
  };

  const handleNext = () => {
    if (selectedCourtId && selectedDate) {
      onNext();
      setShowValidation(false);
    } else {
      setShowValidation(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        {hasPreselectedCourt ? "Chọn Ngày Đặt Sân" : "Chọn Sân và Ngày"}
      </h2>

      <div className="space-y-6 sm:space-y-8">
        {/* Only show court selection if not pre-selected */}
        {!hasPreselectedCourt && (
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Chọn Sân</h3>
            {courts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Không có sân nào khả dụng tại địa điểm này.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2 sm:gap-3">
                {courts.map((court) => (
                  <Card
                    key={court.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedCourtId === court.id && "ring-2 ring-primary shadow-md"
                    )}
                    onClick={() => handleSelectCourt(court)}
                  >
                    <CardHeader className="py-3 sm:py-4 px-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base sm:text-lg">{court.courtName}</CardTitle>
                          {court.surfaceType && (
                            <CardDescription className="mt-1 text-xs sm:text-sm">
                              Loại mặt sân: {court.surfaceType}
                            </CardDescription>
                          )}
                        </div>
                        {selectedCourtId === court.id && (
                          <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg
                              className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Chọn Ngày</h3>
          <Card className="border-2 border-primary/20 overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-lg sm:text-xl">Lịch Đặt Sân</CardTitle>
              {selectedCourtId && bookingData.courtName && (
                <CardDescription className="text-sm mt-1">
                  Sân: <span className="font-medium text-foreground">{bookingData.courtName}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-6 sm:pt-8 px-3 sm:px-6 pb-6 sm:pb-8">
              <div className="rounded-xl border bg-background shadow-sm">
                <Calendar
                  mode="single"
                  defaultMonth={selectedDate ?? new Date()}
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="w-full rounded-lg"
                />
              </div>
              {selectedDate && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Ngày được chọn:</p>
                  <p className="text-lg font-semibold text-primary">
                    {selectedDate.toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showValidation && (
        <div className="mt-5 sm:mt-6 space-y-2 sm:space-y-3">
          {!selectedCourtId && !hasPreselectedCourt && (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
              <span className="text-sm sm:text-base text-red-700 font-medium">Bạn vui lòng chọn sân</span>
            </div>
          )}
          {!selectedDate && (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
              <span className="text-sm sm:text-base text-red-700 font-medium">Bạn vui lòng chọn ngày đặt sân</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6 sm:mt-8">
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full sm:w-auto"
        >
          Tiếp theo
        </Button>
      </div>
    </div>
  );
};

export default CourtDateSelection;
