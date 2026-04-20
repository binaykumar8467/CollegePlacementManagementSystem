const nodemailer = require("nodemailer");

let transporter;

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || ""
        }
      : undefined
  });

  return transporter;
}

async function sendStudentPasswordResetOtp({ toEmail, studentName, otp }) {
  const subject = "CPMS Password Reset OTP";
  const text = `Hello ${studentName || "Student"}, your CPMS password reset OTP is ${otp}. It will expire in 10 minutes.`;

  if (!hasSmtpConfig()) {
    console.log(`[DEV OTP] ${toEmail}: ${otp}`);
    return { delivered: false, previewOnly: true };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin-bottom:8px;color:#002147">CPMS Password Reset</h2>
        <p>Hello ${studentName || "Student"},</p>
        <p>Your one-time password for resetting your CPMS account password is:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;color:#002147">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });

  return { delivered: true, previewOnly: false };
}

async function sendStudentPasswordResetSmsOtp({ toPhone, studentName, otp }) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.log(`[DEV SMS OTP] ${toPhone}: ${otp}`);
    return { delivered: false, previewOnly: true };
  }

  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    To: `+91${String(toPhone || "").trim()}`,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Hello ${studentName || "Student"}, your CPMS password reset OTP is ${otp}. It expires in 10 minutes.`
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS delivery failed: ${errorText}`);
  }

  return { delivered: true, previewOnly: false };
}

module.exports = { sendStudentPasswordResetOtp, sendStudentPasswordResetSmsOtp, hasSmtpConfig };
