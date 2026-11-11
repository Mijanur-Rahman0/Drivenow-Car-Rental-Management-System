import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { isLoggedIn, signOut } = useAuth();
  const linkCls = 'text-cream/70 transition hover:text-cream';
  return (
    <footer className="bg-dark text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="font-head text-2xl font-bold">Drive<span className="text-sage">Now</span></div>
            <p className="mt-3 max-w-sm text-sm text-cream/70">
              Premium car rental service for every journey across Bangladesh. Clean, reliable, and affordable.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-head text-lg text-cream">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {['home', 'cars', 'about', 'team'].map((id) => (
                <li key={id}><Link to={`/#${id}`} className={linkCls}>{id[0].toUpperCase() + id.slice(1)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-head text-lg text-cream">Account</h4>
            <ul className="space-y-2 text-sm">
              {isLoggedIn ? (
                <>
                  <li><Link to="/dashboard" className={linkCls}>Dashboard</Link></li>
                  <li><button onClick={signOut} className={linkCls}>Logout</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className={linkCls}>Login</Link></li>
                  <li><Link to="/register" className={linkCls}>Register</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-cream/15 pt-6 text-center text-xs text-cream/60">
          © 2024 DriveNow Car Rental · University Project · Django REST API + React + Tailwind
        </div>
      </div>
    </footer>
  );
}
