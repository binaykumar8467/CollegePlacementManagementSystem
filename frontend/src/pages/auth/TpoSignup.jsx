import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { getTpoSignupErrors, validateTpoField, validateTpoSignup } from "../../lib/signupValidation";

const EMPTY_VERIFICATION = { signupToken: "", emailVerified: false, phoneVerified: false, readyToComplete: false };
const EMPTY_FIELD_ERRORS = { name: "", email: "", password: "", collegeName: "", phone: "", previousPassword: "" };
const EMPTY_TOUCHED = { name: false, email: false, password: false, collegeName: false, phone: false, previousPassword: false };
const OTP_RESEND_COOLDOWN_SECONDS = 30;

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
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [touched, setTouched] = useState(EMPTY_TOUCHED);
  const [needsPreviousPassword, setNeedsPreviousPassword] = useState(false);
  const [verification, setVerification] = useState(EMPTY_VERIFICATION);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  React.useEffect(() => {
    if (!otpCooldown) return undefined;

    const timer = window.setTimeout(() => {
      setOtpCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  const resetVerification = () => {
    setVerification(EMPTY_VERIFICATION);
    setOtp("");
  };

  const onChange = (k, v) => {
    const nextForm = { ...form, [k]: v };
    setForm(nextForm);
    setMsg("");
    setTouched((s) => ({ ...s, [k]: true }));
    setFieldErrors((s) => ({ ...s, [k]: validateTpoField(k, v, needsPreviousPassword) }));
    if (verification.signupToken) {
      resetVerification();
    }
    if (err) {
      setErr("");
    }
  };

  const onBlur = (k) => {
    setTouched((s) => ({ ...s, [k]: true }));
    setFieldErrors((s) => ({ ...s, [k]: validateTpoField(k, form[k], needsPreviousPassword) }));
  };

  const sendOtp = async () => {
    if (otpCooldown > 0) {
      return;
    }
    setErr("");
    setMsg("");
    setTouched({ name: true, email: true, password: true, collegeName: true, phone: true, previousPassword: true });
    setFieldErrors(getTpoSignupErrors(form, needsPreviousPassword));
    const validationError = validateTpoSignup(form, needsPreviousPassword);
    if (validationError) {
      return;
    }

    try {
      setSendingOtp(true);
      const res = await api.post("/api/auth/tpo/signup/request-otp", form);
      setVerification(res.data?.verification || EMPTY_VERIFICATION);
      setOtpCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setMsg(res.data?.message || "OTP sent successfully");
    } catch (e2) {
      const message = e2?.response?.data?.message || "Unable to send OTP";
      if (/Existing TPO password required/i.test(message)) {
        setNeedsPreviousPassword(true);
        setTouched((s) => ({ ...s, previousPassword: true }));
        setFieldErrors((s) => ({ ...s, previousPassword: validateTpoField("previousPassword", form.previousPassword, true) }));
      }
      setErr(message);
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
      const res = await api.post("/api/auth/tpo/signup/verify-otp", {
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
    setTouched({ name: true, email: true, password: true, collegeName: true, phone: true, previousPassword: true });
    setFieldErrors(getTpoSignupErrors(form, needsPreviousPassword));
    const validationError = validateTpoSignup(form, needsPreviousPassword);
    if (validationError) {
      return;
    }
    if (!verification.readyToComplete || !verification.signupToken) {
      setErr("Verify email OTP before completing signup");
      return;
    }
    try {
      setCompleting(true);
      const res = await api.post("/api/auth/tpo/signup", { signupToken: verification.signupToken });
      setMsg(res.data?.warnings?.length
        ? `Account created. ${res.data.warnings.join(". ")}`
        : "Account created successfully");
      setTimeout(() => nav("/"), 1200);
    } catch (e2) {
      const message = e2?.response?.data?.message || "Signup failed";
      if (/Existing TPO password required/i.test(message)) {
        setNeedsPreviousPassword(true);
        setTouched((s) => ({ ...s, previousPassword: true }));
        setFieldErrors((s) => ({ ...s, previousPassword: validateTpoField("previousPassword", form.previousPassword, true) }));
      }
      setErr(message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      {msg ? <div className="success-toast">{msg}</div> : null}
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
              <p>Create the TPO account with verified email access so all placement communication stays reliable.</p>
              <div className="auth-visual-chips">
                <span>Verified email</span>
                <span>Secure onboarding</span>
              </div>
              <div className="auth-visual-stats">
                <div className="auth-visual-stat-card">
                  <strong>Trusted access</strong>
                  <small>Both OTP checks finish before dashboard access is granted.</small>
                </div>
                <div className="auth-visual-stat-card">
                  <strong>Ready to manage</strong>
                  <small>Students, notices, drives, and placements stay in one verified workspace.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="student-signup-form-card tpo-auth-form-card">
            <div className="student-signup-form-head">
              <h1>TPO Signup</h1>
              <p>Fill details, verify email and phone OTP, then complete the TPO account.</p>
            </div>

            <form onSubmit={submit} className="student-signup-form tpo-auth-form">
              <div className="field-group">
                <label>Name</label>
                <input className="input student-signup-input" placeholder="Enter your full name" value={form.name} onChange={(e) => onChange("name", e.target.value)} onBlur={() => onBlur("name")} />
                <div className={`field-error-slot ${touched.name && fieldErrors.name ? "is-visible" : ""}`}>
                  {touched.name && fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label>Email</label>
                <input className="input student-signup-input" type="email" placeholder="Enter your email" value={form.email} onChange={(e) => onChange("email", e.target.value)} onBlur={() => onBlur("email")} />
                <div className={`field-error-slot ${touched.email && fieldErrors.email ? "is-visible" : ""}`}>
                  {touched.email && fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label>Phone</label>
                <input className="input student-signup-input" type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="Enter your phone number" maxLength="10" value={form.phone} onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} onBlur={() => onBlur("phone")} />
                <div className={`field-error-slot ${touched.phone && fieldErrors.phone ? "is-visible" : ""}`}>
                  {touched.phone && fieldErrors.phone ? <p className="field-error">{fieldErrors.phone}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label>Password</label>
                <input className="input student-signup-input" type="password" placeholder="Create password" minLength="8" maxLength="16" value={form.password} onChange={(e) => onChange("password", e.target.value)} onBlur={() => onBlur("password")} />
                <div className={`field-error-slot ${touched.password && fieldErrors.password ? "is-visible" : ""}`}>
                  {touched.password && fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label>College Name</label>
                <input className="input student-signup-input" placeholder="Enter your college name" value={form.collegeName} onChange={(e) => onChange("collegeName", e.target.value)} onBlur={() => onBlur("collegeName")} />
                <div className={`field-error-slot ${touched.collegeName && fieldErrors.collegeName ? "is-visible" : ""}`}>
                  {touched.collegeName && fieldErrors.collegeName ? <p className="field-error">{fieldErrors.collegeName}</p> : null}
                </div>
              </div>

              <div className="field-group">
                <label>Previous TPO Password {needsPreviousPassword ? "(required)" : "(only when changing TPO)"}</label>
                <input className="input student-signup-input" type="password" placeholder="Enter previous TPO password" value={form.previousPassword} onChange={(e) => onChange("previousPassword", e.target.value)} onBlur={() => onBlur("previousPassword")} />
                <div className={`field-error-slot ${touched.previousPassword && fieldErrors.previousPassword ? "is-visible" : ""}`}>
                  {touched.previousPassword && fieldErrors.previousPassword ? <p className="field-error">{fieldErrors.previousPassword}</p> : null}
                </div>
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
                <button className="btn signup-mini-btn" type="button" onClick={sendOtp} disabled={sendingOtp || otpCooldown > 0}>
                  {sendingOtp
                    ? "Sending..."
                    : otpCooldown > 0
                      ? `Resend in ${otpCooldown}s`
                      : verification.signupToken || verification.emailVerified
                        ? "Resend OTP"
                        : "Send OTP"}
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
              <small className="student-signup-footer">Already have an account? <Link to="/tpo/login">Login</Link></small>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
