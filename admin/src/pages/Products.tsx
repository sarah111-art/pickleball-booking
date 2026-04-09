import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { X, Trash2, Edit2 } from "lucide-react";

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

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "snack" as const,
    price: 0,
    stock: 0,
    image: "",
    isActive: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Product[]>("/products");
    if (err) {
      setError(err);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingId) {
      const { error: err } = await api.put(`/products/${editingId}`, formData);
      if (err) {
        setError(err);
      } else {
        setProducts(products.map(p => p.id === editingId ? { ...p, ...formData } : p));
        setShowModal(false);
        resetForm();
      }
    } else {
      const { data, error: err } = await api.post("/products", formData);
      if (err) {
        setError(err);
      } else {
        setProducts([...products, data as Product]);
        setShowModal(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa sản phẩm?")) return;
    const { error: err } = await api.delete(`/products/${id}`);
    if (err) {
      setError(err);
    } else {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: product.price,
      stock: product.stock,
      image: product.image || "",
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "snack",
      price: 0,
      stock: 0,
      image: "",
      isActive: true,
    });
    setEditingId(null);
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      snack: "Bánh Kẹo",
      drink: "Nước Ngọt Có Ga",
      water: "Suối",
      other: "Khác",
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Sản Phẩm Đi Kèm</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm Sản Phẩm
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 bg-white shadow">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded mb-2" />
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Danh Mục:</span> {getCategoryLabel(product.category)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Giá:</span> {new Intl.NumberFormat("vi-VN").format(product.price)}đ
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Kho:</span> {product.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && products.length === 0 && <div className="text-center py-8 text-gray-500">Không có sản phẩm nào</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded w-[600px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                placeholder="Tên Sản Phẩm"
                required
                className="w-full border p-2 rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <textarea
                placeholder="Mô Tả"
                className="w-full border p-2 rounded"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="snack">Bánh Kẹo</option>
                <option value="drink">Nước Ngọt Có Ga</option>
                <option value="water">Suối</option>
                <option value="other">Khác</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border p-2 rounded"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Số Lượng Kho"
                  required
                  min="0"
                  className="w-full border p-2 rounded"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                />
              </div>
              <input
                type="url"
                placeholder="URL Hình Ảnh"
                className="w-full border p-2 rounded"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Hoạt Động</span>
              </label>
              <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                {editingId ? "Cập Nhật" : "Tạo Sản Phẩm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
