// Renders the student login form and submits student login requests.
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { saveAuth } from "../../lib/auth";
import { validateEmailOrPhone, validatePassword } from "../../lib/signupValidation";

// Render the student login page and handle authentication.
export default function StudentLogin() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

// Handle the on change identifier logic used in this file.
  const onChangeIdentifier = (value) => {
    setIdentifier(value);
    if (err) {
      const identifierError = validateEmailOrPhone(value);
      const passwordError = validatePassword(password);
      setErr(identifierError || passwordError || "");
    }
  };

// Handle the on change password logic used in this file.
  const onChangePassword = (value) => {
    setPassword(value);
    if (err) {
      const identifierError = validateEmailOrPhone(identifier);
      const passwordError = validatePassword(value);
      setErr(identifierError || passwordError || "");
    }
  };

// Handle the submit logic used in this file.
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const identifierError = validateEmailOrPhone(identifier);
    if (identifierError) {
      setErr(identifierError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErr(passwordError);
      return;
    }
    try {
      const res = await api.post("/api/auth/student/login", { identifier, password });
      saveAuth({ token: res.data.token, role: "student", user: res.data.user });
      nav("/student/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="student-signup-page student-login-page">
      <div className="student-signup-shell student-login-shell">
        <div className="student-signup-visual student-login-visual">
          <div className="student-signup-illustration student-login-illustration">
            <div className="student-signup-screen" />
            <div className="student-signup-desk" />
            <div className="student-signup-seat" />
            <div className="student-signup-character">
              <div className="student-signup-head" />
              <div className="student-signup-body" />
              <div className="student-signup-leg student-signup-leg-left" />
              <div className="student-signup-leg student-signup-leg-right" />
            </div>
          </div>
          <div className="student-signup-copy student-login-copy">
            <h2>Welcome back</h2>
            <p>Step back in with confidence and keep moving toward your next campus opportunity.</p>
            <div className="auth-visual-chips">
              <span>Dashboard access</span>
              <span>Stay updated</span>
            </div>
            <div className="auth-visual-stats">
              <div className="auth-visual-stat-card">
                <strong>Stay informed</strong>
                <small>See fresh notices, drives, and interviews as soon as you log in.</small>
              </div>
              <div className="auth-visual-stat-card">
                <strong>Keep moving</strong>
                <small>Continue your applications and track every next step clearly.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="student-signup-form-card student-login-form-card">
          <div className="student-signup-form-head student-login-form-head">
            <h1>Student Login</h1>
            <p>Enter your registered email and password to access your account.</p>
          </div>

          <form onSubmit={submit} className="student-signup-form student-login-form">
            <div>
              <label>Email or Phone</label>
              <input
                className="input student-signup-input"
                type="text"
                placeholder="Enter your email or phone number"
                value={identifier}
                onChange={(e) => onChangeIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                className="input student-signup-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
              />
            </div>

            <div className="form-error-slot">
              {err ? <p className="form-error">{err}</p> : null}
            </div>

            <button className="btn student-signup-submit" type="submit">Login</button>

            <div className="student-login-links">
              <Link to="/student/forgot-password">Forgot Password?</Link>
              <span>Don't have an account? <Link to="/student/signup">Signup</Link></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
