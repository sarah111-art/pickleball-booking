import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentData {
  id: string;
  qrUrl: string;
  paymentUrl?: string;
  status: 'pending' | 'paid' | 'failed';
  providerOrderId?: string;
  booking: {
    id: string;
    total: number;
    date: string;
    court: {
      courtName: string;
    };
  };
}

const Payment = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

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

    loadPayment();
    
    // Poll payment status every 5 seconds
    const interval = setInterval(() => {
      if (payment?.status === 'pending') {
        checkPaymentStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.get<PaymentData>(`/payments/qr/${bookingId}`);
      
      if (error) throw new Error(error);
      
      if (data) {
        setPayment(data);
        if (data.status === 'paid') {
          handlePaymentSuccess();
        }
      }
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tải thông tin thanh toán",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentLink = () => {
    if (payment?.paymentUrl) {
      // Open VNPay payment URL in new window
      window.open(payment.paymentUrl, '_blank');
    } else if (payment?.qrUrl) {
      // Fallback: try to extract URL from QR code
      toast({
        title: "Thông báo",
        description: "Vui lòng quét mã QR để thanh toán",
      });
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const { data, error } = await api.post<{ verified: boolean; payment: PaymentData }>('/payments/verify', {
        bookingId,
      });

      if (error) return;

      if (data?.verified && data.payment.status === 'paid') {
        setPayment(data.payment);
        handlePaymentSuccess();
      } else if (data?.payment) {
        setPayment(data.payment);
      }
    } catch (err) {
      // Silent fail for polling
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Thanh toán thành công!",
      description: "Booking của bạn đã được xác nhận",
    });
    
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const depositAmount = payment ? Math.round(payment.booking.total * 0.5) : 0;

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

  if (!payment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">Không tìm thấy thông tin thanh toán</p>
                <Button onClick={() => navigate("/")} className="mt-4">
                  Về trang chủ
                </Button>
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
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Thanh Toán Đặt Cọc</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Thông tin booking</span>
                <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'}>
                  {payment.status === 'paid' ? 'Đã thanh toán' : payment.status === 'failed' ? 'Thất bại' : 'Chờ thanh toán'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Sân</div>
                <div className="font-medium">{payment.booking.court.courtName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ngày</div>
                <div className="font-medium">
                  {new Date(payment.booking.date).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tổng tiền:</span>
                  <span className="font-medium">{formatPrice(payment.booking.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Đặt cọc (50%):</span>
                  <span className="font-semibold text-primary">{formatPrice(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                  <span>Còn lại (thanh toán tại sân):</span>
                  <span>{formatPrice(payment.booking.total - depositAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {payment.status === 'paid' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Thanh toán thành công!</h2>
                <p className="text-muted-foreground mb-4">
                  Booking của bạn đã được xác nhận. Vui lòng thanh toán số tiền còn lại khi đến sân.
                </p>
                <Button onClick={() => navigate("/")}>Về trang chủ</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quét mã QR để thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  {payment.qrUrl ? (
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed">
                      <img 
                        src={payment.qrUrl} 
                        alt="QR Code" 
                        className="w-64 h-64 sm:w-80 sm:h-80"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 sm:w-80 sm:h-80 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Đang tạo QR code...</p>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Hướng dẫn:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Mở ứng dụng ngân hàng hoặc ví điện tử trên điện thoại</li>
                    <li>Quét mã QR code ở trên</li>
                    <li>Xác nhận thanh toán số tiền {formatPrice(depositAmount)}</li>
                    <li>Hệ thống sẽ tự động xác nhận sau khi thanh toán thành công</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleOpenPaymentLink}
                    className="w-full"
                    size="lg"
                  >
                    Thanh toán qua VNPay
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={checkPaymentStatus}
                      disabled={verifying}
                      className="flex-1"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang kiểm tra...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Kiểm tra thanh toán
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/")}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;

