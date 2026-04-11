import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Calendar, MapPin, Clock, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingDetail {
  id: string;
  courtName: string;
  venueName: string;
  date: string;
  timeSlots: Array<{ start: string; end: string; price: number }>;
  courtTotal: number;
  productTotal: number;
  rentalTotal: number;
  grandTotal: number;
  paymentPercentage: 50 | 100;
  depositAmount: number;
  status: string;
  qrUrl?: string;
  total?: string;
  courtPrice?: string;
  productPrice?: string;
  rentalPrice?: string;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [isBanking, setIsBanking] = useState(false);

  const bankAccount = "0010000000355";
  const bankName = "Vietcombank";
  const accountName = "Pickleball Booking";

  useEffect(() => {
    if (!bookingId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin booking",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadBooking();
  }, [bookingId]);

  // Polling for payment status
  useEffect(() => {
    if (paymentStatus === "paid" || !bookingId) return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId, paymentStatus]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.get<BookingDetail>(`/bookings/${bookingId}`);

      if (error) throw new Error(error);
        if (data) {
          // Flatten data from API to match Interface
          const formattedBooking: BookingDetail = {
            id: data.id,
            courtName: (data as any).court?.courtName || "N/A",
            venueName: (data as any).court?.address || "N/A", // Venue info might be in court
            date: data.date,
            timeSlots: (data as any).slot ? [{ start: (data as any).slot.start, end: (data as any).slot.end, price: parseFloat(data.total ?? "0") }] : [],
            courtTotal: parseFloat(data.courtPrice || "0"),
            productTotal: parseFloat(data.productPrice || "0"),
            rentalTotal: parseFloat(data.rentalPrice || "0"),
            grandTotal: parseFloat(data.total || "0"),
            paymentPercentage: data.paymentPercentage || 100,
            depositAmount: Math.round((parseFloat(data.total || "0") * (data.paymentPercentage || 100)) / 100),
            status: data.status,
          };
          setBooking(formattedBooking);
          // Check if already paid
          if (data.status === "paid" || data.status === "confirmed") {
            setPaymentStatus("paid");
            toast({
              title: "Thanh toán thành công!",
              description: "Chào mừng bạn quay lại. Đang chuyển hướng đến danh sách đơn đặt...",
            });
            setTimeout(() => {
              navigate("/my-bookings");
            }, 2500);
          }
        }
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tải thông tin booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const { data, error } = await api.post<{ verified: boolean; booking: BookingDetail }>(
        "/payments/verify",
        { bookingId }
      );

      if (error) return;

      if (data?.verified && (data.booking.status === "paid" || data.booking.status === "confirmed")) {
        // Flatten nested data from verification response as well
        const b = data.booking as any;
        const formattedBooking: BookingDetail = {
          id: b.id,
          courtName: b.court?.courtName || "N/A",
          venueName: b.court?.address || "N/A",
          date: b.date,
          timeSlots: b.slot ? [{ start: b.slot.start, end: b.slot.end, price: parseFloat(b.total) }] : [],
          courtTotal: parseFloat(b.courtPrice || "0"),
          productTotal: parseFloat(b.productPrice || "0"),
          rentalTotal: parseFloat(b.rentalPrice || "0"),
          grandTotal: parseFloat(b.total || "0"),
          paymentPercentage: b.paymentPercentage || 100,
          depositAmount: Math.round((parseFloat(b.total || "0") * (b.paymentPercentage || 100)) / 100),
          status: b.status,
        };
        setBooking(formattedBooking);
        setPaymentStatus("paid");
        toast({
          title: "Thanh toán thành công!",
          description: "Booking của bạn đã được xác nhận. Đang chuyển hướng...",
        });

        // Redirect to my-bookings after 2 seconds
        setTimeout(() => {
          navigate("/my-bookings");
        }, 2000);
      }
    } catch (err) {
      // Silent fail for polling
    }
  };

  const generateSePayQRUrl = () => {
    if (!booking) return "";
    const description = `Dat san pickleball ${booking.courtName}`;
    const encodedDesc = encodeURIComponent(description);
    return `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${booking.depositAmount}&des=${encodedDesc}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Không tìm thấy thông tin booking</p>
                <Button onClick={() => navigate("/")} size="lg">
                  Về trang chủ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Pending state - show QR code for payment
  if (paymentStatus === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Thanh Toán Chờ Xác Nhận</h1>
              <p className="text-muted-foreground">
                Vui lòng quét mã QR dưới đây để hoàn tất thanh toán
              </p>
            </div>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-border mb-6">
                  <img
                    src={generateSePayQRUrl()}
                    alt="SePay QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.error("QR Code Error:", img.src);
                      toast({
                        title: "Lỗi tải mã QR",
                        description: "Không thể tạo mã QR thanh toán. Vui lòng thử lại.",
                        variant: "destructive"
                      });
                    }}
                  />
                </div>

                <div className="space-y-1 mb-6">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Số tiền cần thanh toán
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(booking.depositAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Thanh toán {booking.paymentPercentage}% tổng giá trị đơn hàng
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-primary font-medium animate-pulse mb-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang chờ hệ thống xác nhận giao dịch...
                </div>

                <div className="w-full bg-background/50 rounded-lg p-4 text-left text-xs text-muted-foreground border border-dashed border-primary/30">
                  <p className="font-medium mb-1 text-foreground">💡 Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dùng ứng dụng Ngân hàng/Ví điện tử để quét mã QR.</li>
                    <li>Nội dung chuyển khoản đã được đính kèm tự động.</li>
                    <li>Hệ thống sẽ cập nhật sau 1-3 phút khi nhận được tiền.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4 flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => checkPaymentStatus()}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Kiểm tra lại ngay
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Hủy và quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state - after payment completed
  if (paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="max-w-2xl mx-auto">
            {/* Success Banner */}
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="py-8 sm:py-12 text-center">
                <CheckCircle2 className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">
                  Thanh Toán Thành Công!
                </h1>
                <p className="text-green-700 text-base sm:text-lg">
                  Booking của bạn đã được xác nhận
                </p>
                <p className="text-sm sm:text-base text-green-600 mt-2">
                  Mã booking: <span className="font-mono font-bold">{bookingId}</span>
                </p>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Chi Tiết Đặt Sân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Venue & Court */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-muted-foreground">Địa điểm</div>
                      <div className="font-medium">{booking.venueName}</div>
                      <div className="text-sm text-muted-foreground">{booking.courtName}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-muted-foreground">Ngày đặt</div>
                      <div className="font-medium">{formatDate(booking.date)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-muted-foreground">Khung giờ</div>
                      <div className="space-y-1">
                        {booking.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                            <span className="ml-4 font-medium">{formatPrice(slot.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing Summary */}
                <div className="space-y-3">
                  {booking.courtTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sân:</span>
                      <span>{formatPrice(booking.courtTotal)}</span>
                    </div>
                  )}
                  {booking.productTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sản phẩm:</span>
                      <span>{formatPrice(booking.productTotal)}</span>
                    </div>
                  )}
                  {booking.rentalTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vợt thuê:</span>
                      <span>{formatPrice(booking.rentalTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Tổng tiền:</span>
                    <span className="text-primary">{formatPrice(booking.grandTotal)}</span>
                  </div>
                </div>

                <Separator />

                {/* Payment Status */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-blue-900 mb-2">Thông tin thanh toán</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Thanh toán:</span>
                          <span className="font-semibold text-blue-900">
                            {booking.paymentPercentage}% = {formatPrice(booking.depositAmount)}
                          </span>
                        </div>
                        {booking.paymentPercentage === 50 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Còn lại:</span>
                              <span className="font-semibold text-blue-900">
                                50% = {formatPrice(booking.grandTotal - booking.depositAmount)}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 pt-2 border-t border-blue-200">
                              💡 Số tiền còn lại sẽ được thanh toán khi bạn đến sân
                            </p>
                          </>
                        )}
                        {booking.paymentPercentage === 100 && (
                          <p className="text-xs text-blue-600 pt-2 border-t border-blue-200">
                            ✓ Toàn bộ thanh toán đã được hoàn tất
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Trạng thái:</span>
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Đã xác nhận - Thanh toán {booking.paymentPercentage}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="mb-6 bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Bước Tiếp Theo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.paymentPercentage === 50 ? (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">Đến sân đúng giờ</p>
                        <p className="text-sm text-amber-700">
                          Vui lòng đến sân trước 10 phút và chuẩn bị sẵn sàng
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">Thanh toán số tiền còn lại</p>
                        <p className="text-sm text-amber-700">
                          Thanh toán {formatPrice(booking.grandTotal - booking.depositAmount)} khi đến sân
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Tất cả thanh toán đã hoàn tất</p>
                      <p className="text-sm text-green-700">
                        Chỉ cần đến sân đúng giờ để chơi
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Về trang chủ
              </Button>
              <Button
                onClick={() => navigate("/my-bookings")}
                size="lg"
                className="flex-1"
              >
                Xem các booking của tôi
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending state - waiting for payment
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Thanh Toán Đặt Cọc</h1>

          {/* Payment Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Thông tin booking</span>
                <Badge variant="secondary">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Chờ thanh toán
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Sân</div>
                <div className="font-medium">{booking.courtName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ngày</div>
                <div className="font-medium">
                  {formatDate(booking.date)}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tổng tiền:</span>
                  <span className="font-medium">{formatPrice(booking.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Thanh toán ({booking.paymentPercentage}%):</span>
                  <span className="font-semibold text-primary">{formatPrice(booking.depositAmount)}</span>
                </div>
                {booking.paymentPercentage === 50 && (
                  <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Còn lại (thanh toán tại sân):</span>
                    <span>{formatPrice(booking.grandTotal - booking.depositAmount)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code & Payment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quét mã QR để thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Info */}
              <div className="space-y-3">
                <div className="text-sm font-medium mb-3">Thông tin tài khoản:</div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm space-y-1">
                  <div>Số tài khoản: <span className="font-mono font-semibold">{bankAccount}</span></div>
                  <div>Ngân hàng: <span className="font-semibold">{bankName}</span></div>
                  <div>Chủ tài khoản: <span className="font-semibold">{accountName}</span></div>
                  <div className="pt-2 border-t border-blue-200">
                    Số tiền: <span className="font-bold text-blue-900">{formatPrice(booking.depositAmount)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* QR Code */}
              <div className="flex justify-center bg-white p-4 rounded-lg border border-muted">
                <img
                  src={generateSePayQRUrl()}
                  alt="SePay QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-2">Hướng dẫn thanh toán:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-inside">
                  <li>1. Mở ứng dụng ngân hàng hoặc mobile banking trên điện thoại</li>
                  <li>2. Quét mã QR code ở trên</li>
                  <li>3. Xác nhận thanh toán số tiền {formatPrice(booking.depositAmount)}</li>
                  <li>4. Hệ thống sẽ tự động xác nhận sau khi thanh toán thành công</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  ⏱️ Trang này sẽ tự động cập nhật khi thanh toán được xác nhận
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => checkPaymentStatus()}
              variant="outline"
              size="lg"
              disabled={isBanking}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isBanking ? "animate-spin" : ""}`} />
              Kiểm tra lại trạng thái
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
