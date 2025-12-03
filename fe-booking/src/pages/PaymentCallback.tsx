import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (bookingId) {
      // Verify payment status
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.post<{ verified: boolean }>('/payments/verify', {
        bookingId,
      });

      if (error) throw new Error(error);

      if (data?.verified) {
        setSuccess(true);
        toast({
          title: "Thanh toán thành công!",
          description: "Booking của bạn đã được xác nhận",
        });
      } else {
        setSuccess(false);
        toast({
          title: "Thanh toán chưa hoàn tất",
          description: "Vui lòng thử lại hoặc liên hệ hỗ trợ",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setSuccess(false);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xác minh thanh toán",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              {success ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Thanh toán thành công!</h2>
                  <p className="text-muted-foreground mb-4">
                    Booking của bạn đã được xác nhận. Vui lòng thanh toán số tiền còn lại khi đến sân.
                  </p>
                  <Button onClick={() => navigate("/")}>Về trang chủ</Button>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Thanh toán thất bại</h2>
                  <p className="text-muted-foreground mb-4">
                    Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => bookingId && navigate(`/payment?bookingId=${bookingId}`)}>
                      Thử lại
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Về trang chủ
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;

