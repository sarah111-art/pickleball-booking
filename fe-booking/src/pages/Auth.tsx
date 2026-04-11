import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const backgroundImage =
    "https://res.cloudinary.com/di7d0xja0/image/upload/v1775892247/bg-01_peolxq.jpg";

  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    if (auth.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ email và mật khẩu",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await auth.login(loginEmail, loginPassword);

    if (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: error === "Invalid credentials" 
          ? "Email hoặc mật khẩu không đúng" 
          : error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
      navigate("/");
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail || !signupPassword || !signupFullName) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await auth.register({
      email: signupEmail,
      password: signupPassword,
      fullName: signupFullName,
      phone: signupPhone || undefined,
    });

    if (error) {
      toast({
        title: "Đăng ký thất bại",
        description: error === "Email already registered" 
          ? "Email này đã được đăng ký" 
          : error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản của bạn đã được tạo!",
      });
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <Card className="relative z-10 w-full max-w-md shadow-2xl bg-white border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sân Pickleball</CardTitle>
          <CardDescription className="text-center">
            Đăng nhập hoặc tạo tài khoản mới
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Họ và tên *</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Số điện thoại</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="0901234567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mật khẩu *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng ký"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
