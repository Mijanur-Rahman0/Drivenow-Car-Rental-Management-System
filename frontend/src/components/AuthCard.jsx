import { Link } from 'react-router-dom';

/** The centred white card used by Login and Register. */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream via-warm to-sage/40 px-4 py-10">
      <div className="card w-full max-w-md p-8 shadow-lift sm:p-10">
        <Link to="/" className="mb-6 block text-center font-head text-3xl font-bold tracking-tight text-dark">
          Drive<span className="text-sage-dark">Now</span>
        </Link>
        <h2 className="text-center text-2xl font-bold">{title}</h2>
        <p className="mb-6 mt-1 text-center text-sm text-muted">{subtitle}</p>
        {children}
        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted/70">
          <span className="h-px flex-1 bg-dark/15" />or<span className="h-px flex-1 bg-dark/15" />
        </div>
        <div className="text-center">
          <Link to="/" className="text-sm font-medium text-muted hover:text-dark">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
