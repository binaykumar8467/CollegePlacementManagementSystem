import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { getCurrentPlacementYear, getPlacementYearOptions } from "../../lib/studentOptions";
import { validateStudentSignup } from "../../lib/signupValidation";

export default function StudentSignup() {
  const nav = useNavigate();
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const defaultPlacementYear = placementYears[0] || getCurrentPlacementYear();
  const [form, setForm] = useState({
    name:"",
    email:"",
    password:"",
    placementYear: defaultPlacementYear,
    phone:""
  });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const onChange = (k, v) => {
    setForm((s) => {
      const nextForm = { ...s, [k]: v };
      if (err) {
        setErr(validateStudentSignup(nextForm));
      }
      return nextForm;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const validationError = validateStudentSignup(form);
    if (validationError) {
      setErr(validationError);
      return;
    }
    try {
      await api.post("/api/auth/student/signup", form);
      setMsg("Account successfully created");
      setForm({
        name: "",
        email: "",
        password: "",
        placementYear: defaultPlacementYear,
        phone: ""
      });
      setTimeout(() => nav("/"), 1200);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Signup failed");
    }
  };

  return (
    <>
      {msg ? <div className="success-toast">Account successfully created</div> : null}
      <div className="student-signup-page">
        <div className="student-signup-shell">
          <div className="student-signup-visual">
            <div className="student-signup-illustration">
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
            <div className="student-signup-copy">
              <h2>Build the future you want</h2>
              <p>Create your account today and unlock the opportunities waiting on campus.</p>
              <div className="auth-visual-chips">
                <span>Profile ready</span>
                <span>Opportunities ahead</span>
              </div>
              <div className="auth-visual-stats">
                <div className="auth-visual-stat-card">
                  <strong>Campus Ready</strong>
                  <small>Start your placement journey with one simple signup.</small>
                </div>
                <div className="auth-visual-stat-card">
                  <strong>Career Focus</strong>
                  <small>Track notices, drives, jobs, and placement updates in one place.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="student-signup-form-card">
            <div className="student-signup-form-head">
              <h1>Student Signup</h1>
              <p>Enter your basic details to create your student account.</p>
            </div>

            <form onSubmit={submit} className="student-signup-form">
              <div>
                <label>Name</label>
                <input className="input student-signup-input" placeholder="Enter your full name" value={form.name} onChange={e=>onChange("name", e.target.value)} />
              </div>

              <div>
                <label>Email</label>
                <input className="input student-signup-input" type="email" placeholder="Enter your email" value={form.email} onChange={e=>onChange("email", e.target.value)} />
              </div>

              <div>
                <label>Phone</label>
                <input className="input student-signup-input" type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="Enter your phone number" maxLength="10" value={form.phone} onChange={e=>onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
              </div>

              <div>
                <label>Password</label>
                <input className="input student-signup-input" type="password" placeholder="Create password" minLength="6" value={form.password} onChange={e=>onChange("password", e.target.value)} />
              </div>

              <div>
                <label>Session&emsp;</label>
              <select className="input student-signup-input placement-year-select" value={form.placementYear} onChange={e=>onChange("placementYear", e.target.value)}>
                  {placementYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div className="form-error-slot">
                {err ? <p className="form-error">{err}</p> : null}
              </div>

              <button className="btn student-signup-submit" type="submit">Sign up</button>
              <small className="student-signup-footer">Already have an account? <Link to="/student/login">Login</Link></small>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
