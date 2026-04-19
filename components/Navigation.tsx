import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Apply from './pages/Apply';
import Status from './pages/Status';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Navigation from './components/Navigation';
import Footer from './sections/Footer';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white">
      {!isAdminRoute && <Navigation scrolled={scrolled} />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/apply"
            element={
              <PageTransition>
                <Apply />
              </PageTransition>
            }
          />
          <Route
            path="/status"
            element={
              <PageTransition>
                <Status />
              </PageTransition>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PageTransition>
                <AdminLogin />
              </PageTransition>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
