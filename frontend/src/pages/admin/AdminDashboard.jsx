import { Link } from 'react-router-dom';
import { api } from '../../api';
import useAsync from '../../utils/useAsync';
import Spinner from '../../components/Spinner';
import { BookingsTable, CarsTable, UsersTable, useAdminActions } from './adminShared';

function StatCard({ title, n, to, label }) {
  return (
    <div className="rounded bg-white p-4 shadow">
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="text-gray-600">{n} total</p>
      <Link to={to} className="mt-2 inline-block text-blue-600 hover:underline">{label}</Link>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.admin.stats(), api.admin.cars(), api.admin.bookings(), api.admin.users()]), [],
  );
  const actions = useAdminActions(reload);

  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return loading ? <Spinner /> : null;
  const [stats, cars, bookings, users] = data;

  return (
    <>
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <StatCard title="Cars" n={stats.cars} to="/admin/cars" label="Manage Cars" />
        <StatCard title="Bookings" n={stats.bookings} to="/admin/bookings" label="Manage Bookings" />
        <StatCard title="Users" n={stats.users} to="/admin/users" label="Manage Users" />
      </div>
      <div className="mb-6"><h2 className="mb-4 text-2xl font-bold">Cars</h2><CarsTable cars={cars} actions={actions} /></div>
      <div className="mb-6"><h2 className="mb-4 text-2xl font-bold">Bookings</h2><BookingsTable bookings={bookings} actions={actions} /></div>
      <div className="mb-6"><h2 className="mb-4 text-2xl font-bold">Users</h2><UsersTable users={users} actions={actions} /></div>
    </>
  );
}
