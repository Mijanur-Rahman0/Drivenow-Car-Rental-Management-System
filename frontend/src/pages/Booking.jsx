import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import useAsync from '../utils/useAsync';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { carImage, FALLBACK_IMAGE, money, plural } from '../utils/format';

const PRESETS = [[1, '1 Day'], [2, '2 Days'], [3, '3 Days'], [7, '1 Week']];

export default function Booking() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const redirected = useRef(false);

  const { data: car, error } = useAsync(() => api.car(carId), [carId]);

  const [preset, setPreset] = useState(1);          // 1 | 2 | 3 | 7 | 'custom'
  const [customDays, setCustomDays] = useState('');
  const [customRoute, setCustomRoute] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // car missing / not available -> back to the list
  useEffect(() => {
    if (redirected.current) return;
    if (error) {
      redirected.current = true;
      toast(error.status === 404 ? 'Car not found.' : error.message, 'error');
      navigate('/#cars', { replace: true });
    } else if (car && !car.availability) {
      redirected.current = true;
      toast(`${car.car_name} is not available.`, 'error');
      navigate('/#cars', { replace: true });
    }
  }, [car, error, navigate, toast]);

  if (!car || !car.availability) return <div className="pt-[72px]"><Spinner /></div>;

  const price = parseFloat(car.price);
  const days = preset === 'custom' ? Math.min(30, Math.max(1, parseInt(customDays, 10) || 1)) : preset;
  const routeText = car.allow_custom_route ? (customRoute.trim() || '—') : (car.route || 'Not specified');

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = { car_id: car.id, duration: days };
    if (car.allow_custom_route) {
      payload.custom_route = customRoute.trim();
      if (!payload.custom_route) return setFormError('Please enter your route.');
    }
    setSubmitting(true);
    try {
      const booking = await api.createBooking(payload);
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  const Row = ({ label, value }) => (
    <div className="flex justify-between border-b border-dark/10 py-3 text-sm">
      <span className="text-muted">{label}</span><span className="font-semibold text-dark">{value}</span>
    </div>
  );

  return (
    <div className="pt-[72px]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link to="/#cars" className="text-sm font-medium text-muted hover:text-dark">← Back to Cars</Link>
        <h2 className="mb-8 mt-2 text-3xl font-bold">Book Your Car</h2>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* form */}
          <form onSubmit={onSubmit} className="card p-6 sm:p-8">
            <h3 className="mb-6 text-xl font-bold">Rental Details</h3>
            <Alert type="error">{formError}</Alert>

            <div className="mb-6">
              <label className="label">Rental Duration</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(([d, label]) => (
                  <button
                    type="button" key={d} onClick={() => setPreset(d)}
                    className={`rounded-full border-2 px-5 py-2 text-sm font-semibold transition ${preset === d ? 'border-dark bg-dark text-cream' : 'border-dark/20 text-dark hover:border-dark'}`}
                  >{label}</button>
                ))}
                <button
                  type="button" onClick={() => setPreset('custom')}
                  className={`rounded-full border-2 px-5 py-2 text-sm font-semibold transition ${preset === 'custom' ? 'border-dark bg-dark text-cream' : 'border-dark/20 text-dark hover:border-dark'}`}
                >Custom</button>
              </div>
              {preset === 'custom' && (
                <input
                  type="number" min="1" max="30" autoFocus
                  value={customDays} onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Enter number of days" aria-label="Custom number of days"
                  className="input mt-3 w-52"
                />
              )}
            </div>

            <div className="mb-6">
              {car.allow_custom_route ? (
                <>
                  <label htmlFor="customRoute" className="label">Custom Route</label>
                  <input id="customRoute" className="input" maxLength={150} placeholder="Enter your route" value={customRoute} onChange={(e) => setCustomRoute(e.target.value)} />
                </>
              ) : (
                <>
                  <span className="label">Route</span>
                  <div className="input bg-cream">{car.route || 'Not specified'}</div>
                </>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-sage/30 bg-sage/10 p-4 text-sm font-medium text-sage-dark">
              ℹ️ By proceeding, you will be directed to the payment page. Booking is only confirmed after successful payment.
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full py-4 text-base">
              {submitting ? 'Creating booking…' : 'Proceed to Payment →'}
            </button>
          </form>

          {/* summary */}
          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h4 className="mb-4 font-head text-lg font-bold">Booking Summary</h4>
            <img
              src={carImage(car)} alt={car.car_name}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
              className="mb-4 h-44 w-full rounded-xl bg-warm object-cover"
            />
            <div className="mb-4">
              <div className="font-head text-xl font-bold text-dark">{car.car_name}</div>
              <div className="text-sm text-muted">{car.model}</div>
            </div>
            <Row label="Duration" value={plural(days, 'day')} />
            <Row label="Route" value={routeText} />
            <Row label="Rate per day" value={`BDT ${money(price)}`} />
            <div className="mt-4 flex justify-between rounded-xl bg-dark px-4 py-3 font-head text-lg font-bold text-cream">
              <span>Total</span><span>BDT {money(price * days)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
