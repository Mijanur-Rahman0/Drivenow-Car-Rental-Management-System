const STYLES = {
  error: 'bg-[#fde8e8] text-[#c0392b] border-[#f5b7b1]',
  success: 'bg-sage/25 text-sage-dark border-sage/50',
  info: 'bg-warm text-dark border-dark/15',
};

/** Inline message box: <Alert type="error">Wrong password</Alert> — renders nothing when empty */
export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div role="alert" className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${STYLES[type] || STYLES.info}`}>
      {children}
    </div>
  );
}
