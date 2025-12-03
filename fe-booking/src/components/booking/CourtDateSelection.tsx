import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

  // Check if court was pre-selected (from CourtCard click)
  const hasPreselectedCourt = !!bookingData.courtId;

  useEffect(() => {
    if (bookingData.venueId && !hasPreselectedCourt) {
      fetchCourts();
    } else {
      setLoading(false);
    }
  }, [bookingData.venueId, hasPreselectedCourt]);

  const fetchCourts = async () => {
    try {
      const { data, error } = await api.get<Court[]>(`/venues/${bookingData.venueId}/courts`);

      if (error) throw new Error(error);
      setCourts(data?.filter(c => c.isActive) || []);
    } catch (error) {
      console.error("Error fetching courts:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className={cn("pointer-events-auto mx-auto")}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end mt-6 sm:mt-8">
        <Button
          onClick={handleNext}
          disabled={!selectedCourtId || !selectedDate}
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
