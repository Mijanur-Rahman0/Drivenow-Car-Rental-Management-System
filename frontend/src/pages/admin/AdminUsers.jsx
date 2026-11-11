import { api } from '../../api';
import useAsync from '../../utils/useAsync';
import Spinner from '../../components/Spinner';
import { UsersTable, useAdminActions } from './adminShared';

export default function AdminUsers() {
  const { data, loading, error, reload } = useAsync(() => api.admin.users(), []);
  const actions = useAdminActions(reload);
  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return loading ? <Spinner /> : null;
  return <UsersTable users={data} actions={actions} />;
}
