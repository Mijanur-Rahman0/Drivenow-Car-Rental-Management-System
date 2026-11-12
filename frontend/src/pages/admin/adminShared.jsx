import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { carImage, FALLBACK_IMAGE, money, fmtDateTime } from '../../utils/format';

/** Generic admin table: <Table heads={[...]} empty="No rows">{<tr>…</tr>}</Table> */
export function Table({ heads, children, empty }) {
  const rows = Array.isArray(children) ? children : [children];
  const hasRows = rows.filter(Boolean).length > 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full rounded bg-white shadow">
        <thead className="bg-gray-200">
          <tr>{heads.map((h) => <th key={h} className="p-2 text-left text-sm font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {hasRows ? children : (
            <tr><td colSpan={heads.length} className="p-3 text-center text-gray-500">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const BTN = {
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
  red: 'bg-red-500 hover:bg-red-600',
  green: 'bg-green-500 hover:bg-green-600',
  blue: 'bg-blue-500 hover:bg-blue-600',
};
export function SmallBtn({ color = 'blue', children, ...props }) {
  return <button {...props} className={`rounded px-2 py-1 text-sm text-white ${BTN[color]}`}>{children}</button>;
}

/** All admin button handlers in one place; `reload` refreshes the page's data afterwards. */
export function useAdminActions(reload) {
  const toast = useToast();

  const guard = async (fn) => {
    try { await fn(); reload(); } catch (e) { toast(e.message, 'error'); }
  };

  return {
    toggleCar: (car) => guard(async () => {
      const updated = await api.admin.toggleCar(car.id);
      toast(`Car "${updated.car_name}" availability updated.`, 'info');
    }),
    deleteCar: (car) => {
      if (!window.confirm(`Delete "${car.car_name}"? Its bookings will be deleted too.`)) return undefined;
      return guard(async () => { toast((await api.admin.deleteCar(car.id)).detail, 'error'); });
    },
    bookingAction: (booking, action) => guard(async () => {
      const res = await api.admin.bookingAction(booking.id, action);
      toast(res.detail, action === 'cancel' ? 'error' : 'success');
    }),
    toggleUser: (user) => guard(async () => { toast((await api.admin.toggleUser(user.id)).detail, 'info'); }),
  };
}

export function CarsTable({ cars, actions, withImage = false }) {
  const heads = withImage
    ? ['#', 'Image', 'Name', 'Model', 'Price', 'Route', 'Custom Allowed', 'Availability', 'Actions']
    : ['Name', 'Model', 'Price', 'Route', 'Availability', 'Actions'];
  return (
    <Table heads={heads} empty="No cars found">
      {cars.map((c, i) => (
        <tr key={c.id} className="border-b">
          {withImage && <td className="p-2">{i + 1}</td>}
          {withImage && (
            <td className="p-2">
              <img
                src={carImage(c)} alt=""
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                className="h-12 w-20 rounded object-cover"
              />
            </td>
          )}
          <td className="p-2">{c.car_name}</td>
          <td className="p-2">{c.model}</td>
          <td className="p-2">BDT {money(c.price)}</td>
          <td className="p-2">{c.route || (withImage ? '-' : 'Custom/None')}</td>
          {withImage && <td className="p-2">{c.allow_custom_route ? 'Yes' : 'No'}</td>}
          <td className="p-2">{c.availability ? 'Available' : 'Booked'}</td>
          <td className="space-x-2 whitespace-nowrap p-2">
            <Link to={`/admin/cars/${c.id}/edit`} className="inline-block rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700">Edit</Link>
            <SmallBtn color="yellow" onClick={() => actions.toggleCar(c)}>Toggle</SmallBtn>
            <SmallBtn color="red" onClick={() => actions.deleteCar(c)}>Delete</SmallBtn>
          </td>
        </tr>
      ))}
    </Table>
  );
}

export function BookingsTable({ bookings, actions }) {
  return (
    <Table heads={['ID', 'User', 'Car', 'Route', 'Duration', 'Total', 'Status', 'Pickup Time', 'Return Time', 'Actions']} empty="No bookings found">
      {bookings.map((b) => (
        <tr key={b.id} className="border-b">
          <td className="p-2">{b.id}</td>
          <td className="p-2">{b.user.name}</td>
          <td className="p-2">{b.car.car_name}</td>
          <td className="p-2">{b.final_route}</td>
          <td className="p-2">{b.duration}d</td>
          <td className="p-2 whitespace-nowrap">BDT {money(b.total_cost)}</td>
          <td className="p-2"><Badge status={b.booking_status} /></td>
          <td className="p-2 text-xs text-green-700 whitespace-nowrap">
            {b.pickup_time ? fmtDateTime(b.pickup_time) : <span className="text-gray-400">—</span>}
          </td>
          <td className="p-2 text-xs text-blue-700 whitespace-nowrap">
            {b.return_time ? fmtDateTime(b.return_time) : <span className="text-gray-400">—</span>}
          </td>
          <td className="space-x-2 whitespace-nowrap p-2">
            <SmallBtn color="green" onClick={() => actions.bookingAction(b, 'approve')}>Approve</SmallBtn>
            <SmallBtn color="red" onClick={() => actions.bookingAction(b, 'cancel')}>Cancel</SmallBtn>
            <SmallBtn color="blue" onClick={() => actions.bookingAction(b, 'complete')}>Complete</SmallBtn>
          </td>
        </tr>
      ))}
    </Table>
  );
}

export function UsersTable({ users, actions }) {
  return (
    <Table heads={['Name', 'Email', 'Status', 'Actions']} empty="No users found">
      {users.map((u) => (
        <tr key={u.id} className="border-b">
          <td className="p-2">{u.name}</td>
          <td className="p-2">{u.email}</td>
          <td className="p-2"><Badge status={u.account_status} /></td>
          <td className="p-2">
            <SmallBtn color="yellow" onClick={() => actions.toggleUser(u)}>
              {u.account_status === 'active' ? 'Deactivate' : 'Activate'}
            </SmallBtn>
          </td>
        </tr>
      ))}
    </Table>
  );
}
