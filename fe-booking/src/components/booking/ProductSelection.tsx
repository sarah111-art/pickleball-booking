import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BookingData } from "@/pages/Booking";

interface ProductSelectionProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
}

interface SelectedProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const ProductSelection = ({ bookingData, updateBookingData, onNext }: ProductSelectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    bookingData.selectedProducts || []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await api.get<Product[]>("/products");
      if (error) throw new Error(error);
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.productId === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setSelectedProducts(
          selectedProducts.map((p) =>
            p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
          )
        );
      }
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ]);
    }
  };

  const removeProduct = (productId: string) => {
    const existing = selectedProducts.find((p) => p.productId === productId);
    if (existing && existing.quantity > 1) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === productId ? { ...p, quantity: p.quantity - 1 } : p
        )
      );
    } else {
      setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
    }
  };

  const handleNext = () => {
    updateBookingData({ selectedProducts });
    onNext();
  };

  const totalProductPrice = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center text-muted-foreground">
          <p>Hiện tại chưa có sản phẩm</p>
          <p className="text-sm mt-2">Vui lòng quay lại sau</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-6 text-center">Lựa chọn sản phẩm thêm</h2>

      {/* Search Input */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm sản phẩm..."
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

      {/* Products Container - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 mb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Đang tải...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="text-center text-muted-foreground">
              {searchQuery ? (
                <>
                  <p>Không tìm thấy sản phẩm</p>
                  <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                </>
              ) : (
                <>
                  <p>Hiện tại chưa có sản phẩm</p>
                  <p className="text-sm mt-2">Vui lòng quay lại sau</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Group products by category */}
            {["water", "drink", "snack", "other"].map((category) => {
              const categoryProducts = filteredProducts.filter((p) => p.category === category);
              if (categoryProducts.length === 0) return null;

              const categoryLabel = {
                water: "💧 Nước",
                drink: "🥤 Đồ uống",
                snack: "🍿 Bánh kẹo",
                other: "🎁 Khác"
              }[category] || category;

              return (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{categoryLabel}</h3>
                  <div className="grid gap-4 mb-6">
                    {categoryProducts.map((product) => {
                      const selected = selectedProducts.find((p) => p.productId === product.id);
                      return (
                        <Card
                          key={product.id}
                          className={`cursor-pointer transition-all border-2 ${
                            selected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30 hover:shadow-sm"
                          }`}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex gap-3 flex-1 min-w-0">
                                {product.image && (
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base leading-tight">{product.name}</h4>
                                  {product.stock > 0 && (
                                    <span className="text-xs text-muted-foreground">Có {product.stock} cái</span>
                                  )}
                                  <p className="font-bold text-primary mt-2 text-base">
                                    {new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(product.price)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {selected ? (
                                  <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg border border-primary/30">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeProduct(product.id)}
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
                                      onClick={() => addProduct(product)}
                                      disabled={selected.quantity >= product.stock}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addProduct(product)}
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
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sticky Summary and Next Button */}
      <div className="sticky bottom-0 bg-background border-t pt-4">
        {selectedProducts.length > 0 && (
          <Card className="mb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Sản phẩm đã chọn ({selectedProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 max-h-40 overflow-y-auto">
                {selectedProducts.map((product) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-background rounded-lg border border-primary/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">x{product.quantity}</p>
                    </div>
                    <p className="font-semibold text-primary">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.price * product.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                <span className="font-semibold text-base">Tổng cộng:</span>
                <span className="font-bold text-lg text-primary">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalProductPrice)}
                </span>
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

export default ProductSelection;
