import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, CreditCard } from "lucide-react";
import type { BookingData } from "@/pages/Booking";

interface BookingSummaryProps {
  bookingData: BookingData;
  onConfirm: () => void;
}

const BookingSummary = ({ bookingData, onConfirm }: BookingSummaryProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Xác Nhận Đặt Sân</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chi Tiết Đặt Sân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Địa điểm</div>
                <div className="text-muted-foreground">{bookingData.venueName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Sân</div>
                <div className="text-muted-foreground">{bookingData.courtName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Ngày</div>
                <div className="text-muted-foreground">{formatDate(bookingData.date)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Khung giờ</div>
                <div className="text-muted-foreground space-y-1">
                  {bookingData.timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </span>
                      <span className="ml-4">{formatPrice(slot.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-base">
              <span>Tổng tiền:</span>
              <span className="font-semibold">{formatPrice(bookingData.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span>Đặt cọc (50%):</span>
              <span className="font-semibold text-primary">
                {formatPrice(bookingData.totalAmount * 0.5)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <div className="font-medium mb-1">Thanh toán</div>
                <div className="text-muted-foreground">
                  Bạn cần thanh toán 50% tổng tiền đặt cọc để xác nhận booking. Số tiền còn lại sẽ
                  được thanh toán khi đến sân.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button onClick={onConfirm} size="lg" className="min-w-[200px]">
          Xác nhận đặt sân
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;
