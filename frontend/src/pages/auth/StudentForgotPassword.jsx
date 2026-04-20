import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { validateEmail, validatePassword, validatePhone } from "../../lib/signupValidation";

export default function StudentForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ channel: "email", email: "", phone: "", otp: "", newPassword: "" });
  const [resetToken, setResetToken] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    if (err) setErr("");
    if (msg && k === "channel") setMsg("");
  };

  const validateIdentity = () => {
    return form.channel === "email" ? validateEmail(form.email) : validatePhone(form.phone);
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const validationError = validateIdentity();
    if (validationError) {
      setErr(validationError);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/student/forgot-password", {
        channel: form.channel,
        email: form.email,
        phone: form.phone
      });
      setStep(2);
      setMsg("OTP sent to your registered email address.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!form.otp || form.otp.length !== 6) {
      setErr("Enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/student/forgot-password/verify-otp", {
        channel: form.channel,
        email: form.email,
        phone: form.phone,
        otp: form.otp
      });
      setResetToken(res.data?.resetToken || "");
      setStep(3);
      setMsg("OTP verified. Set your new password.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const passwordError = validatePassword(form.newPassword);
    if (passwordError) {
      setErr(passwordError);
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/auth/student/forgot-password/reset", {
        channel: form.channel,
        email: form.email,
        phone: form.phone,
        resetToken,
        newPassword: form.newPassword
      });
      setMsg("Password reset successful. Redirecting to login...");
      setTimeout(() => nav("/student/login"), 1200);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {msg ? <div className="success-toast">{msg}</div> : null}
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
              <h2>Reset with OTP</h2>
              <p>Choose whether you want the OTP on your email or phone, verify it, then set a fresh password securely.</p>
              <div className="auth-visual-chips">
                <span>Email OTP</span>
                <span>Phone OTP</span>
              </div>
              <div className="auth-visual-stats">
                <div className="auth-visual-stat-card">
                  <strong>Step 1</strong>
                  <small>Enter your registered email and phone number.</small>
                </div>
                <div className="auth-visual-stat-card">
                  <strong>Step 2</strong>
                  <small>Verify the OTP and set a new password safely.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="student-signup-form-card student-login-form-card">
            <div className="student-signup-form-head student-login-form-head">
              <h1>Forgot Password</h1>
              <p>
                {step === 1 ? "Choose OTP channel and enter your registered detail." : step === 2 ? `Enter the OTP sent to your registered ${form.channel}.` : "Create a new password for your account."}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={requestOtp} className="student-signup-form student-login-form">
                <div>
                  <label>Receive OTP Via</label>
                  <div className="row" style={{ gap: 18, flexWrap: "wrap", marginTop: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="radio" name="otpChannel" checked={form.channel === "email"} onChange={() => onChange("channel", "email")} />
                      Email
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="radio" name="otpChannel" checked={form.channel === "phone"} onChange={() => onChange("channel", "phone")} />
                      Phone
                    </label>
                  </div>
                </div>

                {form.channel === "email" ? (
                <div>
                  <label>Email</label>
                  <input className="input student-signup-input" type="email" placeholder="Enter your registered email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
                </div>
                ) : (
                <div>
                  <label>Registered Phone Number</label>
                  <input className="input student-signup-input" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength="10" placeholder="Enter your registered phone number" value={form.phone} onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                </div>
                )}
                <div className="form-error-slot">{err ? <p className="form-error">{err}</p> : null}</div>
                <button className="btn student-signup-submit" type="submit" disabled={loading}>{loading ? "Sending OTP..." : "Send OTP"}</button>
                <div className="student-login-links">
                  <Link to="/student/login">Back to Login</Link>
                </div>
              </form>
            ) : null}

            {step === 2 ? (
              <form onSubmit={verifyOtp} className="student-signup-form student-login-form">
                <div>
                  <label>OTP</label>
                  <input className="input student-signup-input" type="text" inputMode="numeric" maxLength="6" placeholder="Enter 6-digit OTP" value={form.otp} onChange={(e) => onChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))} />
                </div>
                <div className="form-error-slot">{err ? <p className="form-error">{err}</p> : null}</div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <button className="btn secondary" type="button" onClick={() => { setErr(""); setMsg(""); setStep(1); }}>Back</button>
                  <button className="btn student-signup-submit" type="submit" disabled={loading} style={{ width: "auto" }}>{loading ? "Verifying..." : "Verify OTP"}</button>
                </div>
                <div className="student-login-links">
                  <button type="button" className="btn secondary" onClick={requestOtp} disabled={loading}>Resend OTP</button>
                </div>
              </form>
            ) : null}

            {step === 3 ? (
              <form onSubmit={resetPassword} className="student-signup-form student-login-form">
                <div>
                  <label>New Password</label>
                  <input className="input student-signup-input" type="password" placeholder="Create a new password" value={form.newPassword} onChange={(e) => onChange("newPassword", e.target.value)} />
                </div>
                <div className="form-error-slot">{err ? <p className="form-error">{err}</p> : null}</div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <button className="btn secondary" type="button" onClick={() => { setErr(""); setMsg(""); setStep(2); }}>Back</button>
                  <button className="btn student-signup-submit" type="submit" disabled={loading} style={{ width: "auto" }}>{loading ? "Resetting..." : "Reset Password"}</button>
                </div>
                <div className="student-login-links">
                  <Link to="/student/login">Back to Login</Link>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
