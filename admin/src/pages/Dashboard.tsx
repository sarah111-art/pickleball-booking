import { useAuth } from '@/hooks/use-auth';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Xin chào, {user?.email}</h1>
      <p>Vai trò: {user?.role}</p>
      {user?.role === 'manager' && (
        <p className="mt-4">Với vai trò quản lý, bạn có thể xem đặt sân và quản lý phân quyền nhân viên.</p>
      )}
    </div>
  );
};

export default Dashboard;