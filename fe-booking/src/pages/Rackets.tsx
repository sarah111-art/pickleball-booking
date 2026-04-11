import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";

interface Racket {
  id: string;
  name: string;
  type: "beginner" | "intermediate" | "professional";
  brand: string;
  price: number;
  image?: string;
  description?: string;
  stock: number;
}

interface CartItem {
  racketId: string;
  name: string;
  price: number;
  quantity: number;
}

type PaymentMethod = "cod" | "sepay";

const SEPAY_CONFIG = {
  accountNumber: "0010000000355",
  bankCode: "Vietcombank",
};

const Rackets = () => {
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [checkoutCode, setCheckoutCode] = useState("");
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRackets();
  }, []);

  const fetchRackets = async () => {
    try {
      const { data, error } = await api.get<Racket[]>("/rackets");
      if (error) throw new Error(error);
      setRackets(data || []);
    } catch (error) {
      console.error("Error fetching rackets:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách vợt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRackets = rackets.filter((racket) => {
    const matchesSearch = racket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      racket.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || racket.type === filterType;
    return matchesSearch && matchesType;
  });

  const addToCart = (racket: Racket) => {
    const existing = cart.find((item) => item.racketId === racket.id);
    if (existing) {
      if (existing.quantity < racket.stock) {
        setCart(
          cart.map((item) =>
            item.racketId === racket.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        toast({
          title: "Hết hàng",
          description: "Số lượng vợt không đủ",
          variant: "destructive",
        });
      }
    } else {
      setCart([
        ...cart,
        {
          racketId: racket.id,
          name: racket.name,
          price: racket.price,
          quantity: 1,
        },
      ]);
      toast({
        title: "Thêm vào giỏ",
        description: `Đã thêm ${racket.name}`,
      });
    }
  };

  const removeFromCart = (racketId: string) => {
    const existing = cart.find((item) => item.racketId === racketId);
    if (existing && existing.quantity > 1) {
      setCart(
        cart.map((item) =>
          item.racketId === racketId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setCart(cart.filter((item) => item.racketId !== racketId));
    }
  };

  const removeItemCompletely = (racketId: string) => {
    setCart((prev) => prev.filter((item) => item.racketId !== racketId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const createCheckoutCode = () => `RKT${Date.now()}`;

  const resetCheckoutState = () => {
    setCheckoutCode("");
    setCheckoutOrderId(null);
  };

  const generateSePayQRUrl = () => {
    const code = checkoutCode || createCheckoutCode();
    const encodedDesc = encodeURIComponent(`Thanh toan don vot ${code}`);
    return `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.accountNumber}&bank=${SEPAY_CONFIG.bankCode}&amount=${cartTotal}&des=${encodedDesc}`;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "sepay" && checkoutOrderId) {
      toast({
        title: "Đơn QR đã được tạo",
        description: `Vui lòng quét mã đơn ${checkoutCode} và xác nhận sau khi chuyển khoản.`,
      });
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      toast({
        title: "Thiếu thông tin nhận hàng",
        description: "Vui lòng nhập tên, số điện thoại và địa chỉ giao hàng.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutLoading(true);

    const orderCode = checkoutCode || createCheckoutCode();
    const { data, error } = await api.post<{ id: string; orderCode: string }>("/racket-orders", {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      note: `Đơn vợt từ FE - ${orderCode}`,
      paymentMethod,
      items: cart,
    });

    if (error || !data) {
      setCheckoutLoading(false);
      toast({
        title: "Không tạo được đơn hàng",
        description: error || "Có lỗi xảy ra khi thanh toán.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutCode(data.orderCode || orderCode);
    setCheckoutOrderId(data.id);

    if (paymentMethod === "cod") {
      toast({
        title: "Đặt hàng COD thành công",
        description: `Mã đơn ${data.orderCode}. Bạn thanh toán khi nhận hàng.`,
      });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      resetCheckoutState();
      setCheckoutLoading(false);
      return;
    }

    toast({
      title: "Quét mã SePay",
      description: `Đơn ${data.orderCode} đã tạo. Vui lòng quét QR và xác nhận sau khi chuyển khoản.`,
    });
    setCheckoutLoading(false);
  };

  const handleConfirmSePayPaid = async () => {
    if (!checkoutOrderId) {
      toast({
        title: "Thiếu mã đơn",
        description: "Vui lòng bấm Thanh toán QR SePay để tạo đơn trước.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutLoading(true);
    const { error } = await api.put(`/racket-orders/${checkoutOrderId}`, {
      paymentStatus: "paid",
      orderStatus: "processing",
    });

    if (error) {
      setCheckoutLoading(false);
      toast({
        title: "Cập nhật thanh toán thất bại",
        description: error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đã ghi nhận thanh toán",
      description: `Đơn ${checkoutCode || "SePay"} đang được xử lý.`,
    });
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    resetCheckoutState();
    setCheckoutLoading(false);
  };

  const typeLabels: { [key: string]: string } = {
    beginner: "Người mới",
    intermediate: "Trung cấp",
    professional: "Chuyên nghiệp",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center pt-36 pb-12">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Cửa hàng Vợt Pickleball</h1>
              <p className="text-muted-foreground">
                Chọn vợt phù hợp với trình độ của bạn
              </p>
            </div>
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tìm kiếm</label>
                    <Input
                      placeholder="Tên vợt, thương hiệu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Loại vợt</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setFilterType(null)}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          filterType === null
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        Tất cả
                      </button>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFilterType(key)}
                          className={`w-full text-left px-3 py-2 rounded transition-colors ${
                            filterType === key
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {filteredRackets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Không tìm thấy vợt phù hợp
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRackets.map((racket) => {
                    const inCart = cart.find((item) => item.racketId === racket.id);
                    return (
                      <Card key={racket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {racket.image && (
                          <div className="w-full h-52 bg-muted/50 border-b overflow-hidden flex items-center justify-center">
                            <img
                              src={racket.image}
                              alt={racket.name}
                              className="w-full h-full object-contain p-3"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{racket.name}</h3>
                              <p className="text-sm text-muted-foreground">{racket.brand}</p>
                            </div>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {typeLabels[racket.type]}
                            </span>
                          </div>

                          {racket.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {racket.description}
                            </p>
                          )}

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">
                                {formatPrice(racket.price)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Còn: {racket.stock}
                              </span>
                            </div>

                            {inCart ? (
                              <div className="flex items-center justify-between bg-muted p-2 rounded">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(racket.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium">{inCart.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addToCart(racket)}
                                  disabled={inCart.quantity >= racket.stock}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => addToCart(racket)}
                                className="w-full"
                                disabled={racket.stock === 0}
                              >
                                {racket.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="fixed top-24 right-6 bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm z-40">
              <h3 className="font-semibold mb-3">Giỏ hàng ({cartCount})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {cart.map((item) => (
                  <div key={item.racketId} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1">
                      <span>{item.name} x{item.quantity}</span>
                    </div>
                    <span className="font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => removeItemCompletely(item.racketId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Xoá sản phẩm khỏi giỏ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mb-3">
                <div className="flex justify-between font-bold">
                  <span>Tổng:</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <Input
                  placeholder="Tên người nhận"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  placeholder="Số điện thoại"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <Input
                  placeholder="Địa chỉ giao hàng"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-xs font-medium text-muted-foreground">Phương thức thanh toán</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "cod" ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => setPaymentMethod("cod")}
                  >
                    COD
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "sepay" ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => setPaymentMethod("sepay")}
                  >
                    QR SePay
                  </Button>
                </div>
              </div>

              {paymentMethod === "sepay" && (
                <div className="mb-3 rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    {checkoutCode ? `Mã đơn: ${checkoutCode}` : "Bấm Thanh toán để tạo mã đơn"}
                  </p>
                  <img
                    src={generateSePayQRUrl()}
                    alt="SePay QR"
                    className="w-full rounded-md border bg-white"
                  />
                </div>
              )}

              <Button className="w-full" onClick={handleCheckout} disabled={checkoutLoading}>
                {paymentMethod === "cod" ? "Đặt hàng COD" : "Thanh toán QR SePay"}
              </Button>

              {paymentMethod === "sepay" && checkoutCode && (
                <Button variant="outline" className="w-full mt-2" onClick={handleConfirmSePayPaid} disabled={checkoutLoading}>
                  Tôi đã thanh toán
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rackets;
