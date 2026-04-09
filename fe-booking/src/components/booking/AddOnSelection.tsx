import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, Zap } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Product {
  id: string;
  name: string;
  description?: string;
  category: "snack" | "drink" | "water" | "other";
  price: number;
  stock: number;
  image?: string;
  isActive: boolean;
}

interface RacketRental {
  id: string;
  racketId: string;
  rentalPrice: number;
  durationHours: number;
  stock: number;
  isActive: boolean;
  racket?: {
    name: string;
    brand?: string;
    type: string;
  };
}

interface AddOn {
  type: "product" | "racket_rental";
  itemId: string;
  quantity: number;
  price: number;
  name: string;
}

interface AddOnSelectionProps {
  addOns: AddOn[];
  updateAddOns: (addOns: AddOn[]) => void;
  onNext: () => void;
}

const AddOnSelection = ({ addOns, updateAddOns, onNext }: AddOnSelectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [racketRentals, setRacketRentals] = useState<RacketRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddOns();
  }, []);

  const fetchAddOns = async () => {
    setLoading(true);
    const [productRes, racketRes] = await Promise.all([
      api.get<Product[]>("/products?isActive=true"),
      api.get<RacketRental[]>("/racket-rentals?isActive=true"),
    ]);

    if (productRes.data) setProducts(productRes.data);
    if (racketRes.data) setRacketRentals(racketRes.data);
    setLoading(false);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      snack: "🍪 Bánh Kẹo",
      drink: "🥤 Nước Ngọt Có Ga",
      water: "💧 Nước Suối",
      other: "📦 Khác",
    };
    return labels[category] || category;
  };

  const updateAddOnQuantity = (type: "product" | "racket_rental", itemId: string, quantity: number) => {
    const existing = addOns.find((a) => a.type === type && a.itemId === itemId);

    if (quantity <= 0) {
      updateAddOns(addOns.filter((a) => !(a.type === type && a.itemId === itemId)));
      return;
    }

    if (existing) {
      updateAddOns(
        addOns.map((a) =>
          a.type === type && a.itemId === itemId ? { ...a, quantity } : a
        )
      );
    } else {
      // Find price from product or rental
      let price = 0;
      let name = "";

      if (type === "product") {
        const product = products.find((p) => p.id === itemId);
        if (product) {
          price = product.price;
          name = product.name;
        }
      } else {
        const rental = racketRentals.find((r) => r.id === itemId);
        if (rental) {
          price = rental.rentalPrice;
          name = `${rental.racket?.name || "Vợt"} (${rental.durationHours}h)`;
        }
      }

      if (price > 0) {
        updateAddOns([...addOns, { type, itemId, quantity, price, name }]);
      }
    }
  };

  const getAddOnQuantity = (type: "product" | "racket_rental", itemId: string) => {
    return addOns.find((a) => a.type === type && a.itemId === itemId)?.quantity || 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Thêm Sản Phẩm & Dịch Vụ</h2>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <LoadingSpinner size="md" text="Đang tải sản phẩm..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Thêm Sản Phẩm & Dịch Vụ</h2>

      {/* Products Section */}
      {products.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Đồ Ăn & Nước Uống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((product) => {
                const quantity = getAddOnQuantity("product", product.id);
                const categoryLabel = getCategoryLabel(product.category);

                return (
                  <div
                    key={product.id}
                    className="border rounded-lg p-3 flex items-start justify-between gap-3 hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {categoryLabel}
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateAddOnQuantity("product", product.id, quantity - 1)}
                        disabled={quantity === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-medium text-sm">
                        {quantity > 0 ? quantity : "-"}
                      </span>
                      <button
                        onClick={() => updateAddOnQuantity("product", product.id, quantity + 1)}
                        className="p-1 rounded hover:bg-blue-100"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Racket Rentals Section */}
      {racketRentals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Cho Thuê Vợt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {racketRentals.map((rental) => {
                const quantity = getAddOnQuantity("racket_rental", rental.id);

                return (
                  <div
                    key={rental.id}
                    className="border rounded-lg p-3 flex items-start justify-between gap-3 hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {rental.racket?.name || "Vợt"}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {rental.racket?.brand} • {rental.racket?.type}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {rental.durationHours} giờ
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatPrice(rental.rentalPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateAddOnQuantity("racket_rental", rental.id, quantity - 1)
                        }
                        disabled={quantity === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-medium text-sm">
                        {quantity > 0 ? quantity : "-"}
                      </span>
                      <button
                        onClick={() =>
                          updateAddOnQuantity("racket_rental", rental.id, quantity + 1)
                        }
                        className="p-1 rounded hover:bg-blue-100"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && racketRentals.length === 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Hiện không có sản phẩm hay dịch vụ nào
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button
          onClick={onNext}
          size="lg"
          className="min-w-[200px]"
        >
          Tiếp Tục
        </Button>
      </div>
    </div>
  );
};

export default AddOnSelection;
