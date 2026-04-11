import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, Package, Trophy } from "lucide-react";
import type { BookingData } from "@/pages/Booking";

interface BookingSummaryProps {
  bookingData: BookingData;
  updateBookingData?: (data: Partial<BookingData>) => void;
  onConfirm: () => void;
}

// SePay Configuration
const SEPAY_CONFIG = {
  accountNumber: "0010000000355",
  bankCode: "Vietcombank",
  accountName: "Pickleball Booking",
};

const BookingSummary = ({ bookingData, updateBookingData, onConfirm }: BookingSummaryProps) => {
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

  const courtTotal = bookingData.timeSlots.reduce((sum, slot) => sum + slot.price, 0);
  const productTotal = bookingData.selectedProducts?.reduce(
    (sum, p) => (sum || 0) + (p.price || 0) * (p.quantity || 1),
    0
  ) || 0;
  const rentalTotal = bookingData.selectedRentals?.reduce(
    (sum, r) => (sum || 0) + (r.rentalPrice || 0) * (r.quantity || 1),
    0
  ) || 0;
  const grandTotal = courtTotal + productTotal + rentalTotal;
  const depositAmount = Math.round((grandTotal * (bookingData.paymentPercentage || 100)) / 100);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Xác Nhận Đặt Sân</h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chi Tiết Đặt Sân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sân */}
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

          {/* Sản phẩm */}
          {bookingData.selectedProducts && bookingData.selectedProducts.length > 0 && (
            <>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-2">Sản phẩm</div>
                  <div className="text-muted-foreground space-y-1">
                    {bookingData.selectedProducts.map((product, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{product.name} x{product.quantity}</span>
                        <span>{formatPrice(product.price * product.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Vợt thuê */}
          {bookingData.selectedRentals && bookingData.selectedRentals.length > 0 && (
            <>
              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-2">Thuê Vợt</div>
                  <div className="text-muted-foreground space-y-1">
                    {bookingData.selectedRentals.map((rental, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{rental.racketName} ({rental.durationHours}h) x{rental.quantity}</span>
                        <span>{formatPrice(rental.rentalPrice * rental.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Tính tiền */}
          <div className="space-y-3">
            {courtTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Sân:</span>
                <span>{formatPrice(courtTotal)}</span>
              </div>
            )}
            {productTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Sản phẩm:</span>
                <span>{formatPrice(productTotal)}</span>
              </div>
            )}
            {rentalTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Vợt thuê:</span>
                <span>{formatPrice(rentalTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-semibold pt-2 border-t">
              <span>Tổng tiền:</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Thanh toán ({bookingData.paymentPercentage}%):</span>
              <span className="text-primary">{formatPrice(depositAmount)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="font-medium text-base">Thông tin liên hệ</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  Họ và tên
                </label>
                <input
                  value={bookingData.customerName || ""}
                  onChange={(e) => updateBookingData?.({ customerName: e.target.value })}
                  placeholder="Nhập tên người đặt"
                  className="w-full p-3 bg-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  Số điện thoại
                </label>
                <input
                  value={bookingData.customerPhone || ""}
                  onChange={(e) => updateBookingData?.({ customerPhone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="w-full p-3 bg-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Percentage Selection */}
          <div className="space-y-3">
            <div className="font-medium text-base">Lựa chọn hình thức thanh toán</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: "Trả 50% - Thanh toán khi nhận sân",
                  value: 50,
                  desc: "Tiền còn lại sẽ thanh toán tại sân",
                },
                {
                  label: "Trả 100% - Thanh toán ngay",
                  value: 100,
                  desc: "Hoàn toàn miễn phí",
                },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={bookingData.paymentPercentage === option.value ? "default" : "outline"}
                  onClick={() => updateBookingData?.({ paymentPercentage: option.value as 50 | 100 })}
                  className="h-auto p-4 flex flex-col items-start justify-start text-left"
                >
                  <div className="font-semibold text-base mb-1">{option.label}</div>
                  <div className="text-sm opacity-90">{option.desc}</div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Thanh toán {bookingData.paymentPercentage}% = <span className="font-semibold text-primary">{formatPrice(depositAmount)}</span>
              </p>
              {bookingData.paymentPercentage === 50 && (
                <p className="text-xs text-muted-foreground mt-2">Số tiền còn lại sẽ được thanh toán khi đến sân</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          onClick={onConfirm}
          size="lg"
          className="min-w-[200px]"
          disabled={!bookingData.customerName?.trim() || !bookingData.customerPhone?.trim()}
        >
          Xác nhận đặt sân
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;
