import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Venue {
  id: string;
  name: string;
  district: string | null;
  address: string | null;
}

interface Court {
  id: string;
  courtName: string;
  venueId: string;
  isActive: boolean;
  venue?: {
    id: string;
    name: string;
    district: string | null;
  };
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  court?: {
    id: string;
  };
}

interface AvailableSlot {
  id: string;
  start: string;
  end: string;
  court: Court;
}

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const toTimeString = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const buildAvailableWindows = (bookedRanges: Array<{ start: string; end: string }>) => {
    const OPEN_MINUTE = 6 * 60;
    const CLOSE_MINUTE = 22 * 60;

    const normalized = bookedRanges
      .map((slot) => ({
        start: Math.max(OPEN_MINUTE, toMinutes(slot.start)),
        end: Math.min(CLOSE_MINUTE, toMinutes(slot.end)),
      }))
      .filter((slot) => slot.end > OPEN_MINUTE && slot.start < CLOSE_MINUTE)
      .sort((a, b) => a.start - b.start);

    const windows: Array<{ start: string; end: string }> = [];
    let cursor = OPEN_MINUTE;

    for (const slot of normalized) {
      if (slot.start > cursor) {
        windows.push({ start: toTimeString(cursor), end: toTimeString(slot.start) });
      }
      cursor = Math.max(cursor, slot.end);
    }

    if (cursor < CLOSE_MINUTE) {
      windows.push({ start: toTimeString(cursor), end: toTimeString(CLOSE_MINUTE) });
    }

    return windows.filter((window) => window.start < window.end);
  };

  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await api.get<Venue[]>("/venues");
      if (error) throw new Error(error);
      return data || [];
    },
  });

  const {
    data: courtSlots,
    isLoading: isSlotsLoading,
    error: slotsError,
  } = useQuery({
    queryKey: ["court-slots", selectedDate, selectedVenue],
    queryFn: async () => {
      if (!selectedDate) return [];

      const dateStr = selectedDate.toLocaleDateString("sv-SE");

      const courtsUrl =
        selectedVenue !== "all" ? `/courts?venueId=${selectedVenue}` : "/courts";

      const [courtsRes, bookingsRes] = await Promise.all([
        api.get<Court[]>(courtsUrl),
        api.get<Booking[]>(`/bookings?date=${dateStr}`),
      ]);

      if (courtsRes.error) throw new Error(courtsRes.error);
      if (bookingsRes.error) throw new Error(bookingsRes.error);

      const activeCourts = (courtsRes.data || []).filter((court) => court.isActive !== false);
      const occupiedBookings = (bookingsRes.data || []).filter(
        (booking) => booking.status !== "cancelled" && booking.court?.id,
      );

      const bookingsByCourt = occupiedBookings.reduce<Record<string, Array<{ start: string; end: string }>>>(
        (acc, booking) => {
          const courtId = booking.court!.id;
          if (!acc[courtId]) acc[courtId] = [];
          acc[courtId].push({ start: booking.startTime, end: booking.endTime });
          return acc;
        },
        {},
      );

      const available: AvailableSlot[] = [];

      for (const court of activeCourts) {
        const windows = buildAvailableWindows(bookingsByCourt[court.id] || []);
        windows.forEach((window) => {
          available.push({
            id: `${court.id}-${window.start}-${window.end}`,
            start: window.start,
            end: window.end,
            court,
          });
        });
      }

      return available;
    },
    enabled: !!selectedDate,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero Section */}
        {/* <section className="py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="container px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
              Giá & Lịch Đặt Sân
            </h1>
            <p className="text-lg text-center text-muted-foreground">
              Xem giá và kiểm tra lịch trống trực tuyến
            </p>
          </div>
        </section> */}

        <PricingSection />

        {/* Schedule Section */}
        <section className="py-20 bg-background">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Kiểm Tra Lịch Trống</h2>
              <p className="text-lg text-muted-foreground">Chọn ngày và địa điểm để xem các khung giờ còn trống</p>
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
              {/* Calendar Card */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Chọn Ngày</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </CardContent>
              </Card>

              {/* Available Slots Card */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Chọn Địa Điểm</CardTitle>
                  <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả địa điểm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả địa điểm</SelectItem>
                      {venues?.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} - {venue.district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {selectedDate ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          Ngày: {selectedDate.toLocaleDateString("vi-VN")}
                        </p>
                        {isSlotsLoading ? (
                          <p className="text-center text-muted-foreground py-8">Đang tải lịch trống...</p>
                        ) : slotsError ? (
                          <p className="text-center text-destructive py-8">
                            {(slotsError as Error).message || "Không tải được dữ liệu lịch trống"}
                          </p>
                        ) : courtSlots && courtSlots.length > 0 ? (
                          courtSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">{slot.court?.courtName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {slot.court?.venue?.name} - {slot.court?.venue?.district}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">
                                    {slot.start} - {slot.end}
                                  </p>
                                  <span className="text-xs text-accent">Còn trống</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            Không có khung giờ trống trong ngày này
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Vui lòng chọn ngày để xem lịch
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Schedule;
