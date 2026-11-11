import { api } from '../../api';
import useAsync from '../../utils/useAsync';
import Spinner from '../../components/Spinner';
import { BookingsTable, useAdminActions } from './adminShared';

export default function AdminBookings() {
  const { data, loading, error, reload } = useAsync(() => api.admin.bookings(), []);
  const actions = useAdminActions(reload);
  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return loading ? <Spinner /> : null;
  return <BookingsTable bookings={data} actions={actions} />;
}
