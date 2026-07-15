import { useNavigate, Outlet } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LayoutDashboard, PlusCircle, List, Star } from 'lucide-react';

export const ParentLayout = () => {
  const menuItems = [
    { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/create-request', label: 'Create Request', icon: PlusCircle },
    { path: '/rate-tutor', label: 'Rate Tutors', icon: Star }
    // more items...
  ];

  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};
