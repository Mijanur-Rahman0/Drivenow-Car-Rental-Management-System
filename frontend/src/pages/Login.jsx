import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/AuthCard';
import Alert from '../components/Alert';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const { isLoggedIn, isAdmin, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const flash = location.state?.message;
  const flashType = location.state?.type || 'info';

  if (isLoggedIn) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(email.trim(), password);
      signIn(token, user);
      if (user.is_superuser) { navigate('/admin', { replace: true }); return; }
      const from = location.state?.from;
      // only follow in-app redirects
      navigate(from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      footer={<>Don't have an account? <Link to="/register" className="font-semibold text-dark underline">Create one</Link></>}
    >
      {!error && <Alert type={flashType}>{flash}</Alert>}
      <Alert type="error">{error}</Alert>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5">
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>
    </AuthCard>
  );
}
