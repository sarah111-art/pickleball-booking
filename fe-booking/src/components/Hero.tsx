import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import heroImage from "@/assets/hero-pickleball.jpg";

interface HeroSettings {
  heroTitle?: string;
  heroHighlight?: string;
  heroDescription?: string;
  heroImageUrl?: string;
}

const Hero = () => {
  const [heroSettings, setHeroSettings] = useState<HeroSettings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.get<HeroSettings>("/settings");
      if (data) {
        setHeroSettings(data);
      }
    };
    fetchSettings();
  }, []);

  const heroTitle = heroSettings.heroTitle || "Đặt Sân Pickleball";
  const heroHighlight = heroSettings.heroHighlight || "Nhanh Chóng & Dễ Dàng";
  const heroDescription =
    heroSettings.heroDescription ||
    "Pickleball hiện đại nhất Việt Nam. Đặt sân online 24/7, giá cả minh bạch, dịch vụ chuyên nghiệp.";
  const heroBackground = heroSettings.heroImageUrl || heroImage;

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBackground}
          alt="Sân Pickleball chuyên nghiệp" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {heroTitle}
            <br />
            <span className="text-secondary">{heroHighlight}</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-95 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            {heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <Link to="/booking" className="w-full sm:w-[260px]">
              <Button size="lg" variant="secondary" className="w-full justify-center text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Calendar className="mr-2" />
                Đặt Sân Ngay
              </Button>
            </Link>
            <Link to="/schedule" className="w-full sm:w-[260px]">
              <Button size="lg" variant="outline" className="w-full justify-center text-lg px-8 py-6 bg-background/10 backdrop-blur-sm border-2 border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all">
                <Clock className="mr-2" />
                Xem Giá & Lịch
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
