import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import VenueSelection from "@/components/booking/VenueSelection";
import CourtDateSelection from "@/components/booking/CourtDateSelection";
import TimeSlotSelection from "@/components/booking/TimeSlotSelection";
import ProductSelection from "@/components/booking/ProductSelection";
import RacketRentalSelection from "@/components/booking/RacketRentalSelection";
import BookingSummary from "@/components/booking/BookingSummary";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface BookingData {
  venueId: string | null;
  venueName: string | null;
  courtId: string | null;
  courtName: string | null;
  customerName: string;
  customerPhone: string;
  date: Date | null;
  timeSlots: Array<{ start: string; end: string; price: number }>;
  selectedProducts?: Array<any>;
  selectedRentals?: Array<any>;
  paymentPercentage: 50 | 100;
  totalAmount: number;
}

interface LocationState {
  courtId?: string;
  courtName?: string;
  venueId?: string;
  venueName?: string;
}

const Booking = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    venueId: null,
    venueName: null,
    courtId: null,
    selectedProducts: [],
    selectedRentals: [],
    paymentPercentage: 50,
    courtName: null,
    customerName: "",
    customerPhone: "",
    date: null,
    timeSlots: [],
    totalAmount: 0,
  });
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize booking data from navigation state
  useEffect(() => {
    if (state && !initialized) {
      const hasCourtData = state.courtId && state.venueId;
      const hasVenueData = state.venueId;
      
      if (hasCourtData) {
        setBookingData(prev => ({
          ...prev,
          courtId: state.courtId || null,
          courtName: state.courtName || null,
          venueId: state.venueId || null,
          venueName: state.venueName || null,
        }));
        // Skip to date selection step (step 2) since we already have venue and court
        setCurrentStep(2);
      } else if (hasVenueData) {
        setBookingData(prev => ({
          ...prev,
          venueId: state.venueId || null,
          venueName: state.venueName || null,
          courtId: null,
          courtName: null,
        }));
        // Skip venue selection because chatbot already picked a location
        setCurrentStep(2);
      }
      setInitialized(true);
    }
  }, [state, initialized]);

  useEffect(() => {
    const hydrateProfileIfLoggedIn = async () => {
      if (!auth.isAuthenticated()) {
        return;
      }

      const { data } = await auth.getProfile();
      if (!data) {
        auth.logout();
        return;
      }

      setUser(data);
      setBookingData((prev) => ({
        ...prev,
        customerName: prev.customerName || data.fullName || "",
        customerPhone: prev.customerPhone || data.phone || "",
      }));
    };

    hydrateProfileIfLoggedIn();
  }, []);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as BookingStep);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as BookingStep);
    }
  };

  const handleBookingComplete = async () => {
    try {
      if (!bookingData.venueId || !bookingData.courtId || !bookingData.date || bookingData.timeSlots.length === 0) {
        throw new Error("Thiếu thông tin đặt sân");
      }
      if (!bookingData.customerName.trim() || !bookingData.customerPhone.trim()) {
        throw new Error("Vui lòng nhập tên và số điện thoại liên hệ");
      }

      const courtTotal = bookingData.timeSlots.reduce((sum, slot) => sum + slot.price, 0);
      const productTotal = bookingData.selectedProducts?.reduce(
        (sum, p) => (sum || 0) + (p.price || 0) * (p.quantity || 1),
        0
      ) || 0;
      const rentalTotal = bookingData.selectedRentals?.reduce(
        (sum, r) => (sum || 0) + (r.rentalPrice || 0) * (r.quantity || 1),
        0
      ) || 0;
      const grandTotal = courtTotal + productTotal + rentalTotal;
      const depositAmount = Math.round((grandTotal * (bookingData.paymentPercentage || 100)) / 100);

      const slot = bookingData.timeSlots[0];
      
      const { data, error } = await api.post<{ id: string }>("/bookings", {
        courtId: bookingData.courtId,
        date: bookingData.date!.toLocaleDateString("sv-SE"),
        startTime: slot.start,
        endTime: slot.end,
        paymentMethod: "qr",
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        paymentPercentage: bookingData.paymentPercentage,
        totalAmount: grandTotal,
        depositAmount: depositAmount,
        selectedProducts: bookingData.selectedProducts || [],
        selectedRentals: bookingData.selectedRentals || [],
        note: `Đặt sân từ ${slot.start} đến ${slot.end}`,
      });

      if (error) throw new Error(error);

      if (data?.id) {
        navigate(`/payment-success?bookingId=${data.id}`);
      } else {
        throw new Error("Không nhận được ID booking");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast({
        title: "Lỗi đặt sân",
        description: message,
        variant: "destructive",
      });
    }
  };

  const stepLabels = ["Địa điểm", "Sân & Ngày", "Giờ", "Sản phẩm", "Vợt thuê", "Xác nhận"];

  // Determine if we should show court info banner
  const showCourtBanner = bookingData.courtId && bookingData.courtName && currentStep === 2;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              onClick={() => currentStep === 1 ? navigate("/") : goToPreviousStep()}
              className="mb-3 sm:mb-4 -ml-2"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Đặt Sân Pickleball</h1>
            
            {/* Show selected court banner */}
            {showCourtBanner && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 mb-4">
                <p className="text-sm text-muted-foreground">Đang đặt sân:</p>
                <p className="font-semibold text-primary">{bookingData.courtName}</p>
                {bookingData.venueName && (
                  <p className="text-sm text-muted-foreground">{bookingData.venueName}</p>
                )}
              </div>
            )}
            
            {/* Progress indicator */}
            <div className="mb-6">
              {/* Progress bar */}
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div key={step} className="flex-1">
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-colors ${
                        step <= currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  </div>
                ))}
              </div>
              {/* Step labels - hidden on very small screens */}
              <div className="hidden xs:flex justify-between text-xs sm:text-sm text-muted-foreground">
                {stepLabels.map((label, index) => (
                  <span
                    key={label}
                    className={`${index + 1 <= currentStep ? "text-primary font-medium" : ""}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              {/* Current step label - shown on very small screens */}
              <p className="xs:hidden text-sm text-primary font-medium">
                Bước {currentStep}: {stepLabels[currentStep - 1]}
              </p>
            </div>
          </div>

          {currentStep === 1 && (
            <VenueSelection
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 2 && (
            <CourtDateSelection
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 3 && (
            <TimeSlotSelection
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 4 && (
            <ProductSelection
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 5 && (
            <RacketRentalSelection
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 6 && (
            <BookingSummary
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onConfirm={handleBookingComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
