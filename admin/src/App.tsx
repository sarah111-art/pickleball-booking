import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Courts from './pages/Courts';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Locations from './pages/Locations';

import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
import Products from './pages/Products';
import Rackets from './pages/Rackets';
import RacketRentals from './pages/RacketRentals';
import RacketOrders from './pages/RacketOrders';
import News from './pages/News';
import StaffPermissions from './pages/StaffPermissions';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface ProtectedProps {
  children: JSX.Element;
  roles?: string[];
  section?: string;
}

const ProtectedRoute = ({ children, roles, section }: ProtectedProps) => {
  const { user, hasPermission } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    // unauthorized
    return <Navigate to="/" replace />;
  }
  if (section && !hasPermission(section, 'view')) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-accent"
              aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
            >
              <span className="md:hidden">
                <Menu className="h-5 w-5" />
              </span>
              <span className="hidden md:inline">
                {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </span>
            </button>

            <h1 className="truncate text-sm font-semibold text-primary">Quản Trị</h1>
            <span className="max-w-[160px] truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute section="bookings">
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courts"
              element={
                <ProtectedRoute section="courts">
                  <Courts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute section="users">
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute section="locations">
                  <Locations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute section="payments">
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute section="reviews">
                  <Reviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute section="products">
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rackets"
              element={
                <ProtectedRoute section="rackets">
                  <Rackets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/racket-rentals"
              element={
                <ProtectedRoute section="racket_rentals">
                  <RacketRentals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/racket-orders"
              element={
                <ProtectedRoute section="racket_orders">
                  <RacketOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute section="news">
                  <News />
                </ProtectedRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute roles={["manager"]} section="staff">
                  <StaffPermissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute section="settings">
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;