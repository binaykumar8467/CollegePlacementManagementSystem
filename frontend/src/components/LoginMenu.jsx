// Displays quick navigation links for the available login options.
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const MENU_CONFIG = {
  login: {
    label: "Login",
    items: [
      { to: "/student/login", text: "Student Login" },
      { to: "/tpo/login", text: "TPO Login" }
    ],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    )
  },
  signup: {
    label: "Sign Up",
    items: [
      { to: "/student/signup", text: "Student Signup" },
      { to: "/tpo/signup", text: "TPO Signup" }
    ],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </svg>
    )
  }
};

// Render the shortcut links for login and signup navigation.
export default function LoginMenu({ className = "", variant = "login" }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const menu = MENU_CONFIG[variant] || MENU_CONFIG.login;

  useEffect(() => {
// Handle the handle click outside logic used in this file.
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`login-menu ${className}`.trim()} ref={wrapperRef}>
      <button
        type="button"
        className="login-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="login-menu-icon" aria-hidden="true">
          {menu.icon}
        </span>
        <span>{menu.label}</span>
      </button>

      {open ? (
        <div className="login-menu-dropdown" role="menu">
          {menu.items.map((item) => (
            <Link key={item.to} to={item.to} className="login-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              {item.text}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
