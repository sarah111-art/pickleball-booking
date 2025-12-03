import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CourtCard from "@/components/CourtCard";
import PricingSection from "@/components/PricingSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

// Fallback images
import court1 from "@/assets/court-1.jpg";
import court2 from "@/assets/court-2.jpg";
import court3 from "@/assets/court-3.jpg";

const fallbackImages = [court1, court2, court3];

interface Court {
  id: string;
  courtName: string;
  surfaceType?: string;
  pricePerHour: number;
  isActive: boolean;
  imageUrl?: string;
  venue?: {
    id: string;
    name: string;
    district?: string;
    city?: string;
  };
}

const Index = () => {
  const { data: courts, isLoading } = useQuery({
    queryKey: ["courts-home"],
    queryFn: async () => {
      const { data, error } = await api.get<Court[]>("/courts");
      if (error) throw new Error(error);
      return data || [];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Hero />
      
        {/* Courts Section */}
        <section className="py-12 sm:py-20 bg-background">
          <div className="container px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Hệ Thống Sân</h2>
              <p className="text-base sm:text-lg text-muted-foreground">Chọn sân phù hợp với nhu cầu của bạn</p>
            </div>
            
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg overflow-hidden border">
                    <Skeleton className="h-48 sm:h-64 w-full" />
                    <div className="p-4 sm:p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-10 w-full mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courts && courts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                {courts.slice(0, 6).map((court, index) => (
                  <CourtCard
                    key={court.id}
                    id={court.id}
                    name={court.courtName}
                    image={court.imageUrl || fallbackImages[index % fallbackImages.length]}
                    location={court.venue ? `${court.venue.district || ''}, ${court.venue.city || 'TP.HCM'}` : 'TP.HCM'}
                    venueName={court.venue?.name}
                    venueId={court.venue?.id}
                    capacity={court.surfaceType || "Sân tiêu chuẩn"}
                    price={formatPrice(court.pricePerHour)}
                    available={court.isActive}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Chưa có sân nào trong hệ thống</p>
              </div>
            )}
          </div>
        </section>

        <FeaturesSection />
        <PricingSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
