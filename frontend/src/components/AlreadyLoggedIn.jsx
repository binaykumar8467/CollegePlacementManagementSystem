
import React from "react";
import { Link } from "react-router-dom";
import { clearAuth, getAuth } from "../lib/auth";

function dashboardFor(role) {
  if (role === "student") return "/student/dashboard";
  if (role === "tpo") return "/tpo/dashboard";
  return "/";
}

export default function AlreadyLoggedIn({ targetRole }) {
  const auth = getAuth();
  const currentRole = auth?.role || "user";

  const logout = () => {
    clearAuth();
    window.location.href = targetRole === "tpo" ? "/tpo/login" : "/student/login";
  };

  return (
    <div className="container">
      <div className="card hero" style={{ maxWidth: 780, margin: "0 auto" }}>
        <h2>Logout Required</h2>
        <p>
          You are already logged in as <b>{currentRole.toUpperCase()}</b>.
          <br />
          To access <b>{targetRole.toUpperCase()}</b> login or signup,
          please logout first.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={logout}>Logout</button>
          <Link className="btn secondary" to={dashboardFor(currentRole)}>Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
