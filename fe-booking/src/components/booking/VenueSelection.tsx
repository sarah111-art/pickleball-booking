import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import type { BookingData } from "@/pages/Booking";

interface VenueSelectionProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface Venue {
  id: string;
  name: string;
  address: string | null;
  mapUrl?: string;
}

const VenueSelection = ({ bookingData, updateBookingData, onNext }: VenueSelectionProps) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(bookingData.venueId);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await api.get<Venue[]>("/locations");

      if (error) throw new Error(error);
      setVenues(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    updateBookingData({
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const handleNext = () => {
    if (selectedVenueId) {
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
      <h2 className="text-2xl font-semibold mb-6">Chọn Địa Điểm</h2>
      
      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có địa điểm nào. Vui lòng quay lại sau.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 mb-6">
          {venues.map((venue) => (
            <Card
              key={venue.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedVenueId === venue.id
                  ? "ring-2 ring-primary shadow-lg"
                  : ""
              }`}
              onClick={() => handleSelectVenue(venue)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{venue.name}</span>
                  {selectedVenueId === venue.id && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-primary-foreground"
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {venue.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{venue.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!selectedVenueId}
          size="lg"
        >
          Tiếp theo
        </Button>
      </div>
    </div>
  );
};

export default VenueSelection;
