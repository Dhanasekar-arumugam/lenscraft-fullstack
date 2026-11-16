import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Camera,
  Package,
  UsersRound,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import "../../styles/AdminDashboard.css";

const managementPages = [
  {
    title: "Manage Bookings",
    description: "Review customer bookings and update their status.",
    path: "/admin/bookings",
    icon: CalendarDays,
    number: "01",
  },
  {
    title: "Manage Services",
    description: "Create, edit, and manage photography services.",
    path: "/admin/services",
    icon: Camera,
    number: "02",
  },
  {
    title: "Manage Packages",
    description: "Update photography packages and pricing.",
    path: "/admin/packages",
    icon: Package,
    number: "03",
  },
  {
    title: "Manage Photographers",
    description: "Manage photographer profiles and availability.",
    path: "/admin/photographers",
    icon: UsersRound,
    number: "04",
  },
  {
    title: "Manage Portfolio",
    description: "Add, edit, and showcase your photography portfolio.",
    path: "/admin/portfolio",
    icon: Camera,
    number: "05",
  }
];

export default function AdminDashboard() {
  useEffect(() => {
    document.title = "Admin Dashboard | Lenscraft Studio";
  }, []);

  return (
    <main className="lc-admin-dashboard">
      <div className="lc-admin-container">
        <div className="lc-admin-topline">
          <span>
            <LayoutDashboard size={16} />
            STUDIO MANAGEMENT
          </span>

          <span className="lc-admin-secure">
            <ShieldCheck size={16} />
            STAFF AREA
          </span>
        </div>

        <section className="lc-admin-hero">
          <div className="lc-admin-hero-content">
            <div className="lc-admin-eyebrow">
              <Sparkles size={16} />
              LENSCRAFT CONTROL CENTER
            </div>

            <h1>
              Studio <em>Dashboard.</em>
            </h1>

            <p>
              Everything you need to manage your photography studio, all in one
              place.
            </p>

            <Link to="/admin/bookings" className="lc-admin-hero-link">
              View Bookings
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="lc-admin-hero-art">
            <Camera size={115} strokeWidth={0.7} />
          </div>
        </section>

        <div className="lc-admin-section-heading">
          <div>
            <span>YOUR WORKSPACE</span>
            <h2>Manage your studio</h2>
            <p>Select a section to manage your Lenscraft website.</p>
          </div>
        </div>

        <section className="lc-admin-grid">
          {managementPages.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path} className="lc-admin-card">
                <div className="lc-admin-card-top">
                  <div className="lc-admin-card-icon">
                    <Icon size={25} strokeWidth={1.7} />
                  </div>

                  <span className="lc-admin-card-number">{item.number}</span>
                </div>

                <div className="lc-admin-card-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <div className="lc-admin-card-bottom">
                  <span>OPEN MANAGEMENT</span>
                  <ArrowUpRight size={19} />
                </div>
              </Link>
            );
          })}
        </section>

        <div className="lc-admin-bottom-note">
          <ShieldCheck size={20} />
          <p>
            This dashboard is intended for authorized studio staff. All changes
            are processed through your Django backend.
          </p>
        </div>
      </div>
    </main>
  );
}
<Link to="/admin/portfolio">
  <Camera size={20} />
  Manage Portfolio
</Link>;