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
        title: "Link khong hop le",
        description: "Thieu token dat lai mat khau",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Mat khau qua ngan",
        description: "Mat khau can it nhat 6 ky tu",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Mat khau khong khop",
        description: "Vui long nhap lai mat khau trung khop",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await auth.resetPassword(token, password);

    if (error) {
      toast({
        title: "Dat lai mat khau that bai",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Dat lai mat khau thanh cong",
        description: "Ban co the dang nhap voi mat khau moi",
      });
      navigate("/auth");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dat lai mat khau</CardTitle>
          <CardDescription>Nhap mat khau moi cho tai khoan cua ban</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="password"
              placeholder="Mat khau moi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Nhap lai mat khau moi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Dang xu ly..." : "Cap nhat mat khau"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
