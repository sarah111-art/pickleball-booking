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
  Clock,
  MapPin,
  CreditCard,
  MessageSquare,
  Package,
  Zap,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/bookings',
      label: 'Bookings',
      icon: Calendar,
    },
    {
      href: '/courts',
      label: 'Courts',
      icon: Grid3x3,
    },
    {
      href: '/timeslots',
      label: 'Timeslots',
      icon: Clock,
    },
    {
      href: '/users',
      label: 'Users',
      icon: Users,
    },
    {
      href: '/locations',
      label: 'Locations',
      icon: MapPin,
    },
    {
      href: '/payments',
      label: 'Payments',
      icon: CreditCard,
    },
    {
      href: '/reviews',
      label: 'Reviews',
      icon: MessageSquare,
    },
    {
      href: '/products',
      label: 'Products',
      icon: Package,
    },
    {
      href: '/rackets',
      label: 'Rackets',
      icon: Zap,
    },
    {
      href: '/racket-rentals',
      label: 'Racket Rentals',
      icon: Zap,
    },
  ];

  if (user?.role === 'manager') {
    navItems.push({
      href: '/permissions',
      label: 'Staff Permissions',
      icon: Users,
    });
  }

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
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
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;