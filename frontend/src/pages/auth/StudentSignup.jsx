import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { getCurrentPlacementYear, getPlacementYearOptions } from "../../lib/studentOptions";
import { validateStudentSignup } from "../../lib/signupValidation";

const EMPTY_VERIFICATION = { signupToken: "", emailVerified: false, phoneVerified: false, readyToComplete: false };

export default function StudentSignup() {
  const nav = useNavigate();
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const defaultPlacementYear = placementYears[0] || getCurrentPlacementYear();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    placementYear: defaultPlacementYear,
    phone: ""
  });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [verification, setVerification] = useState(EMPTY_VERIFICATION);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [completing, setCompleting] = useState(false);

  const resetVerification = () => {
    setVerification(EMPTY_VERIFICATION);
    setOtp("");
  };

  const onChange = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setMsg("");
    if (verification.signupToken) {
      resetVerification();
    }
    if (err) {
      setErr(validateStudentSignup({ ...form, [k]: v }));
    }
  };

  const sendOtp = async () => {
    setErr("");
    setMsg("");
    const validationError = validateStudentSignup(form);
    if (validationError) {
      setErr(validationError);
      return;
    }
    try {
      setSendingOtp(true);
      const res = await api.post("/api/auth/student/signup/request-otp", form);
      setVerification(res.data?.verification || EMPTY_VERIFICATION);
      setMsg(res.data?.message || "OTP sent successfully");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Unable to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!verification.signupToken) {
      setErr("Send OTP first");
      return;
    }
    if (!String(otp || "").trim()) {
      setErr("Email OTP is required");
      return;
    }
    try {
      setErr("");
      setMsg("");
      setVerifyingOtp(true);
      const res = await api.post("/api/auth/student/signup/verify-otp", {
        signupToken: verification.signupToken,
        otp
      });
      setVerification(res.data?.verification || EMPTY_VERIFICATION);
      setMsg(res.data?.message || "OTP verified successfully");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
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
    if (!verification.readyToComplete || !verification.signupToken) {
      setErr("Verify email OTP before completing signup");
      return;
    }

    try {
      setCompleting(true);
      const res = await api.post("/api/auth/student/signup", { signupToken: verification.signupToken });
      setMsg(res.data?.warnings?.length
        ? `Account created. ${res.data.warnings.join(". ")}`
        : "Account created successfully");
      setTimeout(() => nav("/"), 1200);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Signup failed");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      {msg ? <div className="success-toast">{msg}</div> : null}
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
              <p>Create your account with verified email access so your placement profile is ready from day one.</p>
              <div className="auth-visual-chips">
                <span>Email verified</span>
                <span>Fast onboarding</span>
              </div>
              <div className="auth-visual-stats">
                <div className="auth-visual-stat-card">
                  <strong>Secure signup</strong>
                  <small>Only verified students can complete account creation.</small>
                </div>
                <div className="auth-visual-stat-card">
                  <strong>Faster onboarding</strong>
                  <small>OTP verification and login happen in one smooth flow.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="student-signup-form-card">
            <div className="student-signup-form-head">
              <h1>Student Signup</h1>
              <p>Fill your details, verify both OTPs, and then complete your account.</p>
            </div>

            <form onSubmit={submit} className="student-signup-form">
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
                <label>Session</label>
                <select className="input student-signup-input placement-year-select" value={form.placementYear} onChange={(e) => onChange("placementYear", e.target.value)}>
                  {placementYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div className="signup-status-strip">
                <span className={`signup-status-badge ${verification.emailVerified ? "is-verified" : ""}`}>
                  Email {verification.emailVerified ? "Verified" : "Pending"}
                </span>
              </div>

              <div className="signup-verification-card signup-verification-card-single">
                <div className="signup-verification-head">
                  <div>
                    <strong>Email Verification</strong>
                    <p>{verification.emailVerified ? "Verified successfully" : "Send OTP to your email and verify it"}</p>
                  </div>
                  <span className={`signup-status-dot ${verification.emailVerified ? "is-verified" : ""}`} />
                </div>
                <button className="btn signup-mini-btn" type="button" onClick={sendOtp} disabled={sendingOtp}>
                  {sendingOtp ? "Sending..." : verification.emailVerified ? "Resend OTP" : "Send OTP"}
                </button>
                <div className="signup-verify-row">
                  <input className="input student-signup-input" type="text" inputMode="numeric" maxLength="6" placeholder="Enter email OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                  <button className="btn signup-mini-btn" type="button" onClick={verifyOtp} disabled={verifyingOtp || verification.emailVerified}>
                    {verification.emailVerified ? "Done" : verifyingOtp ? "Checking..." : "Verify"}
                  </button>
                </div>
              </div>

              <div className="form-error-slot">
                {err ? <p className="form-error">{err}</p> : null}
              </div>

              <button className="btn student-signup-submit" type="submit" disabled={!verification.readyToComplete || completing}>
                {completing ? "Creating account..." : "Complete Signup"}
              </button>
              <small className="student-signup-footer">Already have an account? <Link to="/student/login">Login</Link></small>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
