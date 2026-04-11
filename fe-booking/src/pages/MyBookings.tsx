import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { auth, type User } from "@/lib/auth";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, CreditCard, CheckCircle2, XCircle, Loader2, Receipt, MessageSquarePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface BookingWithDetails {
  id: string;
  status: string;
  total: number;
  date: string;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  court: {
    id: string;
    courtName: string;
    venue?: {
      id: string;
      name: string;
      address: string | null;
      district: string | null;
    };
  };
  slot?: {
    id: string;
    date: string;
    start: string;
    end: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  user?: {
    id: string;
  };
}

const MyBookings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBooking, setActiveBooking] = useState<BookingWithDetails | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.isAuthenticated()) {
        navigate("/auth");
        return;
      }

      const { data } = await auth.getProfile();
      if (data) {
        setUser(data);
      } else {
        navigate("/auth");
      }
    };

    checkAuth();
  }, [navigate]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      if (!auth.isAuthenticated()) return [];
      
      const { data, error } = await api.get<BookingWithDetails[]>("/bookings/my");
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user && auth.isAuthenticated(),
  });

  const { data: reviewsByCourt = {} } = useQuery({
    queryKey: ["my-booking-reviews", bookings?.map((booking) => booking.court?.id).filter(Boolean).join(",")],
    queryFn: async () => {
      const courtIds = Array.from(new Set((bookings || []).map((booking) => booking.court?.id).filter(Boolean)));
      const entries = await Promise.all(
        courtIds.map(async (courtId) => {
          const { data, error } = await api.get<Review[]>(`/reviews/court/${courtId}`);
          if (error) {
            return [courtId, []] as const;
          }
          return [courtId, data || []] as const;
        }),
      );

      return Object.fromEntries(entries) as Record<string, Review[]>;
    },
    enabled: !!bookings?.length,
  });

  const createReview = useMutation({
    mutationFn: async (payload: { courtId: string; rating: number; comment: string }) => {
      const { data, error } = await api.post<Review>("/reviews", payload);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-booking-reviews"] });
      toast({
        title: "Đã gửi đánh giá",
        description: "Cảm ơn bạn đã chia sẻ trải nghiệm đặt sân.",
      });
      setActiveBooking(null);
      setRating(5);
      setComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Không thể gửi đánh giá",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const reviewedCourtIds = useMemo(() => {
    if (!user) return new Set<string>();

    return new Set(
      Object.entries(reviewsByCourt)
        .filter(([, reviews]) => reviews.some((review) => String(review.user?.id) === String(user.id)))
        .map(([courtId]) => courtId),
    );
  }, [reviewsByCourt, user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const canReviewBooking = (booking: BookingWithDetails) => {
    if (!booking.court?.id) return false;
    if (booking.status === "cancelled") return false;

    const bookingEnd = new Date(`${booking.date}T${booking.endTime || booking.slot?.end || "00:00:00"}`);
    return bookingEnd.getTime() <= Date.now();
  };

  const hasReviewedBookingCourt = (booking: BookingWithDetails) => {
    return reviewedCourtIds.has(booking.court?.id);
  };

  const handleOpenReview = (booking: BookingWithDetails) => {
    setActiveBooking(booking);
    setRating(5);
    setComment("");
  };

  const handleSubmitReview = async () => {
    if (!activeBooking?.court?.id) return;

    await createReview.mutateAsync({
      courtId: activeBooking.court.id,
      rating,
      comment: comment.trim(),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    };

    const labels: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      cancelled: "Đã hủy",
      completed: "Hoàn thành",
    };

    const icons: Record<string, ReactNode> = {
      pending: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
      confirmed: <CheckCircle2 className="h-3 w-3 mr-1" />,
      cancelled: <XCircle className="h-3 w-3 mr-1" />,
      completed: <CheckCircle2 className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <Dialog open={!!activeBooking} onOpenChange={(open) => !open && setActiveBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đánh giá sân</DialogTitle>
              <DialogDescription>
                {activeBooking
                  ? `Chia sẻ trải nghiệm của bạn tại ${activeBooking.court?.courtName || "sân này"}.`
                  : "Chia sẻ trải nghiệm của bạn sau khi chơi."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-medium">Mức đánh giá</div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="transition-transform hover:scale-110"
                      aria-label={`Chấm ${value} sao`}
                    >
                      <Star
                        className={cn(
                          "h-7 w-7",
                          value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground">{rating}/5 sao</span>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Nhận xét</div>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Sân có dễ tìm không, mặt sân thế nào, phục vụ ra sao..."
                  rows={5}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveBooking(null)}>
                Để sau
              </Button>
              <Button onClick={handleSubmitReview} disabled={createReview.isPending}>
                {createReview.isPending ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* <section className="py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="container px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
              Lịch Sử Đặt Sân
            </h1>
            <p className="text-lg text-center text-muted-foreground">
              Quản lý các booking của bạn
            </p>
          </div>
        </section> */}

        <section>
        <section className="py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="container px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
              Lịch Sử Đặt Sân
            </h2>
            <p className="text-lg text-center text-muted-foreground">
              Quản lý các booking của bạn
            </p>
          </div>
        </section>
          <div className="container px-4 pt-4 pb-16">
            {isLoading ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-6 max-w-5xl mx-auto">
                {bookings.map((booking) => (
                  <Card 
                    key={booking.id} 
                    className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold">
                                Booking #{booking.id.substring(0, 8).toUpperCase()}
                              </CardTitle>
                              <div className="text-sm text-muted-foreground mt-1">
                                Đặt lúc: {new Date(booking.createdAt).toLocaleString("vi-VN")}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </CardHeader>
                    </div>

                    <CardContent className="p-6 space-y-6">
                      {/* Venue Info */}
                      {booking.court?.venue && (
                        <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg mb-1">
                              {booking.court.venue.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {[booking.court.venue.address, booking.court.venue.district].filter(Boolean).join(", ") || "Chưa có địa chỉ"}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Booking Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          Chi tiết đặt sân
                        </div>
                        <div className="ml-2">
                          <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="font-bold text-lg">{booking.court?.courtName || "Sân chưa xác định"}</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  {booking.slot?.date || booking.date ? (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" />
                                      {formatDate(booking.slot?.date || booking.date)}
                                    </div>
                                  ) : null}
                                  {(booking.startTime || booking.slot?.start) && (booking.endTime || booking.slot?.end) ? (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-4 w-4" />
                                      {formatTime(booking.startTime || booking.slot?.start || "00:00")} - {formatTime(booking.endTime || booking.slot?.end || "00:00")}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Tổng tiền</div>
                                <div className="text-2xl font-bold text-primary">
                                  {formatPrice(booking.total)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="pt-4 border-t">
                        <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="font-semibold text-base mb-2">Tóm tắt thanh toán</div>
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <span className="text-sm font-medium">Tổng tiền:</span>
                                <span className="font-bold text-base">
                                  {formatPrice(booking.total)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <span className="text-sm font-medium">Đặt cọc (50%):</span>
                                <span className="font-bold text-base text-primary">
                                  {formatPrice(booking.total * 0.5)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium">Thanh toán tại sân:</span>
                                <span className="font-bold text-base">
                                  {formatPrice(booking.total * 0.5)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {canReviewBooking(booking) ? (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-transparent p-4">
                            <div>
                              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                                <MessageSquarePlus className="h-4 w-4 text-amber-600" />
                                Đánh giá trải nghiệm sân
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {hasReviewedBookingCourt(booking)
                                  ? "Bạn đã gửi đánh giá cho sân này."
                                  : "Sau khi chơi xong, bạn có thể để lại nhận xét để giúp người khác chọn sân phù hợp."}
                              </div>
                            </div>
                            <Button
                              variant={hasReviewedBookingCourt(booking) ? "outline" : "default"}
                              onClick={() => handleOpenReview(booking)}
                              disabled={hasReviewedBookingCourt(booking)}
                            >
                              {hasReviewedBookingCourt(booking) ? "Đã đánh giá" : "Đánh giá ngay"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="max-w-md mx-auto border-2 border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Chưa có booking nào</h3>
                  <p className="text-muted-foreground mb-8 text-base">
                    Bạn chưa đặt sân nào. Hãy bắt đầu đặt sân ngay để trải nghiệm dịch vụ của chúng tôi!
                  </p>
                  <Button
                    onClick={() => navigate("/booking")}
                    size="lg"
                    className="px-8"
                  >
                    Đặt sân ngay
                  </Button>
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

export default MyBookings;
