import { api } from '../../api';
import useAsync from '../../utils/useAsync';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { fmtDate, money } from '../../utils/format';
import { Table } from './adminShared';

export default function AdminPayments() {
  const { data, loading, error } = useAsync(() => api.admin.payments(), []);
  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return loading ? <Spinner /> : null;
  return (
    <Table heads={['Booking ID', 'User', 'Car', 'Amount', 'Status', 'Date']} empty="No payments found">
      {data.map((p) => (
        <tr key={p.id} className="border-b">
          <td className="p-2">{p.booking_id}</td>
          <td className="p-2">{p.user_name}</td>
          <td className="p-2">{p.car_name}</td>
          <td className="p-2">BDT {money(p.amount)}</td>
          <td className="p-2"><Badge status={p.payment_status} /></td>
          <td className="p-2">{fmtDate(p.transaction_time)}</td>
        </tr>
      ))}
    </Table>
  );
}
