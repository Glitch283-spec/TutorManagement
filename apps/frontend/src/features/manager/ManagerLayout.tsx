import { useNavigate, Outlet } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LayoutDashboard, Users, UserCheck } from 'lucide-react';

export const ManagerLayout = () => {
  const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/review-request', label: 'Review Requests', icon: UserCheck },
  ];

  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};
