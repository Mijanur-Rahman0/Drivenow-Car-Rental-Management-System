import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, LogIn, UserPlus, X } from 'lucide-react';

const LINKS = [['home', 'Home'], ['cars', 'Cars'], ['about', 'About'], ['team', 'Team']];

export default function Navbar() {
  const { isLoggedIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className={`fixed inset-x-0 top-0 z-[1000] flex h-[72px] items-center justify-between border-b border-dark/15 bg-cream/90 px-5 backdrop-blur-md transition-shadow md:px-10 ${scrolled ? 'shadow-soft' : ''}`}>
        <Link to="/" className="font-head text-2xl font-bold tracking-tight text-dark">
          Drive<span className="text-sage-dark">Now</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map(([id, label]) => (
            <li key={id}>
              <Link to={`/#${id}`} className="text-[.95rem] font-medium text-dark/80 transition hover:text-dark">{label}</Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
              <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>

        <button aria-label="Menu" onClick={() => setOpen(true)} className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden">
          <span className="h-0.5 w-6 bg-dark" /><span className="h-0.5 w-6 bg-dark" /><span className="h-0.5 w-6 bg-dark" />
        </button>
      </nav>

      {/* mobile drawer */}
      {open && <div className="fixed inset-0 z-[1100] bg-dark/50 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed right-0 top-0 z-[1200] h-full w-72 bg-cream p-6 shadow-lift transition-transform duration-300 md:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <button aria-label="Close menu" onClick={() => setOpen(false)} className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg text-dark hover:bg-dark/10">
          <X className="h-6 w-6" />
        </button>
        <ul className="space-y-1 text-lg">
          {LINKS.map(([id, label]) => (
            <li key={id}><Link onClick={() => setOpen(false)} to={`/#${id}`} className="block rounded-lg px-3 py-2 hover:bg-warm">{label}</Link></li>
          ))}
          {isLoggedIn ? (
            <>
              <li>
                <Link onClick={() => setOpen(false)} to="/dashboard" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-warm">
                  <LayoutDashboard className="h-5 w-5 text-dark" />
                  Dashboard
                </Link>
              </li>
              <li>
                <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-warm">
                  <LogOut className="h-5 w-5 text-dark" />
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link onClick={() => setOpen(false)} to="/login" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-warm">
                  <LogIn className="h-5 w-5 text-dark" />
                  Login
                </Link>
              </li>
              <li>
                <Link onClick={() => setOpen(false)} to="/register" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-warm">
                  <UserPlus className="h-5 w-5 text-dark" />
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </aside>
    </>
  );
}
