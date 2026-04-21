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
  return sendOtpEmail({
    toEmail,
    recipientName: studentName,
    otp,
    subject: "CPMS Password Reset OTP",
    heading: "CPMS Password Reset",
    intro: "Your one-time password for resetting your CPMS account password is:",
    ignoreText: "If you did not request this, you can ignore this email."
  });
}

async function sendStudentPasswordResetSmsOtp({ toPhone, studentName, otp }) {
  return sendOtpSms({
    toPhone,
    recipientName: studentName,
    otp,
    messagePrefix: "your CPMS password reset OTP is"
  });
}

async function sendOtpEmail({ toEmail, recipientName, otp, subject, heading, intro, ignoreText }) {
  const text = `Hello ${recipientName || "User"}, ${intro} ${otp}. It will expire in 10 minutes.`;

  if (!hasSmtpConfig()) {
    console.log(`[DEV EMAIL OTP] ${toEmail}: ${otp}`);
    return { delivered: false, previewOnly: true };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin-bottom:8px;color:#002147">${heading}</h2>
        <p>Hello ${recipientName || "User"},</p>
        <p>${intro}</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;color:#002147">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>${ignoreText}</p>
      </div>
    `
  });

  return { delivered: true, previewOnly: false };
}

async function sendOtpSms({ toPhone, recipientName, otp, messagePrefix }) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.log(`[DEV SMS OTP] ${toPhone}: ${otp}`);
    return { delivered: false, previewOnly: true };
  }

  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    To: `+91${String(toPhone || "").trim()}`,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Hello ${recipientName || "User"}, ${messagePrefix} ${otp}. It expires in 10 minutes.`
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

async function sendSignupOtpEmail({ toEmail, recipientName, otp, roleLabel }) {
  return sendOtpEmail({
    toEmail,
    recipientName,
    otp,
    subject: `CPMS ${roleLabel} Signup Verification OTP`,
    heading: `${roleLabel} Signup Verification`,
    intro: "Use the following OTP to verify your email address for CPMS signup:",
    ignoreText: "If you did not start this signup, you can ignore this email."
  });
}

async function sendSignupOtpSms({ toPhone, recipientName, otp, roleLabel }) {
  return sendOtpSms({
    toPhone,
    recipientName,
    otp,
    messagePrefix: `your CPMS ${roleLabel.toLowerCase()} signup OTP is`
  });
}

async function sendSignupSuccessEmail({ toEmail, recipientName, roleLabel }) {
  if (!hasSmtpConfig()) {
    console.log(`[DEV EMAIL] Signup success notification queued for ${toEmail}`);
    return { delivered: false, previewOnly: true };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: `Welcome to CPMS - ${roleLabel} account created`,
    text: `Hello ${recipientName || "User"}, your CPMS ${roleLabel.toLowerCase()} account has been created successfully.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin-bottom:8px;color:#002147">Welcome to CPMS</h2>
        <p>Hello ${recipientName || "User"},</p>
        <p>Your CPMS ${roleLabel.toLowerCase()} account has been created successfully.</p>
        <p>You can now log in and continue using the platform.</p>
      </div>
    `
  });

  return { delivered: true, previewOnly: false };
}

async function sendSignupSuccessSms({ toPhone, recipientName, roleLabel }) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.log(`[DEV SMS] Signup success notification queued for ${toPhone}`);
    return { delivered: false, previewOnly: true };
  }

  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    To: `+91${String(toPhone || "").trim()}`,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Hello ${recipientName || "User"}, your CPMS ${roleLabel.toLowerCase()} account has been created successfully.`
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

module.exports = {
  sendStudentPasswordResetOtp,
  sendStudentPasswordResetSmsOtp,
  sendSignupOtpEmail,
  sendSignupOtpSms,
  sendSignupSuccessEmail,
  sendSignupSuccessSms,
  hasSmtpConfig
};
