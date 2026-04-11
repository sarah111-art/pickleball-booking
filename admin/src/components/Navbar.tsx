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
          Quản Trị Viên
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <Link to="/bookings" className="text-sm hover:underline">
              Đặt Sân
            </Link>
            {user.role === 'manager' && (
              <Link to="/permissions" className="text-sm hover:underline">
                Phân Quyền Nhân Viên
              </Link>
            )}
            <span className="text-sm">{user.email}</span>
            <button onClick={handleLogout} className="text-sm text-destructive">
              Đăng Xuất
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;