import { useAuth } from '@/hooks/use-auth';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Welcome, {user?.email}</h1>
      <p>Your role: {user?.role}</p>
      {user?.role === 'manager' && (
        <p className="mt-4">As a manager you can view bookings and manage staff permissions.</p>
      )}
    </div>
  );
};

export default Dashboard;