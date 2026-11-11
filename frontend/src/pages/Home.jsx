import { Link } from 'react-router-dom';
import { api } from '../api';
import useAsync from '../utils/useAsync';
import CarCard from '../components/CarCard';
import Reveal from '../components/Reveal';
import Spinner from '../components/Spinner';
import { plural } from '../utils/format';
import { Car, AlertTriangle, MapPin } from 'lucide-react';

const TEAM = [
  { name: 'Estiak Ahmmed Sami', id: '20245103039', role: 'Frontend' },
  { name: 'Sayma Rahman', id: '20245103060', role: 'Frontend' },
  { name: 'Mijanur Rahman', id: '20245103053', role: 'Backend' },
  { name: 'Nafisa Akter', id: '20245103042', role: 'Database' },
];

function SectionHeader({ eyebrow, title, center = true }) {
  return (
    <Reveal className={`mb-12 ${center ? 'text-center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      <div className={`section-line ${center ? 'mx-auto' : ''}`} />
    </Reveal>
  );
}

export default function Home() {
  const cars = useAsync(() => api.cars(), []);
  const routes = useAsync(() => api.routes(), []);
  const shownCars = (cars.data || []).slice(0, 8);

  const totalCars = cars.data ? cars.data.length : null;
  const totalRoutes = routes.data ? routes.data.length : null;

  const stats = [
    [totalCars !== null ? `${totalCars}+` : '...', 'Vehicles'],
    [totalRoutes !== null ? `${totalRoutes}` : '...', 'Routes'],
    ['100%', 'Secure'],
    ['24/7', 'Support'],
  ];

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section id="home" className="relative flex min-h-screen scroll-mt-20 items-center overflow-hidden pt-[72px]">
        <div className="absolute inset-0 bg-cover bg-center brightness-[.55]" style={{ backgroundImage: "url('/images/bg-image.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-dark/70 via-dark/30 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-5">
          <div className="max-w-2xl text-cream">
            <span className="mb-4 inline-block rounded-full border border-sage/50 bg-sage/20 px-4 py-1 text-xs font-bold uppercase tracking-[.14em] text-sage">
              Premium Car Rental · Bangladesh
            </span>
            <h1 className="text-4xl font-black leading-tight text-cream md:text-6xl">
              Drive in <em className="text-sage">Comfort</em>, Travel with <em className="text-sage">Style</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cream/85">
              Choose from our curated fleet of reliable vehicles. From city commutes to long-distance journeys — we have the perfect car for every route.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/#cars" className="btn btn-sage">Browse Cars</Link>
              <Link to="/register" className="btn border-2 border-cream/50 text-cream hover:bg-cream hover:text-dark">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="scroll-mt-20 bg-warm/50 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Who We Are</span>
            <h2 className="text-3xl font-bold md:text-4xl">Reliable Rentals, Every Journey</h2>
            <div className="section-line" />
            <p className="mt-6 text-muted">
              DriveNow is a premium car rental platform designed to make travel across Bangladesh seamless and comfortable. Whether you're commuting within Dhaka or heading to Chittagong, Sylhet, Khulna, or Noakhali — we have you covered.
            </p>
            <p className="mt-4 text-muted">
              Our platform offers transparent pricing, instant booking confirmation, and a diverse fleet of well-maintained vehicles for every need and budget.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map(([n, l]) => (
                <div key={l} className="rounded-xl border border-dark/15 bg-white p-4 text-center">
                  <div className="font-head text-2xl font-bold text-dark">{n}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-dark to-dark-hover text-cream shadow-lift">
              <Car className="h-20 w-20 text-sage" />
              <p className="mt-3 text-cream/70">Premium Fleet Available</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CARS ═══ */}
      <section id="cars" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeader eyebrow="Our Fleet" title="Choose Your Ride" />
          {cars.loading && <Spinner text="Loading cars…" />}
          {cars.error && (
            <p className="flex items-center justify-center gap-2 py-12 text-center text-muted">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {cars.error.message}
            </p>
          )}
          {!cars.loading && !cars.error && !shownCars.length && (
            <p className="flex items-center justify-center gap-2 py-12 text-center text-muted">
              <Car className="h-5 w-5" /> No cars available yet.
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {shownCars.map((car, i) => (
              <Reveal key={car.id} delay={(i % 4) * 80}><CarCard car={car} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROUTES ═══ */}
      <section id="routes" className="scroll-mt-20 bg-warm py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeader eyebrow="Destinations" title="Available Routes" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(routes.data || []).map((r) => (
              <div key={r.value} className="rounded-2xl border border-dark/15 bg-white p-7 text-center transition hover:-translate-y-1 hover:shadow-soft">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-warm text-dark">
                  <MapPin className="h-7 w-7 text-dark" />
                </div>
                <div className="font-head font-bold text-dark">{r.label}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">{plural(r.car_count, 'Car')} Available</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section id="team" className="scroll-mt-20 bg-dark py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="mb-12 text-center">
            <span className="eyebrow !text-sage">Development Team</span>
            <h2 className="text-3xl font-bold !text-cream md:text-4xl">Meet the Builders</h2>
            <div className="section-line mx-auto" />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m, i) => (
              <Reveal key={m.id} delay={i * 80}>
                <div className="rounded-2xl border border-cream/10 bg-cream/5 p-7 text-center text-cream transition hover:-translate-y-1 hover:bg-cream/10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage font-head text-2xl font-bold text-dark">{m.name[0]}</div>
                  <div className="font-head text-lg font-bold">{m.name}</div>
                  <div className="mt-1 text-xs text-cream/60">ID: {m.id}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-wider text-sage">{m.role}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
