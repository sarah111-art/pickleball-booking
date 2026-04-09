import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Courts from './pages/Courts';
import Timeslots from './pages/Timeslots';
import Users from './pages/Users';
import Locations from './pages/Locations';

import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
import Products from './pages/Products';
import Rackets from './pages/Rackets';
import RacketRentals from './pages/RacketRentals';
import StaffPermissions from './pages/StaffPermissions';
import type { JSX } from 'react';

interface ProtectedProps {
  children: JSX.Element;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedProps) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    // unauthorized
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 bg-background">
        <div className="p-6">
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
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courts"
              element={
                <ProtectedRoute>
                  <Courts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeslots"
              element={
                <ProtectedRoute>
                  <Timeslots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <Locations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rackets"
              element={
                <ProtectedRoute>
                  <Rackets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/racket-rentals"
              element={
                <ProtectedRoute>
                  <RacketRentals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute roles={["manager"]}>
                  <StaffPermissions />
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