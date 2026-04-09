import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-background border-b border-border px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="font-bold text-primary">
          Admin Panel
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <Link to="/bookings" className="text-sm hover:underline">
              Bookings
            </Link>
            {user.role === 'manager' && (
              <Link to="/permissions" className="text-sm hover:underline">
                Staff permissions
              </Link>
            )}
            <span className="text-sm">{user.email}</span>
            <button onClick={handleLogout} className="text-sm text-destructive">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;