import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import { carImage, FALLBACK_IMAGE, money } from '../utils/format';

export default function CarCard({ car }) {
  const { isLoggedIn } = useAuth();

  let action;
  if (!isLoggedIn) action = <Link to="/login" className="btn btn-outline btn-sm">Login to Rent</Link>;
  else if (car.availability) action = <Link to={`/booking/${car.id}`} className="btn btn-primary btn-sm">Rent Now</Link>;
  else action = <button disabled className="btn btn-sm opacity-40">Unavailable</button>;

  return (
    <div className="group overflow-hidden rounded-2xl border border-dark/15 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-lift">
      <div className="relative h-48 overflow-hidden bg-warm">
        <img
          src={carImage(car)}
          alt={car.car_name}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          {car.availability ? <Badge status="available">Available</Badge> : <Badge status="booked">Booked</Badge>}
        </div>
      </div>
      <div className="p-5">
        <div className="font-head text-xl font-bold text-dark">{car.car_name}</div>
        <div className="text-sm text-muted">{car.model}</div>
        {car.description && <p className="mt-1.5 text-[.82rem] leading-relaxed text-muted">{car.description}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="font-head text-lg font-bold text-dark">
            BDT {money(car.price)} <span className="font-body text-xs font-normal text-muted">/day</span>
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
