import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { validateTpoSignup } from "../../lib/signupValidation";

export default function TpoSignup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    collegeName: "",
    phone: "",
    previousPassword: ""
  });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [needsPreviousPassword, setNeedsPreviousPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get("/")
      .catch(() => {});
  }, []);

  const onChange = (k, v) => {
    setForm((s) => {
      const nextForm = { ...s, [k]: v };
      if (submitted) {
        setErr(validateTpoSignup(nextForm, needsPreviousPassword));
      }
      return nextForm;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setErr("");
    setMsg("");
    const validationError = validateTpoSignup(form, needsPreviousPassword);
    if (validationError) {
      setErr(validationError);
      return;
    }
    try {
      await api.post("/api/auth/tpo/signup", form);
      setMsg("Account successfully created");
      setForm({
        name: "",
        email: "",
        password: "",
        collegeName: "",
        phone: "",
        previousPassword: ""
      });
      setSubmitted(false);
      setNeedsPreviousPassword(false);
      setTimeout(() => nav("/"), 1200);
    } catch (e2) {
      const message = e2?.response?.data?.message || "Signup failed";
      if (/Existing TPO password required/i.test(message)) {
        setNeedsPreviousPassword(true);
      }
      setErr(message);
    }
  };

  return (
    <>
      {msg ? <div className="success-toast">Account successfully created</div> : null}
      <div className="student-signup-page tpo-auth-page">
        <div className="student-signup-shell tpo-auth-shell">
          <div className="student-signup-visual tpo-auth-visual">
            <div className="student-signup-illustration tpo-auth-illustration">
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
            <div className="student-signup-copy tpo-auth-copy">
              <h2>Lead placements with clarity</h2>
              <p>Create your TPO account and manage campus hiring with confidence and control.</p>
              <div className="auth-visual-chips">
                <span>Structured workflow</span>
                <span>Session tracking</span>
              </div>
              <div className="auth-visual-stats">
                <div className="auth-visual-stat-card">
                  <strong>Central control</strong>
                  <small>Manage students, jobs, drives, notices, and placements from one dashboard.</small>
                </div>
                <div className="auth-visual-stat-card">
                  <strong>Better visibility</strong>
                  <small>Keep every session organized and every update easy to track.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="student-signup-form-card tpo-auth-form-card">
            <div className="student-signup-form-head">
              <h1>TPO Signup</h1>
              <p>Create the TPO account. Use previous password only while changing TPO.</p>
            </div>

            <form onSubmit={submit} className="student-signup-form tpo-auth-form">
              <div>
                <label>Name</label>
                <input className="input student-signup-input" placeholder="Enter your full name" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
              </div>

              <div>
                <label>Email</label>
                <input className="input student-signup-input" type="email" placeholder="Enter your email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
              </div>

              <div>
                <label>Phone</label>
                <input className="input student-signup-input" type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="Enter your phone number" maxLength="10" value={form.phone} onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
              </div>

              <div>
                <label>Password</label>
                <input className="input student-signup-input" type="password" placeholder="Create password" minLength="6" value={form.password} onChange={(e) => onChange("password", e.target.value)} />
              </div>

              <div>
                <label>College Name</label>
                <input className="input student-signup-input" placeholder="Enter your college name" value={form.collegeName} onChange={(e) => onChange("collegeName", e.target.value)} />
              </div>

              <div>
                <label>Previous TPO Password {needsPreviousPassword ? "(required)" : "(only when changing TPO)"}</label>
                <input className="input student-signup-input" type="password" placeholder="Enter previous TPO password" value={form.previousPassword} onChange={(e) => onChange("previousPassword", e.target.value)} />
              </div>

              <div className="form-error-slot">
                {err ? <p className="form-error">{err}</p> : null}
              </div>

              <button className="btn student-signup-submit" type="submit">Signup</button>
              <small className="student-signup-footer">Already have an account? <Link to="/tpo/login">Login</Link></small>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
