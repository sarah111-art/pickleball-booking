import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

const Login = () => {
  const backgroundImage =
    'https://res.cloudinary.com/di7d0xja0/image/upload/v1775892247/bg-01_peolxq.jpg';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: err } = await api.post<{ accessToken: string; refreshToken?: string }>('/auth/login', { email, password });

    if (err || !data?.accessToken) {
      const normalizedError =
        err?.toLowerCase().includes('unauthorized') ||
        err?.toLowerCase().includes('invalid') ||
        err?.toLowerCase().includes('không đúng')
          ? 'Email hoặc mật khẩu không đúng'
          : err || 'Đăng nhập thất bại';
      setError(normalizedError);
      setLoading(false);
      return;
    }

    localStorage.setItem('accessToken', data.accessToken);

    try {
      const profileRes = await api.get<{
        id: string;
        email: string;
        role: 'manager' | 'staff';
        fullName?: string;
        permissions?: Array<{ section: string; actions: Array<'view' | 'add' | 'edit' | 'delete'> }>;
      }>('/auth/profile');

      if (profileRes.data) {
        login(profileRes.data);
      } else {
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        login({ email: payload.email ?? email, role: payload.role ?? 'staff' });
      }
    } catch {
      login({ email, role: 'staff' });
    }

    navigate('/');
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <form onSubmit={handleSubmit} className="relative z-10 bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Đăng nhập</h2>
        {error && (
          <div className="mb-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        <div className="mb-3">
          <label className="block text-sm">Email</label>
          <input
            type="email"
            required
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm">Mật khẩu</label>
          <input
            type="password"
            required
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2 rounded disabled:opacity-50">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
};

export default Login;