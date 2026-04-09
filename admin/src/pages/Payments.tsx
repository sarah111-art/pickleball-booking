import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye } from "lucide-react";

interface Payment {
  id: string;
  booking?: {
    id: string;
    user?: {
      email: string;
      fullName?: string;
    };
    court?: {
      courtName: string;
    };
    date: string;
    total: number;
  };
  provider: string;
  providerOrderId?: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "failed">("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Payment[]>("/payments");
    if (err) {
      setError(err);
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  const filteredPayments = payments.filter(p => filter === "all" || p.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Đã Thanh Toán";
      case "pending":
        return "Chờ Xử Lý";
      case "failed":
        return "Thất Bại";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý Thanh Toán</h1>
        <button onClick={fetchPayments} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          ↻ Làm Mới
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex gap-2">
        {(["all", "pending", "paid", "failed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {status === "all" ? "Tất Cả" : getStatusText(status)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Email Khách</th>
                <th className="p-3 text-left">Sân</th>
                <th className="p-3 text-left">Ngày</th>
                <th className="p-3 text-left">Số Tiền</th>
                <th className="p-3 text-left">Phương Thức</th>
                <th className="p-3 text-left">Trạng Thái</th>
                <th className="p-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{payment.booking?.user?.email || "-"}</td>
                  <td className="p-3">{payment.booking?.court?.courtName || "-"}</td>
                  <td className="p-3">{payment.booking?.date || "-"}</td>
                  <td className="p-3 font-semibold">
                    {new Intl.NumberFormat("vi-VN").format(Number(payment.booking?.total) || 0)}đ
                  </td>
                  <td className="p-3 capitalize">{payment.provider}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded inline-block"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">Không có thanh toán nào</div>
          )}
        </div>
      )}

      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white p-6 rounded w-[500px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Chi Tiết Thanh Toán</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span>ID:</span>
                <span className="font-mono">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Email:</span>
                <span>{selectedPayment.booking?.user?.email || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Sân:</span>
                <span>{selectedPayment.booking?.court?.courtName || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Ngày:</span>
                <span>{selectedPayment.booking?.date || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Tổng Tiền:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("vi-VN").format(Number(selectedPayment.booking?.total) || 0)}đ
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Phương Thức:</span>
                <span className="capitalize">{selectedPayment.provider}</span>
              </div>
              {selectedPayment.providerOrderId && (
                <div className="flex justify-between border-b pb-2">
                  <span>Order ID:</span>
                  <span className="font-mono text-xs">{selectedPayment.providerOrderId}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span>Trạng Thái:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                  {getStatusText(selectedPayment.status)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Ngày Tạo:</span>
                <span>{new Date(selectedPayment.createdAt).toLocaleString("vi-VN")}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPayment(null)}
              className="w-full mt-6 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
