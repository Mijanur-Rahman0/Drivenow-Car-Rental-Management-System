import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/** On route change: jump to #hash if there is one, otherwise back to the top. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView?.({ behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
  return null;
}

/** Navbar + page + footer for all public/user pages. */
export default function Layout() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main className="min-h-screen"><Outlet /></main>
      <Footer />
    </>
  );
}
