import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import useAsync from '../../utils/useAsync';
import Spinner from '../../components/Spinner';
import { SmallBtn, Table } from './adminShared';

export default function AdminRoutes() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => Promise.all([api.admin.cars(), api.routes()]), []);
  const [picked, setPicked] = useState({});          // { carId: chosenRoute } — only cars the admin touched

  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return loading ? <Spinner /> : null;
  const [cars, routes] = data;

  const save = async (car) => {
    const route = picked[car.id] ?? car.route ?? '';
    try {
      const updated = await api.admin.updateCar(car.id, { route });
      toast(`Route for "${updated.car_name}" updated.`, 'success');
      setPicked((p) => { const n = { ...p }; delete n[car.id]; return n; });
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <Table heads={['Car', 'Current Route', 'Update Route', 'Action']} empty="No cars found">
      {cars.map((c) => (
        <tr key={c.id} className="border-b">
          <td className="p-2">{c.car_name}</td>
          <td className="p-2">{c.route || '—'}</td>
          <td className="p-2">
            <select
              aria-label={`Route for ${c.car_name}`}
              className="w-full rounded border p-1"
              value={picked[c.id] ?? c.route ?? ''}
              onChange={(e) => setPicked((p) => ({ ...p, [c.id]: e.target.value }))}
            >
              <option value="">— none (custom route car) —</option>
              {routes.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </td>
          <td className="p-2"><SmallBtn color="blue" onClick={() => save(c)}>Update</SmallBtn></td>
        </tr>
      ))}
    </Table>
  );
}
