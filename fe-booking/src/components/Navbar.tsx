import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { auth } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (auth.isAuthenticated()) {
        const { data, error } = await auth.getProfile();
        if (!error && data) {
          setUser(data);
        } else {
          auth.logout();
          setUser(null);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    setIsMenuOpen(false);
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
    navigate("/");
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-lg sm:text-xl font-bold text-primary" onClick={closeMenu}>
            Pickleball Booking
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/schedule">
              <Button variant="ghost" size="sm">
                Giá & Lịch
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="ghost" size="sm">
                Đặt sân
              </Button>
            </Link>
            {user ? (
              <>
                <Link to="/my-bookings">
                  <Button variant="ghost" size="sm">
                    Lịch sử đặt sân
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {user.email}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Đăng xuất
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              <Link to="/schedule" onClick={closeMenu}>
                <Button variant="ghost" className="w-full justify-start">
                  Giá & Lịch
                </Button>
              </Link>
              <Link to="/booking" onClick={closeMenu}>
                <Button variant="ghost" className="w-full justify-start">
                  Đặt sân
                </Button>
              </Link>
              {user ? (
                <>
                  <Link to="/my-bookings" onClick={closeMenu}>
                    <Button variant="ghost" className="w-full justify-start">
                      Lịch sử đặt sân
                    </Button>
                  </Link>
                  <div className="px-4 py-2 text-sm text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <Button onClick={handleLogout} variant="outline" className="w-full">
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={closeMenu}>
                  <Button variant="default" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
