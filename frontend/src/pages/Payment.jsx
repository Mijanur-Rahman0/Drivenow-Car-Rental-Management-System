import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import useAsync from '../utils/useAsync';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { money, plural } from '../utils/format';
import { CreditCard, Smartphone, Landmark, ShieldCheck, Check } from 'lucide-react';

/** 5 minute session timer (visual only, like the original) */
function Countdown() {
  const [secs, setSecs] = useState(300);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (secs === 0) return <strong className="text-[#e74c3c]">Expired</strong>;
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return <strong id="paymentCountdown" className="text-sage-dark">{mm}:{ss}</strong>;
}

const METHODS = [
  [CreditCard, 'Card'],
  [Smartphone, 'bKash'],
  [Landmark, 'Bank'],
];

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const redirected = useRef(false);

  const { data: booking, error } = useAsync(() => api.booking(bookingId), [bookingId]);
  const [method, setMethod] = useState('Card');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (redirected.current) return;
    if (error) {
      redirected.current = true;
      toast(error.status === 404 ? 'Booking not found.' : error.message, 'error');
      navigate('/dashboard', { replace: true });
    } else if (booking && (!booking.payment || booking.payment.payment_status !== 'pending')) {
      redirected.current = true;                         // nothing left to pay
      toast('This booking has already been processed.', 'info');
      navigate('/dashboard', { replace: true });
    }
  }, [booking, error, navigate, toast]);

  if (!booking || !booking.payment || booking.payment.payment_status !== 'pending') {
    return <div className="pt-[72px]"><Spinner /></div>;
  }

  const amount = `BDT ${money(booking.payment.amount)}`;

  const process = async (action) => {
    setBusy(true);
    setFormError('');
    try {
      const res = await api.processPayment(booking.id, action);
      toast(res.detail, action === 'success' ? 'success' : 'error');
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  const Line = ({ k, v }) => (
    <div className="flex justify-between text-sm"><span className="text-muted">{k}</span><span className="font-bold text-dark">{v}</span></div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pb-10 pt-[100px]">
      <div className="card w-full max-w-md p-8 shadow-lift">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warm text-dark">
          <CreditCard className="h-8 w-8 text-dark" />
        </div>
        <h2 className="mt-3 text-center text-2xl font-bold">Complete Payment</h2>
        <p className="mb-5 text-center text-sm text-muted">Session expires in <Countdown /></p>

        <Alert type="error">{formError}</Alert>

        <div className="mb-5 rounded-xl bg-dark p-5 text-center text-cream">
          <div className="text-xs font-bold uppercase tracking-widest text-cream/70">Total Amount Due</div>
          <div className="my-1 font-head text-3xl font-bold">{amount}</div>
          <div className="text-xs text-cream/70">
            {booking.car.car_name} · {plural(booking.duration, 'day')} · {booking.final_route}
          </div>
        </div>

        <div className="mb-5 space-y-1.5 rounded-xl bg-warm p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Booking Reference</div>
          <Line k="Booking ID" v={`#${booking.id}`} />
          <Line k="Car" v={booking.car.car_name} />
          <Line k="Route" v={booking.final_route} />
        </div>

        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Payment Method</div>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {METHODS.map(([Icon, name]) => (
            <button
              type="button" key={name} onClick={() => setMethod(name)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 text-sm font-semibold transition ${method === name ? 'border-dark bg-dark/5 text-dark' : 'border-dark/15 text-muted hover:border-dark/40'}`}
            >
              <Icon className="h-5 w-5" />
              <span>{name}</span>
            </button>
          ))}
        </div>

        <div className="mb-6 space-y-3">
          <div>
            <label className="label">Card Number (Simulation)</label>
            <input className="input font-mono tracking-widest" readOnly value="4242 4242 4242 4242" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Expiry</label><input className="input" readOnly value="12/26" /></div>
            <div><label className="label">CVV</label><input className="input" readOnly value="***" /></div>
          </div>
        </div>

        <div className="space-y-3">
          <button disabled={busy} onClick={() => process('success')} className="btn btn-primary flex w-full items-center justify-center gap-2 py-4 text-base">
            <Check className="h-5 w-5" /> Confirm Payment — {amount}
          </button>
          <button
            disabled={busy}
            onClick={() => window.confirm('Cancel this booking?') && process('fail')}
            className="btn btn-outline btn-sm w-full border-dark/15 text-muted"
          >
            Cancel Booking
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck className="h-4 w-4 text-muted" />
          This is a simulated payment interface. No real transaction will occur.
        </p>
      </div>
    </div>
  );
}
