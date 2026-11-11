export default function Spinner({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sage border-t-transparent" />
      <span>{text}</span>
    </div>
  );
}
