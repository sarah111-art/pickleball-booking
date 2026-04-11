import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CourtCard from "@/components/CourtCard";
import PricingSection from "@/components/PricingSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface Racket {
  id: string;
  name: string;
  brand?: string;
  type: "beginner" | "intermediate" | "professional";
  price: number;
  image?: string;
  stock: number;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  createdAt: string;
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

  const { data: rackets, isLoading: racketsLoading } = useQuery({
    queryKey: ["rackets-home"],
    queryFn: async () => {
      const { data, error } = await api.get<Racket[]>("/rackets");
      if (error) throw new Error(error);
      return (data || []).filter((racket) => racket.stock > 0).slice(0, 3);
    },
  });

  const { data: featuredPosts, isLoading: featuredPostsLoading } = useQuery({
    queryKey: ["featured-posts-home"],
    queryFn: async () => {
      const { data, error } = await api.get<BlogPost[]>("/blog-posts?published=true&featured=true&limit=3");
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

        {/* Featured News Section */}
        <section className="py-12 sm:py-16 bg-background">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Tin Tức Nổi Bật</h2>
                <p className="text-muted-foreground">Mẹo chơi, kỹ thuật và cập nhật mới nhất cho người chơi Pickleball</p>
              </div>
              <Link to="/news">
                <Button variant="outline">Xem tất cả</Button>
              </Link>
            </div>

            {featuredPostsLoading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg overflow-hidden border bg-background">
                    <Skeleton className="h-44 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredPosts && featuredPosts.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <article key={post.id} className="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
                    {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold line-clamp-2 mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.excerpt || 'Xem chi tiết bài viết nổi bật.'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                        <Link to={`/news/${post.slug}`} className="text-sm text-primary font-semibold hover:underline">Đọc tiếp</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Chưa có bài viết nổi bật.</p>
            )}
          </div>
        </section>

        {/* Featured Rackets Section */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Vợt Đang Bán</h2>
                <p className="text-muted-foreground">Khám phá nhanh 3 mẫu vợt nổi bật cho bạn</p>
              </div>
              <Link to="/rackets">
                <Button variant="outline">Xem tất cả</Button>
              </Link>
            </div>

            {racketsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg overflow-hidden border bg-background">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rackets && rackets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rackets.map((racket) => (
                  <Card key={racket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="w-full h-52 bg-muted/50 border-b flex items-center justify-center overflow-hidden">
                      <img
                        src={racket.image || "https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=800"}
                        alt={racket.name}
                        className="w-full h-full object-contain p-3"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-1">{racket.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{racket.brand || "Pickleball"}</p>
                      <p className="font-bold text-primary">{formatPrice(racket.price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">Hiện chưa có vợt đang bán</div>
            )}

            <div className="mt-8 text-center">
              <Link to="/rackets">
                <Button size="lg">Xem tất cả vợt</Button>
              </Link>
            </div>
          </div>
        </section>

        <PricingSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
