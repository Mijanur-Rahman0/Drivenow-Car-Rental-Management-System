import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/AuthCard';
import Alert from '../components/Alert';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) return <Navigate to="/dashboard" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      await api.register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/login', { state: { message: 'Account created! Please log in.', type: 'success' } });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join DriveNow and start your journey"
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-dark underline">Sign in</Link></>}
    >
      <Alert type="error">{error}</Alert>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full Name</label>
          <input id="name" className="input" placeholder="Your full name" value={form.name} onChange={set('name')} required autoFocus />
        </div>
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput id="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" minLength={8} />
        </div>
        <div>
          <label htmlFor="password2" className="label">Confirm Password</label>
          <PasswordInput id="password2" value={form.password2} onChange={set('password2')} placeholder="Repeat your password" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5">
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>
    </AuthCard>
  );
}
