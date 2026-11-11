export const money = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const plural = (n, word) => `${n} ${word}${Number(n) === 1 ? '' : 's'}`;

export const fmtDate = (iso, long = false) =>
  new Date(iso).toLocaleDateString(
    'en-US',
    long ? { month: 'long', day: '2-digit', year: 'numeric' } : { month: 'short', day: '2-digit', year: 'numeric' },
  );

export const FALLBACK_IMAGE = '/images/car1.png';

/** Best image for a car: uploaded file -> bundled car image -> rotating default */
export function carImage(car) {
  if (car.image_url) return car.image_url;
  const name = car.image_name || '';
  if (/^car[1-8]\.png$/.test(name)) return `/images/${name}`;
  return `/images/car${(((car.id || 1) - 1) % 8) + 1}.png`;
}
