import { useNavigate, Outlet } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LayoutDashboard, PlusCircle, List } from 'lucide-react';

export const ParentLayout = () => {
  const menuItems = [
    { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/create-request', label: 'Create Request', icon: PlusCircle },
    // more items...
  ];

  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};
