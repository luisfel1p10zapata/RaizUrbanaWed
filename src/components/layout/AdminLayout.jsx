import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import AdminSidebar from '../navegacion/AdminSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;