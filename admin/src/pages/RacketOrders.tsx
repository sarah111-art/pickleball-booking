import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface OrderItem {
  racketId: string;
  name: string;
  price: number;
  quantity: number;
}

interface RacketOrder {
  id: string;
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  note?: string;
  paymentMethod: 'cod' | 'sepay';
  paymentStatus: 'pending' | 'paid' | 'cod_pending';
  orderStatus: 'new' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    fullName?: string;
    phone?: string;
  };
}

const orderStatusOptions: Array<RacketOrder['orderStatus']> = ['new', 'processing', 'shipping', 'delivered', 'cancelled'];
const paymentStatusOptions: Array<RacketOrder['paymentStatus']> = ['pending', 'paid', 'cod_pending'];

const orderStatusLabel: Record<RacketOrder['orderStatus'], string> = {
  new: 'Mới tạo',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const paymentStatusLabel: Record<RacketOrder['paymentStatus'], string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  cod_pending: 'COD khi nhận',
};

const paymentMethodLabel: Record<RacketOrder['paymentMethod'], string> = {
  cod: 'COD',
  sepay: 'SePay QR',
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount || 0));

const RacketOrders = () => {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState<RacketOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<RacketOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const canEdit = hasPermission('racket_orders', 'edit');

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.get<RacketOrder[]>('/racket-orders');
    if (err) {
      setError(err);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredOrders = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return orders;
    return orders.filter((order) => {
      return (
        order.orderCode.toLowerCase().includes(k) ||
        (order.customerName || '').toLowerCase().includes(k) ||
        (order.customerPhone || '').toLowerCase().includes(k) ||
        (order.deliveryAddress || '').toLowerCase().includes(k)
      );
    });
  }, [orders, keyword]);

  const openDetail = (order: RacketOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const updateOrder = async (patch: Partial<RacketOrder>) => {
    if (!canEdit) {
      alert('Bạn không có quyền cập nhật đơn vợt');
      return;
    }
    if (!selectedOrder) return;
    setSaving(true);
    const { data, error: err } = await api.put<RacketOrder>(`/racket-orders/${selectedOrder.id}`, patch);
    if (err) {
      alert(`Cập nhật thất bại: ${err}`);
      setSaving(false);
      return;
    }

    if (data) {
      setSelectedOrder(data);
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
      alert('Đã cập nhật đơn hàng');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Đơn Vợt</h1>
          <p className="text-muted-foreground">Danh sách đơn hàng vợt khách đã mua cùng chi tiết thanh toán và giao hàng</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">Tải lại</button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo mã đơn, tên, điện thoại, địa chỉ..."
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Mã đơn</th>
                <th className="text-left px-4 py-3 font-semibold">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold">Thanh toán</th>
                <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                <th className="text-right px-4 py-3 font-semibold">Tổng tiền</th>
                <th className="text-left px-4 py-3 font-semibold">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>Đang tải đơn hàng...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>Chưa có đơn vợt nào</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">{order.orderCode}</td>
                    <td className="px-4 py-3">
                      <div>{order.customerName || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone || 'Không có SĐT'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{paymentMethodLabel[order.paymentMethod]}</div>
                      <div className="text-xs text-muted-foreground">{paymentStatusLabel[order.paymentStatus]}</div>
                    </td>
                    <td className="px-4 py-3">{orderStatusLabel[order.orderStatus]}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetail(order)}
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">Chi tiết đơn vợt: {selectedOrder.orderCode}</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-500 hover:text-black">Đóng</button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Thông tin khách</h4>
                <p><span className="font-medium">Tên:</span> {selectedOrder.customerName || 'N/A'}</p>
                <p><span className="font-medium">SĐT:</span> {selectedOrder.customerPhone || 'N/A'}</p>
                <p><span className="font-medium">Địa chỉ:</span> {selectedOrder.deliveryAddress || 'N/A'}</p>
                <p><span className="font-medium">Email tài khoản:</span> {selectedOrder.user?.email || 'Khách vãng lai'}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Trạng thái đơn</h4>
                <label className="text-sm text-muted-foreground block">Trạng thái xử lý</label>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => updateOrder({ orderStatus: e.target.value as RacketOrder['orderStatus'] })}
                  disabled={saving || !canEdit}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {orderStatusOptions.map((status) => (
                    <option key={status} value={status}>{orderStatusLabel[status]}</option>
                  ))}
                </select>

                <label className="text-sm text-muted-foreground block">Trạng thái thanh toán</label>
                <select
                  value={selectedOrder.paymentStatus}
                  onChange={(e) => updateOrder({ paymentStatus: e.target.value as RacketOrder['paymentStatus'] })}
                  disabled={saving || !canEdit}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>{paymentStatusLabel[status]}</option>
                  ))}
                </select>

                <p><span className="font-medium">Phương thức:</span> {paymentMethodLabel[selectedOrder.paymentMethod]}</p>
                <p><span className="font-medium">Tổng tiền:</span> <span className="text-primary font-bold">{formatPrice(selectedOrder.total)}</span></p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <h4 className="font-semibold mb-3">Chi tiết sản phẩm</h4>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2">Sản phẩm</th>
                      <th className="text-right px-4 py-2">Đơn giá</th>
                      <th className="text-right px-4 py-2">SL</th>
                      <th className="text-right px-4 py-2">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={`${selectedOrder.id}-${item.racketId}`} className="border-t">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(item.price)}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RacketOrders;
