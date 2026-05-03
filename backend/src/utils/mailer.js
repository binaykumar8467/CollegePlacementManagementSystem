// Sends OTP and account notification messages through configured messaging services.
function hasEmailConfig() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

// Build the sender identity used in outgoing emails.
function getSender() {
  return {
    name: process.env.BREVO_SENDER_NAME || "CPMS Placement Cell",
    email: process.env.BREVO_SENDER_EMAIL
  };
}

// Send an email through the Brevo transactional email API.
async function sendBrevoEmail({ toEmail, recipientName, subject, text, html }) {
  if (!hasEmailConfig()) {
    console.log(`[DEV EMAIL] ${toEmail}: ${subject}`);
    return { delivered: false, previewOnly: true };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: getSender(),
      to: [{ email: toEmail, name: recipientName || "User" }],
      subject,
      textContent: text,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email delivery failed: ${errorText}`);
  }

  return { delivered: true, previewOnly: false };
}

// Send the password-reset OTP email to the student.
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

// Build and send a reusable OTP email message.
async function sendOtpEmail({ toEmail, recipientName, otp, subject, heading, intro, ignoreText }) {
  const text = `Hello ${recipientName || "User"}, ${intro} ${otp}. It will expire in 10 minutes.`;

  return sendBrevoEmail({
    toEmail,
    recipientName,
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
}

// Send an OTP SMS through the configured SMS service.
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

// Send the signup OTP email for account verification.
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

// Send a signup success email after the account is created.
async function sendSignupSuccessEmail({ toEmail, recipientName, roleLabel }) {
  return sendBrevoEmail({
    toEmail,
    recipientName,
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
}

// Send a signup success SMS after the account is created.
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
  sendSignupOtpEmail,
  sendSignupSuccessEmail,
  sendSignupSuccessSms,
  hasEmailConfig,
  sendOtpSms
};
