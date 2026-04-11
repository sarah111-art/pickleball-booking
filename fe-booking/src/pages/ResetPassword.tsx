import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: "Link không hợp lệ",
        description: "Thiếu token đặt lại mật khẩu",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu cần ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng nhập lại mật khẩu trùng khớp",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await auth.resetPassword(token, password);

    if (error) {
      toast({
        title: "Đặt lại mật khẩu thất bại",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đặt lại mật khẩu thành công",
        description: "Bạn có thể đăng nhập với mật khẩu mới",
      });
      navigate("/auth");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đặt lại mật khẩu</CardTitle>
          <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="password"
              placeholder="Mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
