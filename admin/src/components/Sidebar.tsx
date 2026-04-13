import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  User,
  Grid3x3,
  MapPin,
  CreditCard,
  MessageSquare,
  Package,
  Zap,
  Settings2,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const closeIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    closeIfMobile();
    navigate('/login');
  };

  const navItems = [
    {
      href: '/',
      label: 'Tổng Quan',
      icon: LayoutDashboard,
      section: 'dashboard',
    },
    {
      href: '/bookings',
      label: 'Đặt Sân',
      icon: Calendar,
      section: 'bookings',
    },
    {
      href: '/courts',
      label: 'Sân Pickleball',
      icon: Grid3x3,
      section: 'courts',
    },
    {
      href: '/users',
      label: 'Người Dùng',
      icon: Users,
      section: 'users',
    },
    {
      href: '/locations',
      label: 'Địa Điểm',
      icon: MapPin,
      section: 'locations',
    },
    {
      href: '/payments',
      label: 'Thanh Toán',
      icon: CreditCard,
      section: 'payments',
    },
    {
      href: '/reviews',
      label: 'Đánh Giá',
      icon: MessageSquare,
      section: 'reviews',
    },
    {
      href: '/products',
      label: 'Sản Phẩm',
      icon: Package,
      section: 'products',
    },
    {
      href: '/rackets',
      label: 'Vợt Bán',
      icon: Zap,
      section: 'rackets',
    },
    {
      href: '/racket-rentals',
      label: 'Cho Thuê Vợt',
      icon: Zap,
      section: 'racket_rentals',
    },
    {
      href: '/racket-orders',
      label: 'Đơn Vợt',
      icon: Package,
      section: 'racket_orders',
    },
    {
      href: '/news',
      label: 'Tin Tức',
      icon: MessageSquare,
      section: 'news',
    },
    {
      href: '/settings',
      label: 'Cài Đặt Hệ Thống',
      icon: Settings2,
      section: 'settings',
    },
  ];

  if (user?.role === 'manager') {
    navItems.push({
      href: '/permissions',
      label: 'Phân Quyền Nhân Viên',
      icon: Users,
      section: 'staff',
    });
  }

  const visibleNavItems = navItems.filter((item) => !item.section || hasPermission(item.section, 'view'));

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col h-screen transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isOpen ? 'md:flex md:translate-x-0' : 'md:hidden',
          'md:sticky md:top-0 md:z-20'
        )}
      >
      {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Quản Trị</h1>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent md:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={closeIfMobile}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      {/* User Info & Logout */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Đăng Xuất
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;