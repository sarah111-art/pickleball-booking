import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock3, ImageIcon, MapPin, MessageSquareText, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

import court1 from "@/assets/court-1.jpg";
import court2 from "@/assets/court-2.jpg";
import court3 from "@/assets/court-3.jpg";

const fallbackImages = [court1, court2, court3];

interface CourtDetailData {
  id: string;
  courtName: string;
  surfaceType?: string;
  description?: string;
  pricePerHour: number;
  images?: string[] | null;
  isActive: boolean;
  address?: string | null;
  district?: string | null;
  ward?: string | null;
  province?: string | null;
  venueId?: string | null;
  venue?: {
    id: string;
    name: string;
    address?: string | null;
    district?: string | null;
    city?: string | null;
  };
}

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName?: string;
    email?: string;
  };
}

const CourtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: court, isLoading: isCourtLoading, isError: isCourtError } = useQuery({
    queryKey: ["court-detail", id],
    queryFn: async () => {
      const { data, error } = await api.get<CourtDetailData>(`/courts/${id}`);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["court-reviews", id],
    queryFn: async () => {
      const { data, error } = await api.get<ReviewItem[]>(`/reviews/court/${id}`);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!id,
  });

  const galleryImages = useMemo(() => {
    if (court?.images?.length) {
      return court.images;
    }

    return fallbackImages;
  }, [court?.images]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const formattedLocation = [
    court?.address || court?.venue?.address,
    court?.ward,
    court?.district || court?.venue?.district,
    court?.province || court?.venue?.city,
  ]
    .filter(Boolean)
    .join(", ");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price || 0));
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  if (isCourtLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16">
          <div className="container px-4 py-8 space-y-6">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-[420px] w-full rounded-3xl" />
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <Skeleton className="h-[360px] w-full rounded-3xl" />
              <Skeleton className="h-[360px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCourtError || !court) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16">
          <div className="container px-4 py-20">
            <Card className="mx-auto max-w-2xl border-dashed">
              <CardContent className="py-14 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Không tìm thấy sân</h1>
                <p className="mt-3 text-muted-foreground">
                  Sân này không còn tồn tại hoặc dữ liệu chưa sẵn sàng.
                </p>
                <Button className="mt-6" onClick={() => navigate("/")}>Quay về trang chủ</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="border-b bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.03),rgba(15,23,42,0))]">
          <div className="container px-4 py-8 sm:py-10">
            <Button variant="ghost" className="mb-5 -ml-3 gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>

            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-[28px] border bg-muted/30">
                  <img
                    src={galleryImages[selectedImage] || fallbackImages[0]}
                    alt={court.courtName}
                    className="h-[280px] w-full object-cover sm:h-[420px]"
                  />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <Badge variant={court.isActive ? "default" : "secondary"}>
                      {court.isActive ? "Đang nhận đặt sân" : "Tạm ngưng nhận đặt"}
                    </Badge>
                    {court.surfaceType ? <Badge variant="outline">{court.surfaceType}</Badge> : null}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`overflow-hidden rounded-2xl border transition ${
                        selectedImage === index ? "border-primary ring-2 ring-primary/30" : "border-border"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${court.courtName} ${index + 1}`}
                        className="h-20 w-full object-cover sm:h-24"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5 rounded-[28px] border bg-card p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
                    Chi tiết sân
                  </p>
                  <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{court.courtName}</h1>
                  <p className="mt-2 text-base text-muted-foreground">
                    {court.description || "Sân được bố trí cho trải nghiệm chơi ổn định, phù hợp cả tập luyện lẫn thi đấu phong trào."}
                  </p>
                </div>

                <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-background p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Giá thuê</div>
                    <div className="mt-2 text-2xl font-bold text-primary">{formatPrice(court.pricePerHour)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Mỗi giờ chơi</div>
                  </div>
                  <div className="rounded-2xl bg-background p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Đánh giá trung bình</div>
                    <div className="mt-2 flex items-center gap-2 text-2xl font-bold">
                      <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      {reviews.length ? averageRating.toFixed(1) : "Chưa có"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{reviews.length} lượt đánh giá</div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{court.venue?.name || "Cụm sân pickleball"}</div>
                      <div>{formattedLocation || "Địa chỉ đang được cập nhật"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div>Phù hợp cho đặt sân linh hoạt theo khung giờ 30 phút.</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquareText className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div>Xem trải nghiệm thật từ người đã chơi ngay bên dưới.</div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() =>
                      navigate("/booking", {
                        state: {
                          courtId: court.id,
                          courtName: court.courtName,
                          venueId: court.venue?.id || court.venueId,
                          venueName: court.venue?.name || formattedLocation,
                        },
                      })
                    }
                    disabled={!court.isActive || !(court.venue?.id || court.venueId)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Đặt sân ngay
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/schedule")}>
                    Xem lịch trống
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
                  Review trải nghiệm
                </p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Người chơi nói gì về sân này</h2>
              </div>
              {reviews.length ? (
                <div className="rounded-full border px-4 py-2 text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} / 5 từ {reviews.length} đánh giá
                </div>
              ) : null}
            </div>

            {isReviewsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-44 w-full rounded-3xl" />
                ))}
              </div>
            ) : reviews.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reviews.map((review) => (
                  <Card key={review.id} className="h-full rounded-[28px] border bg-card/80">
                    <CardContent className="flex h-full flex-col gap-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-foreground">
                            {review.user?.fullName || review.user?.email || "Khách đã trải nghiệm"}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">{formatDate(review.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {review.rating}/5
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {review.comment || "Người chơi đã hài lòng và chấm điểm cho sân này."}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-[28px] border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <MessageSquareText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">Chưa có đánh giá nào</h3>
                  <p className="mt-2 text-muted-foreground">
                    Hãy là người đầu tiên chia sẻ trải nghiệm của bạn sau khi chơi tại sân này.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default CourtDetail;