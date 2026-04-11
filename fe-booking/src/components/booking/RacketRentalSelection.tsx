import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BookingData } from "@/pages/Booking";

interface RacketRentalSelectionProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface RacketRental {
  id: string;
  name: string;
  racket: {
    id: string;
    name: string;
    brand: string;
    type: string;
  };
  rentalPrice: number;
  durationHours: number;
  stock: number;
}

interface SelectedRental {
  rentalId: string;
  racketName: string;
  rentalPrice: number;
  durationHours: number;
  quantity: number;
}

const RacketRentalSelection = ({
  bookingData,
  updateBookingData,
  onNext,
}: RacketRentalSelectionProps) => {
  const [rentals, setRentals] = useState<RacketRental[]>([]);
  const [selectedRentals, setSelectedRentals] = useState<SelectedRental[]>(
    bookingData.selectedRentals || []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const { data, error } = await api.get<RacketRental[]>("/racket-rentals");
      if (error) throw new Error(error);
      // Filter out rentals without rackets
      const validRentals = (data || []).filter((r) => r.racket && r.racket.id);
      setRentals(validRentals);
    } catch (error) {
      console.error("Error fetching racket rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  const addRental = (rental: RacketRental) => {
    const existing = selectedRentals.find((r) => r.rentalId === rental.id);
    if (existing) {
      if (existing.quantity < rental.stock) {
        setSelectedRentals(
          selectedRentals.map((r) =>
            r.rentalId === rental.id ? { ...r, quantity: r.quantity + 1 } : r
          )
        );
      }
    } else {
      setSelectedRentals([
        ...selectedRentals,
        {
          rentalId: rental.id,
          racketName: rental.racket.name,
          rentalPrice: rental.rentalPrice,
          durationHours: rental.durationHours,
          quantity: 1,
        },
      ]);
    }
  };

  const removeRental = (rentalId: string) => {
    const existing = selectedRentals.find((r) => r.rentalId === rentalId);
    if (existing && existing.quantity > 1) {
      setSelectedRentals(
        selectedRentals.map((r) =>
          r.rentalId === rentalId ? { ...r, quantity: r.quantity - 1 } : r
        )
      );
    } else {
      setSelectedRentals(selectedRentals.filter((r) => r.rentalId !== rentalId));
    }
  };

  const handleNext = () => {
    updateBookingData({ selectedRentals });
    onNext();
  };

  const totalRentalPrice = selectedRentals.reduce(
    (sum, r) => sum + r.rentalPrice * r.quantity,
    0
  );

  const filteredRentals = rentals.filter((rental) =>
    rental.racket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rental.racket.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center text-muted-foreground space-y-4">
          <div>
            <p>Hiện tại chưa có vợt để thuê</p>
            <p className="text-sm mt-2">Bạn vẫn có thể tiếp tục đặt sân mà không cần thuê vợt</p>
          </div>
          <Button onClick={handleNext}>Tiếp tục</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-4">Lựa Chọn Thuê Vợt</h2>

      {/* Search Input */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm vợt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Rentals Container - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 mb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Đang tải...</div>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="text-center text-muted-foreground">
              {searchQuery ? (
                <>
                  <p>Không tìm thấy vợt</p>
                  <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                </>
              ) : (
                <>
                  <p>Hiện tại chưa có vợt để thuê</p>
                  <p className="text-sm mt-2">Bạn vẫn có thể tiếp tục đặt sân mà không cần thuê vợt</p>
                  <div className="mt-4">
                    <Button onClick={handleNext}>Tiếp tục</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRentals.map((rental) => {
              const selected = selectedRentals.find((r) => r.rentalId === rental.id);
              return (
                <Card
                  key={rental.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{rental.racket.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{rental.racket.brand}</Badge>
                          <Badge variant="secondary" className="text-xs capitalize">{rental.racket.type}</Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Thuê {rental.durationHours} giờ • Còn {rental.stock} cái
                          </p>
                          <p className="font-bold text-primary text-lg">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(rental.rentalPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected ? (
                          <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg border border-primary/30">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRental(rental.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {selected.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addRental(rental)}
                              disabled={selected.quantity >= rental.stock}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addRental(rental)}
                          >
                            Thêm
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Summary and Next Button */}
      <div className="sticky bottom-0 bg-background border-t pt-4">
        {selectedRentals.length > 0 && (
          <Card className="mb-4 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Vợt đã chọn ({selectedRentals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedRentals.map((rental) => (
                  <div key={rental.rentalId} className="flex justify-between text-sm">
                    <span>{rental.racketName} x{rental.quantity}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(rental.rentalPrice * rental.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Tổng thuê vợt:</span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(totalRentalPrice)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button onClick={handleNext} size="lg" className="w-full sm:w-auto">
            Tiếp theo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RacketRentalSelection;
