import { useEffect, useRef, useState } from 'react';

/** Fades + slides its children in the first time they scroll into view. */
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}
