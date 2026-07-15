import { useNavigate, Outlet } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LayoutDashboard, UserCheck, CalendarDays } from 'lucide-react';

export const ManagerLayout = () => {
  const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/review-request', label: 'Review Requests', icon: UserCheck },
    { path: '/teaching-schedules', label: 'Teaching Schedules', icon: CalendarDays },
  ];

  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};
