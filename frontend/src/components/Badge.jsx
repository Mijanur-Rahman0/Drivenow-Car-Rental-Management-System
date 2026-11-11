import { cap } from '../utils/format';

const STYLES = {
  available: 'bg-sage/25 text-sage-dark',
  confirmed: 'bg-sage/30 text-sage-dark',
  success: 'bg-sage/30 text-sage-dark',
  active: 'bg-sage/30 text-sage-dark',
  booked: 'bg-dark/10 text-dark',
  completed: 'bg-dark/10 text-dark',
  pending: 'bg-warm/70 text-muted',
  cancelled: 'bg-[#fde8e8] text-[#c0392b]',
  failed: 'bg-[#fde8e8] text-[#c0392b]',
  inactive: 'bg-[#fde8e8] text-[#c0392b]',
};

/** <Badge status="confirmed" />  or  <Badge status="booked">Booked</Badge> */
export default function Badge({ status, children }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide ${STYLES[status] || 'bg-warm text-dark'}`}>
      {children ?? cap(status)}
    </span>
  );
}
