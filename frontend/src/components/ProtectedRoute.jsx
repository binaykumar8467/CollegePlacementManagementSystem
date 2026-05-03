// Blocks unauthenticated or unauthorized users from opening protected routes.
import React from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../lib/auth";

// Block protected pages unless the user is logged in with the required role.
export default function ProtectedRoute({ role, children }) {
  const r = getRole();
  if (!r) return <Navigate to="/" replace />;
  if (role && r !== role) return <Navigate to="/" replace />;
  return children;
}
