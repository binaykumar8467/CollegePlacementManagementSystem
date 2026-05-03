// Renders the top navigation bar and adapts links based on the logged-in user.
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getRole, getUser } from "../lib/auth";
import api from "../lib/api";
import { hasUnseen, latestTimestamp, MODULE_KEYS } from "../lib/notifications";
import LoginMenu from "./LoginMenu";

const THEME_STORAGE_KEY = "cpms_theme_mode";

// Show a small notification indicator in the navigation bar.
function Dot({ show }) {
  if (!show) return null;
  return <span className="notif-dot" aria-hidden="true" />;
}

// Render the main navigation bar and role-aware menu links.
export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return window.sessionStorage.getItem(THEME_STORAGE_KEY) === "dark";
    } catch {
      return false;
    }
  });
  const [updates, setUpdates] = useState({ jobs: false, drives: false, notices: false, placements: false, interviews: false });

// Handle the logout logic used in this file.
  const logout = () => {
    clearAuth();
    navigate("/");
  };

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    try {
      if (isDarkMode) window.sessionStorage.setItem(THEME_STORAGE_KEY, "dark");
      else window.sessionStorage.removeItem(THEME_STORAGE_KEY);
    } catch {}
    return () => document.body.classList.remove("dark-theme");
  }, [isDarkMode]);

  useEffect(() => {
    if (role !== "student") return;
    let cancelled = false;

// Load  data needed by this screen.
    const load = async () => {
      try {
        const [jobsRes, drivesRes, noticesRes, placementsRes, interviewsRes] = await Promise.all([
          api.get("/api/jobs"),
          api.get("/api/drives"),
          api.get("/api/notices"),
          api.get("/api/placements"),
          api.get("/api/interviews/my")
        ]);
        if (cancelled) return;
        setUpdates({
          jobs: hasUnseen(MODULE_KEYS.jobs, latestTimestamp(jobsRes.data || [])),
          drives: hasUnseen(MODULE_KEYS.drives, latestTimestamp(drivesRes.data || [])),
          notices: hasUnseen(MODULE_KEYS.notices, latestTimestamp(noticesRes.data || [])),
          placements: hasUnseen(MODULE_KEYS.placements, latestTimestamp(placementsRes.data || [])),
          interviews: hasUnseen(MODULE_KEYS.interviews, latestTimestamp(interviewsRes.data || []))
        });
      } catch {
        if (!cancelled) setUpdates({ jobs: false, drives: false, notices: false, placements: false, interviews: false });
      }
    };

    load();
// Handle the handler logic used in this file.
    const handler = () => load();
    window.addEventListener("cpms-notifications-updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("cpms-notifications-updated", handler);
    };
  }, [role]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
// Handle the handle resize logic used in this file.
    const handleResize = () => {
      if (window.innerWidth > 820) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

// Convert this value into the format expected by the UI or API.
  const toggleTheme = () => setIsDarkMode((value) => !value);
// Handle the nav class logic used in this file.
  const navClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

// Handle the go home logic used in this file.
  const goHome = (event) => {
    event.preventDefault();
    if (location.pathname === "/" && !location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

// Handle the go to about logic used in this file.
  const goToAbout = (event) => {
    event.preventDefault();
    if (location.pathname === "/") {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", "/#about");
        return;
      }
    }
    navigate("/#about");
  };

  return (
    <div className={`nav${menuOpen ? " nav-open" : ""}`}>
      <div className="nav-left" style={{ display: "flex", color: "white", alignItems: "center", gap: "10px" }}>
        <strong style={{ fontSize: "18px" }}>CPMS</strong>
        {role && user?.name ? <span className="badge">{user.name}</span> : null}
      </div>

      <button
        type="button"
        className="nav-menu-toggle"
        onClick={() => setMenuOpen((value) => !value)}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="links">
        <a className={`nav-link${location.pathname === "/" && !location.hash ? " active" : ""}`} href="/" onClick={goHome}>Home</a>
        <NavLink
          className={navClass}
          to="/notices"
          style={() => ({ color: isDarkMode ? "#f8fbff" : "#111111" })}
        >
          <span className="notices-label" style={{ color: isDarkMode ? "#f8fbff" : "#111111" }}>Notices</span>
          <Dot show={role === "student" && updates.notices} />
        </NavLink>
        <a className={`nav-link${location.pathname === "/" && location.hash === "#about" ? " active" : ""}`} href="/#about" onClick={goToAbout}>About Us</a>
        <button className="theme-toggle-btn" type="button" onClick={toggleTheme} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"} title={isDarkMode ? "Light mode" : "Dark mode"}>
          {isDarkMode ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .34 0 .67.05 1A7 7 0 0 0 20 12.74c.33.03.67.05 1 .05Z" />
            </svg>
          )}
        </button>

        {role === "student" && <NavLink className={navClass} to="/student/dashboard">Student Dashboard</NavLink>}

        {role === "tpo" && (
          <>
            <NavLink className={navClass} to="/tpo/dashboard">TPO Dashboard</NavLink>
          </>
        )}

        {role ? (
          <>
            <button className="auth-action-btn" onClick={logout} style={{ marginLeft: "8px" }}>
              <span className="login-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="auth-menu-group">
            <LoginMenu variant="login" />
            <LoginMenu variant="signup" />
          </div>
        )}
      </div>
    </div>
  );
}
