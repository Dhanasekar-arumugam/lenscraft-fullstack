import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

import {
  LogOut,
  UserRound,
  CalendarDays,
  LogIn,
  UserPlus,
  ChevronDown,
  ArrowUpRight,
  Camera,
  LayoutDashboard,
} from "lucide-react";

import NotificationBell from "./NotificationBell";
import { logoutUser } from "../api/authService";
import "../styles/Navbar.css";

const readUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("lenscraft_user") || "null");
  } catch {
    return null;
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState(readUser);
  const [logoError, setLogoError] = useState(false);

  const isHome = location.pathname === "/";
  const isAdmin = user?.is_staff === true;

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About Us" },
    { path: "/services", label: "Services" },
    { path: "/portfolio", label: "Portfolio" },
    { path: "/contact", label: "Contact" },
  ];

  // ============================================
  // SCROLL EFFECT
  // ============================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 35);
    };

    // Always reset scroll when navigating to Home.
    if (location.pathname === "/") {
      window.scrollTo(0, 0);
      setScrolled(false);
    } else {
      handleScroll();
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  // ============================================
  // AUTH STATE LISTENER
  // ============================================

  useEffect(() => {
    const updateUser = () => {
      setUser(readUser());
    };

    window.addEventListener("lenscraft-auth-change", updateUser);
    window.addEventListener("storage", updateUser);

    updateUser();

    return () => {
      window.removeEventListener("lenscraft-auth-change", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  // ============================================
  // CLOSE MENUS ON ROUTE CHANGE
  // ============================================

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // ============================================
  // MOBILE SCROLL LOCK
  // ============================================

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1050px)");

    const previousOverflow = document.body.style.overflow;

    const updateLock = () => {
      document.body.style.overflow =
        open && media.matches ? "hidden" : previousOverflow;
    };

    updateLock();

    media.addEventListener("change", updateLock);

    return () => {
      media.removeEventListener("change", updateLock);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // ============================================
  // OUTSIDE CLICK AND ESCAPE
  // ============================================

  useEffect(() => {
    const handleOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }

      if (
        open &&
        navRef.current &&
        !navRef.current.contains(event.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // ============================================
  // CLOSE MENUS
  // ============================================

  const closeMenus = () => {
    setOpen(false);
    setProfileOpen(false);
  };

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();

      sessionStorage.removeItem("lenscraft_user");

      setUser(null);
      closeMenus();

      window.dispatchEvent(new Event("lenscraft-auth-change"));

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  // ============================================
  // PROFILE ACTIVE STATE
  // ============================================

  const profileActive =
    ["/profile", "/my-bookings", "/login", "/register"].includes(
      location.pathname,
    ) || location.pathname.startsWith("/admin/");

  // ============================================
  // RENDER
  // ============================================

  return (
    <header
      className={[
        "navbar",
        "lens-navbar",
        scrolled ? "scrolled" : "at-top",
        isHome ? "navbar-home" : "navbar-inner-page",
        open ? "mobile-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="nav-inner">
        {/* LOGO */}

        <Link
          to="/"
          className="brand"
          onClick={closeMenus}
          aria-label="Lenscraft Studio Home"
        >
          {!logoError ? (
            <img
              src={`${import.meta.env.BASE_URL}images/LensCraft-Logo.png`}
              alt="Lenscraft Studio"
              className="nav-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="brand-fallback">
              <Camera size={25} />
              <span className="brand-name">
                LENSCRAFT
                <span>STUDIO</span>
              </span>
            </span>
          )}
        </Link>

        {/* MOBILE ACTIONS */}

        <div className="nav-mobile-actions">
          {user && (
            <div className="nav-notification nav-notification-mobile">
              <NotificationBell key={user.id ?? user.email} />
            </div>
          )}

          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => {
              setOpen((prev) => !prev);
              setProfileOpen(false);
            }}
          >
            <span className={`lens-menu-icon ${open ? "is-open" : ""}`}>
              <span />
              <span />
            </span>
          </button>
        </div>

        {/* MAIN NAVIGATION */}

        <nav
          ref={navRef}
          id="main-navigation"
          className={`nav-links ${open ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={closeMenus}
              className="nav-main-link"
              style={{
                "--nav-index": index,
              }}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* DESKTOP NOTIFICATION */}

          {user && (
            <div className="nav-notification nav-notification-desktop">
              <NotificationBell key={user.id ?? user.email} />
            </div>
          )}

          {/* PROFILE DROPDOWN */}

          <div
            ref={dropdownRef}
            className={`profile-dropdown ${profileOpen ? "dropdown-open" : ""}`}
          >
            <button
              type="button"
              className={`profile-trigger ${
                profileActive ? "profile-active" : ""
              }`}
              aria-haspopup="true"
              aria-expanded={profileOpen}
              aria-controls="profile-dropdown-menu"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <span className="profile-avatar">
                <UserRound size={18} />
              </span>

              <span className="profile-trigger-text">
                {user
                  ? user.first_name || user.username || "My Account"
                  : "Profile"}
              </span>

              <ChevronDown
                size={15}
                className={`profile-chevron ${profileOpen ? "rotated" : ""}`}
              />
            </button>

            {profileOpen && (
              <div id="profile-dropdown-menu" className="profile-menu">
                {user ? (
                  <>
                    <div className="profile-menu-header">
                      <div className="profile-menu-avatar">
                        <UserRound size={22} />
                      </div>

                      <div className="profile-menu-user-info">
                        <strong>
                          {user.first_name || user.username || "Lenscraft User"}
                        </strong>

                        <span>{user.email || "My Account"}</span>
                      </div>
                    </div>

                    <div className="profile-menu-divider" />

                    <NavLink
                      to="/profile"
                      className="profile-menu-item"
                      onClick={closeMenus}
                    >
                      <UserRound size={18} />
                      <span>My Profile</span>
                      <ArrowUpRight size={14} className="item-arrow" />
                    </NavLink>

                    <NavLink
                      to="/my-bookings"
                      className="profile-menu-item"
                      onClick={closeMenus}
                    >
                      <CalendarDays size={18} />
                      <span>My Bookings</span>
                      <ArrowUpRight size={14} className="item-arrow" />
                    </NavLink>

                    {isAdmin && (
                      <NavLink
                        to="/admin/dashboard"
                        className="profile-menu-item admin-dashboard-link"
                        onClick={closeMenus}
                      >
                        <LayoutDashboard size={18} />
                        <span>Admin Dashboard</span>
                        <ArrowUpRight size={14} className="item-arrow" />
                      </NavLink>
                    )}

                    <div className="profile-menu-divider" />

                    <button
                      type="button"
                      className="profile-menu-item profile-logout"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <LogOut size={18} />
                      <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="profile-guest-header">
                      <div className="profile-menu-avatar">
                        <UserRound size={22} />
                      </div>

                      <strong>Welcome to Lenscraft</strong>
                      <p>Sign in to manage your bookings.</p>
                    </div>

                    <div className="profile-menu-divider" />

                    <NavLink
                      to="/login"
                      className="profile-menu-item"
                      onClick={closeMenus}
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                      <ArrowUpRight size={14} className="item-arrow" />
                    </NavLink>

                    <NavLink
                      to="/register"
                      className="profile-menu-item"
                      onClick={closeMenus}
                    >
                      <UserPlus size={18} />
                      <span>Create Account</span>
                      <ArrowUpRight size={14} className="item-arrow" />
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
