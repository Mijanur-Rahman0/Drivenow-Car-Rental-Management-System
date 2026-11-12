import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import useAsync from '../utils/useAsync';
import Badge from '../components/Badge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { carImage, cap, FALLBACK_IMAGE, fmtDate, fmtDateTime, money, plural } from '../utils/format';
import { MapPin, Calendar, ClipboardList, Car, CheckCircle2, LogIn, LogOut } from 'lucide-react';

function BookingCard({ b, showPay, onReturn }) {
  const [returning, setReturning] = useState(false);

  const handleReturn = async () => {
    if (!window.confirm('গাড়ি ফেরত দিতে চান?')) return;
    setReturning(true);
    try {
      await onReturn(b.id);
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dark/15 bg-white p-4">
      <div className="grid items-start gap-4 sm:grid-cols-[120px_1fr_auto]">
        <img
          src={carImage(b.car)} alt={b.car.car_name}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
          className="h-20 w-full rounded-xl bg-warm object-cover sm:w-[120px]"
        />
        <div>
          <div className="font-head text-lg font-bold text-dark">{b.car.car_name}</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-dark/70" /> {b.final_route}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-dark/70" /> {plural(b.duration, 'day')}</span>
            <span>Booked: {fmtDate(b.booking_date)}</span>
          </div>

          {/* Pickup & Return times */}
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {b.pickup_time && (
              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                <LogIn className="h-3.5 w-3.5" />
                Pickup: {fmtDateTime(b.pickup_time)}
              </span>
            )}
            {b.return_time && (
              <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                <LogOut className="h-3.5 w-3.5" />
                Returned: {fmtDateTime(b.return_time)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 sm:text-right">
          <div className="font-head text-lg font-bold text-dark">BDT {money(b.total_cost)}</div>
          <Badge status={b.booking_status} />
          {showPay && b.booking_status === 'pending' && (
            <div><Link to={`/payment/${b.id}`} className="btn btn-primary btn-sm mt-1">Pay Now</Link></div>
          )}
          {/* Return Car button — only for confirmed bookings */}
          {b.booking_status === 'confirmed' && onReturn && (
            <div>
              <button
                onClick={handleReturn}
                disabled={returning}
                className="btn btn-sm mt-1 inline-flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {returning ? 'Returning…' : 'Return Car'}
              </button>
            </div>
          )}
          {!showPay && b.payment && (
            <div className="text-xs text-muted">Payment: <Badge status={b.payment.payment_status} /></div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dark/20 bg-white/60 py-14 text-center text-muted">
      {Icon && <Icon className="mb-3 h-10 w-10 text-muted" />}
      <p>{text}</p>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, updateUser, signOut } = useAuth();
  const [tab, setTab] = useState('current');
  const [bookings, setBookings] = useState([]);
  const { data, loading, error } = useAsync(() => Promise.all([api.me(), api.bookings()]), []);
  const [me] = data || [null, []];

  useEffect(() => {
    if (data) setBookings(data[1] || []);
  }, [data]);

  useEffect(() => { if (me) updateUser(me); }, [me, updateUser]);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const current = bookings.filter((b) => ['pending', 'confirmed'].includes(b.booking_status));
  const history = bookings.filter((b) => ['completed', 'cancelled'].includes(b.booking_status));

  const handleReturn = async (bookingId) => {
    const res = await api.returnCar(bookingId);
    // Update the booking in state
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? res.booking : b))
    );
  };

  const tabs = [['current', 'Current Bookings'], ['history', 'Rental History'], ['profile', 'My Profile']];
  const stats = [
    [ClipboardList, bookings.length, 'Total Bookings'],
    [Car, current.length, 'Active Rentals'],
    [CheckCircle2, history.length, 'Completed'],
  ];

  return (
    <div className="pt-[72px]">
      {/* header */}
      <div className="bg-dark py-10">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage font-head text-2xl font-bold text-dark">
            {(me?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="text-cream">
            <div className="font-head text-2xl font-bold">{me?.name || 'Loading…'}</div>
            <div className="text-sm text-cream/70">{me?.email}</div>
            <div className="mt-1 inline-block rounded-full bg-sage/25 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-sage">Member</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {error && <Alert type="error">{error.message}</Alert>}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map(([StatIcon, n, label]) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-dark/15 bg-white p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warm text-dark">
                <StatIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-head text-2xl font-bold text-dark">{n}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-dark/15">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-5 py-3 text-sm font-semibold transition ${tab === id ? 'border-dark text-dark' : 'border-transparent text-muted hover:text-dark'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <Spinner />}

        {!loading && tab === 'current' && (
          <div className="space-y-4">
            {current.length
              ? current.map((b) => <BookingCard key={b.id} b={b} showPay onReturn={handleReturn} />)
              : <Empty icon={Car} text="No active bookings."><Link to="/#cars" className="btn btn-primary btn-sm mt-4">Browse Cars</Link></Empty>}
          </div>
        )}

        {!loading && tab === 'history' && (
          <div className="space-y-4">
            {history.length
              ? history.map((b) => <BookingCard key={b.id} b={b} />)
              : <Empty icon={ClipboardList} text="No rental history yet." />}
          </div>
        )}

        {tab === 'profile' && me && (
          <div className="card max-w-lg p-8">
            <h3 className="mb-6 text-xl font-bold">Account Information</h3>
            <dl className="divide-y divide-dark/15 text-sm">
              {[['Full Name', me.name], ['Email', me.email]].map(([k, v]) => (
                <div key={k} className="flex py-3"><dt className="w-36 font-semibold text-muted">{k}</dt><dd className="font-semibold text-dark">{v}</dd></div>
              ))}
              <div className="flex items-center py-3"><dt className="w-36 font-semibold text-muted">Account Status</dt><dd><Badge status={me.account_status}>{cap(me.account_status)}</Badge></dd></div>
              <div className="flex py-3"><dt className="w-36 font-semibold text-muted">Member Since</dt><dd className="font-semibold text-dark">{fmtDate(me.date_joined, true)}</dd></div>
            </dl>
            <div className="mt-6 flex gap-3">
              <Link to="/#cars" className="btn btn-primary btn-sm">Browse Cars</Link>
              <button onClick={signOut} className="btn btn-outline btn-sm">Logout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
