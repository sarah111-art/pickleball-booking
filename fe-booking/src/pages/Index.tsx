import Hero from "@/components/Hero";
import CourtCard from "@/components/CourtCard";
import PricingSection from "@/components/PricingSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import court1 from "@/assets/court-1.jpg";
import court2 from "@/assets/court-2.jpg";
import court3 from "@/assets/court-3.jpg";

const Index = () => {
  const courts = [
    {
      name: "Sân Premium 1",
      image: court1,
      location: "Quận 1, TP.HCM",
      capacity: "4-8 người",
      price: "200.000đ",
      available: true,
    },
    {
      name: "Sân Ngoài Trời",
      image: court2,
      location: "Quận 7, TP.HCM",
      capacity: "4-8 người",
      price: "180.000đ",
      available: true,
    },
    {
      name: "Sân VIP",
      image: court3,
      location: "Quận 3, TP.HCM",
      capacity: "4-8 người + chỗ ngồi",
      price: "250.000đ",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Courts Section */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Hệ Thống Sân</h2>
            <p className="text-lg text-muted-foreground">Chọn sân phù hợp với nhu cầu của bạn</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {courts.map((court, index) => (
              <CourtCard key={index} {...court} />
            ))}
          </div>
        </div>
      </section>

      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
