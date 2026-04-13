import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  MapPinned,
  ShoppingBag,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'paid';

interface BookingItem {
  quantity?: number;
}

interface BookingItemsPayload {
  products?: BookingItem[];
  rentals?: BookingItem[];
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  total?: number | string;
  courtPrice?: number | string;
  productPrice?: number | string;
  rentalPrice?: number | string;
  bookingItems?: string | BookingItemsPayload;
  court?: {
    courtName?: string;
  };
  user?: {
    email?: string;
    fullName?: string;
  };
  customerName?: string;
}

interface Payment {
  id: string;
  status: 'pending' | 'paid' | 'failed';
}

const STATUS_META: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: {
    label: 'Chờ xác nhận',
    color: '#eab308',
    bg: 'bg-yellow-100 text-yellow-800',
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: '#2563eb',
    bg: 'bg-blue-100 text-blue-800',
  },
  paid: {
    label: 'Đã thanh toán',
    color: '#16a34a',
    bg: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#dc2626',
    bg: 'bg-red-100 text-red-800',
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const toNumber = (value?: number | string) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseBookingItems = (payload?: string | BookingItemsPayload): BookingItemsPayload => {
  if (!payload) return {};

  if (typeof payload !== 'string') {
    return payload;
  }

  try {
    const parsed = JSON.parse(payload) as BookingItemsPayload;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [bookingsRes, paymentsRes] = await Promise.all([
          api.get<Booking[]>('/bookings'),
          api.get<Payment[]>('/payments'),
        ]);

        if (!isMounted) return;

        if (bookingsRes.error) {
          setError(bookingsRes.error);
        }

        if (paymentsRes.error && !bookingsRes.error) {
          setError(paymentsRes.error);
        }

        setBookings(bookingsRes.data || []);
        setPayments(paymentsRes.data || []);
      } catch {
        if (isMounted) {
          setError('Không thể tải dữ liệu dashboard');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const todayString = new Date().toLocaleDateString('sv-SE');
  const now = new Date();
  const totalRevenue = bookings.reduce((sum, booking) => sum + toNumber(booking.total), 0);
  const todayBookings = bookings.filter((booking) => booking.date === todayString).length;
  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled').length;
  const monthBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date);
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  }).length;

  const statusCounts: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    paid: 0,
    cancelled: 0,
  };

  bookings.forEach((booking) => {
    statusCounts[booking.status] += 1;
  });

  const totalBookings = bookings.length;
  const totalStatusCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const statusGradient = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count], index, list) => {
      const previous = list.slice(0, index).reduce((sum, [, itemCount]) => sum + itemCount, 0);
      const start = (previous / totalStatusCount) * 100;
      const end = ((previous + count) / totalStatusCount) * 100;
      return `${STATUS_META[status as BookingStatus].color} ${start}% ${end}%`;
    })
    .join(', ');

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toLocaleDateString('sv-SE');
    const count = bookings.filter((booking) => booking.date === key).length;

    return {
      label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      count,
    };
  });

  const maxDailyBookings = Math.max(...last7Days.map((item) => item.count), 1);

  const topCourtsMap = new Map<string, number>();
  bookings.forEach((booking) => {
    const courtName = booking.court?.courtName || 'Chưa gán sân';
    topCourtsMap.set(courtName, (topCourtsMap.get(courtName) || 0) + 1);
  });

  const topCourts = Array.from(topCourtsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 5);

  const serviceStats = bookings.reduce(
    (accumulator, booking) => {
      const items = parseBookingItems(booking.bookingItems);
      const products = Array.isArray(items.products) ? items.products : [];
      const rentals = Array.isArray(items.rentals) ? items.rentals : [];

      accumulator.courts += 1;
      accumulator.courtRevenue += toNumber(booking.courtPrice) || Math.max(
        toNumber(booking.total) - toNumber(booking.productPrice) - toNumber(booking.rentalPrice),
        0
      );

      accumulator.products += products.reduce((sum, item) => sum + (item.quantity || 1), 0);
      accumulator.rentals += rentals.reduce((sum, item) => sum + (item.quantity || 1), 0);
      accumulator.productRevenue += toNumber(booking.productPrice);
      accumulator.rentalRevenue += toNumber(booking.rentalPrice);

      return accumulator;
    },
    {
      courts: 0,
      products: 0,
      rentals: 0,
      courtRevenue: 0,
      productRevenue: 0,
      rentalRevenue: 0,
    }
  );

  const serviceMix = [
    {
      label: 'Lượt đặt sân',
      count: serviceStats.courts,
      revenue: serviceStats.courtRevenue,
      color: 'bg-sky-500',
      icon: CalendarDays,
    },
    {
      label: 'Sản phẩm kèm theo',
      count: serviceStats.products,
      revenue: serviceStats.productRevenue,
      color: 'bg-amber-500',
      icon: ShoppingBag,
    },
    {
      label: 'Thuê vợt',
      count: serviceStats.rentals,
      revenue: serviceStats.rentalRevenue,
      color: 'bg-emerald-500',
      icon: Trophy,
    },
  ];

  const maxServiceCount = Math.max(...serviceMix.map((item) => item.count), 1);
  const paymentRate = payments.length === 0
    ? 0
    : Math.round((payments.filter((payment) => payment.status === 'paid').length / payments.length) * 100);

  const recentBookings = [...bookings]
    .sort((first, second) => `${second.date} ${second.startTime}`.localeCompare(`${first.date} ${first.startTime}`))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-200/80">Admin Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Xin chào, {user?.email}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
              Theo dõi toàn cảnh booking, thanh toán và mức độ sử dụng dịch vụ hiện tại để xử lý nhanh các điểm nghẽn trong vận hành.
            </p>
            {hasPermission('settings', 'view') && (
              <Link
                to="/settings#business-hours"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Thiết lập giờ hoạt động
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-sky-100/70">Booking hôm nay</p>
              <p className="mt-2 text-2xl font-semibold">{todayBookings}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-sky-100/70">Booking tháng này</p>
              <p className="mt-2 text-2xl font-semibold">{monthBookings}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-sky-100/70">Tỉ lệ thanh toán</p>
              <p className="mt-2 text-2xl font-semibold">{paymentRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng booking"
          value={formatCompactNumber(totalBookings)}
          description="Tất cả booking hiện có trong hệ thống"
          icon={Activity}
        />
        <StatCard
          title="Booking đang hoạt động"
          value={formatCompactNumber(activeBookings)}
          description="Không bao gồm các booking đã hủy"
          icon={TrendingUp}
        />
        <StatCard
          title="Doanh thu ghi nhận"
          value={formatCurrency(totalRevenue)}
          description="Tổng giá trị từ toàn bộ booking"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Thanh toán phát sinh"
          value={formatCompactNumber(payments.length)}
          description="Tổng số giao dịch đang được theo dõi"
          icon={CreditCard}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Xu hướng booking 7 ngày gần nhất</h2>
              <p className="mt-1 text-sm text-slate-500">Nhìn nhanh nhịp đặt sân để điều chỉnh nhân sự và dịch vụ đi kèm.</p>
            </div>
            <CalendarDays className="h-5 w-5 text-sky-500" />
          </div>

          <div className="mt-8 grid grid-cols-7 items-end gap-3">
            {last7Days.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="flex h-52 w-full items-end rounded-2xl bg-slate-50 px-2 py-3">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-sky-600 to-cyan-400 transition-all"
                    style={{ height: `${Math.max((item.count / maxDailyBookings) * 100, item.count > 0 ? 12 : 4)}%` }}
                    title={`${item.count} booking`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900">{item.count}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Trạng thái booking</h2>
              <p className="mt-1 text-sm text-slate-500">Phân bổ booking theo tiến trình xử lý hiện tại.</p>
            </div>
            <Activity className="h-5 w-5 text-sky-500" />
          </div>

          <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex h-56 w-56 items-center justify-center rounded-full"
              style={{
                background: totalStatusCount === 0
                  ? 'conic-gradient(#e2e8f0 0% 100%)'
                  : `conic-gradient(${statusGradient})`,
              }}
            >
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <p className="text-sm text-slate-500">Tổng booking</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{totalBookings}</p>
              </div>
            </div>

            <div className="w-full space-y-3">
              {(Object.keys(STATUS_META) as BookingStatus[]).map((status) => (
                <div key={status} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} />
                    <span className="text-sm font-medium text-slate-700">{STATUS_META[status].label}</span>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_META[status].bg)}>
                    {statusCounts[status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sân được đặt nhiều nhất</h2>
              <p className="mt-1 text-sm text-slate-500">Top sân theo số lượt đặt để theo dõi nhu cầu thực tế.</p>
            </div>
            <MapPinned className="h-5 w-5 text-sky-500" />
          </div>

          <div className="mt-8 space-y-4">
            {topCourts.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Chưa có dữ liệu booking để thống kê sân.</p>
            ) : (
              topCourts.map((court) => {
                const width = (court.count / Math.max(topCourts[0]?.count || 1, 1)) * 100;
                return (
                  <div key={court.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-700">{court.name}</span>
                      <span className="text-slate-500">{court.count} lượt</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Dịch vụ đi kèm</h2>
              <p className="mt-1 text-sm text-slate-500">Mức sử dụng sân, sản phẩm và thuê vợt trong các booking hiện tại.</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-sky-500" />
          </div>

          <div className="mt-8 space-y-5">
            {serviceMix.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">{item.count}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">đơn vị</p>
                    </div>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-slate-100">
                    <div className={`${item.color} h-3 rounded-full`} style={{ width: `${(item.count / maxServiceCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Booking mới nhất</h2>
            <p className="mt-1 text-sm text-slate-500">Danh sách nhanh để theo dõi các yêu cầu vừa phát sinh.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-sky-500" />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">Khách</th>
                <th className="pb-3 pr-4 font-medium">Sân</th>
                <th className="pb-3 pr-4 font-medium">Ngày</th>
                <th className="pb-3 pr-4 font-medium">Giờ</th>
                <th className="pb-3 pr-4 font-medium">Trạng thái</th>
                <th className="pb-3 font-medium text-right">Giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Chưa có booking để hiển thị.
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-4 pr-4 font-medium text-slate-800">
                      {booking.customerName || booking.user?.fullName || booking.user?.email || 'Khách vãng lai'}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{booking.court?.courtName || 'Chưa gán sân'}</td>
                    <td className="py-4 pr-4 text-slate-600">{booking.date}</td>
                    <td className="py-4 pr-4 text-slate-600">{booking.startTime} - {booking.endTime}</td>
                    <td className="py-4 pr-4">
                      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_META[booking.status].bg)}>
                        {STATUS_META[booking.status].label}
                      </span>
                    </td>
                    <td className="py-4 text-right font-semibold text-slate-900">{formatCurrency(toNumber(booking.total))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Đang tải dữ liệu dashboard...
        </div>
      )}

      {user?.role === 'manager' && (
        <p className="text-sm text-slate-500">
          Với vai trò quản lý, bạn có thể dùng dashboard này để theo dõi booking, thanh toán và mức sử dụng dịch vụ trước khi vào từng module chi tiết.
        </p>
      )}
    </div>
  );
};

export default Dashboard;