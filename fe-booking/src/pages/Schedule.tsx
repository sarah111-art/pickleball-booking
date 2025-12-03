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

interface TimeSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  isBooked: boolean;
  court: {
    id: string;
    courtName: string;
    venueId: string;
    venue?: {
      id: string;
      name: string;
      district: string | null;
    };
  };
}

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await api.get<Venue[]>("/venues");
      if (error) throw new Error(error);
      return data || [];
    },
  });

  const { data: courtSlots } = useQuery({
    queryKey: ["court-slots", selectedDate, selectedVenue],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const dateStr = selectedDate.toISOString().split("T")[0];
      const url = selectedVenue !== "all" 
        ? `/timeslots?date=${dateStr}&venueId=${selectedVenue}`
        : `/timeslots?date=${dateStr}`;
      
      const { data, error } = await api.get<TimeSlot[]>(url);
      if (error) throw new Error(error);
      return data || [];
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
                        {courtSlots && courtSlots.length > 0 ? (
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
                                    {slot.start.slice(0, 5)} - {slot.end.slice(0, 5)}
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
