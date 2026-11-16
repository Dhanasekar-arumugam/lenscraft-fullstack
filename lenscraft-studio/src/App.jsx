import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";

// ============================================
// SHARED COMPONENTS
// ============================================

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthInitializer from "./components/AuthInitializer";
import AdminRoute from "./components/AdminRoute";

// ============================================
// STYLES
// ============================================

import "./styles/PageLoader.css";
import "./styles/responsive.css";

// ============================================
// LAZY-LOADED PUBLIC PAGES
// ============================================

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Services = lazy(() => import("./pages/Services"));

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

const Profile = lazy(() => import("./pages/Profile"));

const PhotographerDetails = lazy(() => import("./pages/PhotographerDetails"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
// ============================================
// CUSTOMER PAGES
// ============================================

const Booking = lazy(() => import("./pages/Booking"));
const MyBookings = lazy(() => import("./pages/MyBookings"));

const BookPhotographer = lazy(() => import("./pages/BookPhotographer"));

// ============================================
// ADMIN PAGES
// ============================================

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPortfolio = lazy(() => import("./pages/admin/AdminPortfolio"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));

const AdminPhotographers = lazy(
  () => import("./pages/admin/AdminPhotographers"),
);

const AdminServices = lazy(() => import("./pages/admin/AdminServices"));

const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));

// ============================================
// SCROLL TO TOP
// ============================================

function ScrollTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

// ============================================
// PAGE LOADER
// ============================================

function PageLoader() {
  return (
    <div className="lens-loader" role="status" aria-live="polite">
      <div className="lens-loader-content">
        <div className="lens-loader-camera">
          <div className="lens-loader-ring">
            <div className="lens-loader-aperture">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="lens-loader-center" />
          </div>
        </div>

        <h2 className="lens-loader-title">
          LENS<span>CRAFT</span>
        </h2>

        <p className="lens-loader-subtitle">
          CAPTURING MOMENTS · CREATING MEMORIES
        </p>

        <div className="lens-loader-progress">
          <div className="lens-loader-progress-fill" />
        </div>

        <p className="lens-loader-caption">
          Preparing your experience
          <span className="lens-loader-dots">...</span>
        </p>
      </div>
    </div>
  );
}

// ============================================
// 404 PAGE
// ============================================

function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found | Lenscraft Studio";
  }, []);

  return (
    <main className="not-found">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>

      <h1>Lost in the frame?</h1>

      <p>This page doesn't exist.</p>

      <Link className="btn btn-gold" to="/">
        Return Home
      </Link>
    </main>
  );
}

// ============================================
// APPLICATION CONTENT
// ============================================

function AppContent() {
  const { pathname } = useLocation();

  // Pages without the main Navbar and Footer
  const authPages = ["/login", "/register", "/verify-email"];

  const isAuthPage = authPages.includes(pathname.replace(/\/+$/, "") || "/");

  return (
    <>
      <ScrollTop />

      {/* HIDE NAVBAR ON AUTH PAGES */}
      {!isAuthPage && <Navbar />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ====================================
              PUBLIC ROUTES
          ==================================== */}

          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />

          <Route path="/services" element={<Services />} />

          {/* ====================================
              AUTHENTICATION ROUTES
          ==================================== */}

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ====================================
              PROFILE
          ==================================== */}

          <Route path="/profile" element={<Profile />} />

          {/* ====================================
              PHOTOGRAPHERS
          ==================================== */}

          <Route path="/photographers/:id" element={<PhotographerDetails />} />

          <Route path="/book-photographer/:id" element={<BookPhotographer />} />

          {/* ====================================
              CUSTOMER BOOKINGS
          ==================================== */}

          <Route path="/bookings" element={<Booking />} />

          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/portfolio" element={<Portfolio />} />
          {/* ====================================
              ADMIN ROUTES
          ==================================== */}

          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="/admin/bookings" element={<AdminBookings />} />

            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/reviews" element={<AdminReviews />}/>
            <Route path="/admin/packages" element={<AdminPackages />} />
            <Route path="/admin/portfolio" element={<AdminPortfolio />} />
            <Route
              path="/admin/photographers"
              element={<AdminPhotographers />}
            />
          </Route>

          {/* ====================================
              404
          ==================================== */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* HIDE FOOTER ON AUTH PAGES */}
      {!isAuthPage && <Footer />}
    </>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function App() {
  return (
    <AuthInitializer>
      <AppContent />
    </AuthInitializer>
  );
}
