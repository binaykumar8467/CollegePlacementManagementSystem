// Prevents logged-in users from reopening signup or login pages.
import React from "react";
import { useLocation } from "react-router-dom";
import { getAuth } from "../lib/auth";
import AlreadyLoggedIn from "./AlreadyLoggedIn";

/**
 * If any user is logged in, do not allow visiting login/signup pages.
 * Shows message "logout first" and provides a logout button.
 */
// Prevent logged-in users from reopening login or signup pages.
export default function RequireLoggedOut({ children }) {
  const auth = getAuth();
  const location = useLocation();

  if (auth?.token && auth?.role) {
    const requestedPath = location?.pathname || "";
    const targetRole = requestedPath.startsWith("/tpo") ? "tpo" : "student";
    return <AlreadyLoggedIn targetRole={targetRole} />;
  }

  return children;
}
