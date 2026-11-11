import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  ['/admin', 'Dashboard', true],
  ['/admin/cars', 'Manage Cars'],
  ['/admin/bookings', 'Manage Bookings'],
  ['/admin/users', 'Manage Users'],
  ['/admin/payments', 'Payments'],
  ['/admin/routes', 'Routes'],
];

const TITLES = {
  '/admin': 'Admin Dashboard', '/admin/cars': 'Manage Cars', '/admin/bookings': 'Manage Bookings',
  '/admin/users': 'Manage Users', '/admin/payments': 'Payment Records', '/admin/routes': 'Route Management',
};

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const logout = async (e) => {
    e.preventDefault();
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-body">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h2 className="mb-6 font-body text-2xl font-bold text-gray-800">Admin Panel</h2>
          <nav className="space-y-2">
            {NAV.map(([to, label, end]) => (
              <NavLink
                key={to} to={to} end={end} onClick={() => setOpen(false)}
                className={({ isActive }) => `block rounded px-4 py-2 hover:bg-blue-100 ${isActive ? 'bg-blue-100 font-semibold' : ''}`}
              >{label}</NavLink>
            ))}
            <a href="/admin/login" onClick={logout} className="mt-6 block rounded bg-red-600 px-4 py-2 text-center text-white hover:bg-red-700">Logout</a>
          </nav>
        </div>
      </aside>

      <div className="min-h-screen p-6 md:ml-64">
        <button onClick={() => setOpen((o) => !o)} className="mb-4 rounded bg-blue-600 px-4 py-2 text-white md:hidden">Menu</button>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-body text-3xl font-bold text-gray-800">{TITLES[pathname] || 'Admin'}</h1>
          <span className="text-sm text-gray-500">{user?.name}</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
