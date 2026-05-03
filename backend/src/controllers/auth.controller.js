// Handles student and TPO signup, login, OTP verification, and password reset flows.
const Student = require("../models/Student");
const Tpo = require("../models/Tpo");
const PendingSignup = require("../models/PendingSignup");
const Job = require("../models/Job");
const Drive = require("../models/Drive");
const Notice = require("../models/Notice");
const { signToken } = require("../utils/jwt");
const { ensureUniqueIdentity, normalizeEmail, normalizePhone } = require("../utils/identity");
const { validateStudentSignupInput, validateTpoSignupInput } = require("../utils/authValidation");
const { normalizePlacementYear, getCurrentPlacementYear } = require("../utils/placementYear");
const { generateOtp, hashValue, generateVerifiedResetToken } = require("../utils/passwordReset");
const {
  sendStudentPasswordResetOtp,
  sendSignupOtpEmail,
  sendSignupSuccessEmail,
  sendSignupSuccessSms
} = require("../utils/mailer");

// Remove sensitive fields before sending user data back to the client.
function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.resumeData;
  delete obj.profilePhotoData;
  return obj;
}

// Return the current OTP verification progress for a pending signup.
function getSignupVerificationState(record) {
  return {
    signupToken: record.signupToken,
    emailVerified: Boolean(record.emailVerified),
    phoneVerified: Boolean(record.phoneVerified),
    readyToComplete: Boolean(record.emailVerified)
  };
}

// Generate and send the signup OTP through the selected communication channel.
async function sendSignupOtpByChannel({ channel, record, roleLabel }) {
  if (channel !== "email") {
    const err = new Error("Only email OTP is supported");
    err.statusCode = 400;
    throw err;
  }

  const otp = generateOtp();

  record.emailOtpHash = hashValue(otp);
  record.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  record.emailVerified = false;
  await record.save();
  await sendSignupOtpEmail({
    toEmail: record.email,
    recipientName: record.name,
    otp,
    roleLabel
  });
}

// Load the saved pending-signup record for OTP verification steps.
async function getPendingSignupForVerification({ role, signupToken }) {
  if (!signupToken) {
    const err = new Error("Signup session not found. Request OTP again.");
    err.statusCode = 400;
    throw err;
  }

  const pending = await PendingSignup.findOne({ signupToken, role }).select(
    "+emailOtpHash +emailOtpExpiresAt +phoneOtpHash +phoneOtpExpiresAt"
  );

  if (!pending) {
    const err = new Error("Signup session expired. Request OTP again.");
    err.statusCode = 404;
    throw err;
  }

  return pending;
}

// Check the submitted OTP and mark the pending signup as verified.
async function verifyPendingSignupOtp({ record, channel, otp }) {
  if (!["email", "phone"].includes(channel) || !otp) {
    const err = new Error("Valid OTP channel and otp required");
    err.statusCode = 400;
    throw err;
  }

  if (channel === "email") {
    if (!record.emailOtpHash || !record.emailOtpExpiresAt) {
      const err = new Error("Email OTP not requested or already expired");
      err.statusCode = 400;
      throw err;
    }
    if (record.emailOtpExpiresAt.getTime() < Date.now()) {
      record.emailOtpHash = undefined;
      record.emailOtpExpiresAt = undefined;
      await record.save();
      const err = new Error("Email OTP expired. Request a new OTP.");
      err.statusCode = 400;
      throw err;
    }
    if (record.emailOtpHash !== hashValue(otp)) {
      const err = new Error("Invalid email OTP");
      err.statusCode = 400;
      throw err;
    }
    record.emailVerified = true;
    record.emailOtpHash = undefined;
    record.emailOtpExpiresAt = undefined;
    await record.save();
    return;
  }

  if (!record.phoneOtpHash || !record.phoneOtpExpiresAt) {
    const err = new Error("Phone OTP not requested or already expired");
    err.statusCode = 400;
    throw err;
  }
  if (record.phoneOtpExpiresAt.getTime() < Date.now()) {
    record.phoneOtpHash = undefined;
    record.phoneOtpExpiresAt = undefined;
    await record.save();
    const err = new Error("Phone OTP expired. Request a new OTP.");
    err.statusCode = 400;
    throw err;
  }
  if (record.phoneOtpHash !== hashValue(otp)) {
    const err = new Error("Invalid phone OTP");
    err.statusCode = 400;
    throw err;
  }
  record.phoneVerified = true;
  record.phoneOtpHash = undefined;
  record.phoneOtpExpiresAt = undefined;
  await record.save();
}

// Send success notifications after the account is created successfully.
async function notifySignupSuccess({ email, phone, name, roleLabel }) {
  const tasks = [
    sendSignupSuccessEmail({ toEmail: email, recipientName: name, roleLabel }),
    sendSignupSuccessSms({ toPhone: phone, recipientName: name, roleLabel })
  ];

  const results = await Promise.allSettled(tasks);
  const warnings = [];
  if (results[0].status === "rejected") warnings.push("Signup email notification could not be delivered");
  if (results[1].status === "rejected") warnings.push("Signup phone notification could not be delivered");
  return warnings;
}

// Prepare normalized student signup data before saving it temporarily.
function buildStudentPendingPayload(body) {
  return {
    role: "student",
    name: String(body.name || "").trim(),
    email: normalizeEmail(body.email),
    password: String(body.password || ""),
    phone: normalizePhone(body.phone),
    placementYear: normalizePlacementYear(body.placementYear) || getCurrentPlacementYear()
  };
}

// Validate the TPO signup request and decide whether it creates or updates the TPO account.
async function resolveTpoSignupContext({ name, email, password, collegeName, phone, previousPassword }) {
  validateTpoSignupInput({ name, email, password, collegeName, phone });

  const allTpos = await Tpo.find().sort({ updatedAt: -1, createdAt: -1 });
  if (!allTpos.length) {
    await ensureUniqueIdentity({ email, phone });
    return { matchedTpo: null };
  }

  const normalizedPreviousPassword = String(previousPassword || "").trim();
  if (!normalizedPreviousPassword) {
    const err = new Error("Existing TPO password required to create a new TPO account");
    err.statusCode = 400;
    throw err;
  }

  const matchedTpo = allTpos.find((tpo) => String(tpo.password || "").trim() === normalizedPreviousPassword);
  if (!matchedTpo) {
    const err = new Error("Previous TPO password did not match");
    err.statusCode = 401;
    throw err;
  }

  await ensureUniqueIdentity({ email, phone, excludeTpoId: matchedTpo._id });
  return { matchedTpo };
}

// Prepare normalized TPO signup data before saving it temporarily.
function buildTpoPendingPayload(body) {
  return {
    role: "tpo",
    name: String(body.name || "").trim(),
    email: normalizeEmail(body.email),
    password: String(body.password || "").trim(),
    phone: normalizePhone(body.phone),
    collegeName: String(body.collegeName || "").trim(),
    previousPassword: String(body.previousPassword || "").trim()
  };
}

// Create or refresh the temporary signup record used during OTP verification.
async function upsertPendingSignup(payload) {
  const existing = await PendingSignup.findOne({
    role: payload.role,
    email: payload.email,
    phone: payload.phone
  }).select("+emailOtpHash +emailOtpExpiresAt +phoneOtpHash +phoneOtpExpiresAt");

  if (existing) {
    Object.assign(existing, payload);
    if (!existing.signupToken) {
      existing.signupToken = generateVerifiedResetToken();
    }
    await existing.save();
    return existing;
  }

  const created = await PendingSignup.create({
    ...payload,
    signupToken: generateVerifiedResetToken()
  });
  return PendingSignup.findById(created._id).select("+emailOtpHash +emailOtpExpiresAt +phoneOtpHash +phoneOtpExpiresAt");
}

// Validate the student form and send the signup OTP email.
async function requestStudentSignupOtp(req, res) {
  validateStudentSignupInput(req.body);
  await ensureUniqueIdentity({ email: req.body.email, phone: req.body.phone });

  const pending = await upsertPendingSignup(buildStudentPendingPayload(req.body));
  await sendSignupOtpByChannel({ channel: "email", record: pending, roleLabel: "Student" });

  return res.json({
    message: "Signup OTP sent successfully via email",
    verification: getSignupVerificationState(pending)
  });
}

// Verify the student signup OTP before allowing final registration.
async function verifyStudentSignupOtp(req, res) {
  const { signupToken, otp } = req.body;
  const pending = await getPendingSignupForVerification({ role: "student", signupToken });
  await verifyPendingSignupOtp({ record: pending, channel: "email", otp });

  return res.json({
    message: "Email OTP verified successfully",
    verification: getSignupVerificationState(pending)
  });
}

// Create the final student account after OTP verification succeeds.
async function studentSignup(req, res) {
  const pending = await getPendingSignupForVerification({ role: "student", signupToken: req.body.signupToken });
  if (!pending.emailVerified) {
    return res.status(400).json({
      message: "Verify email OTP before completing signup",
      verification: getSignupVerificationState(pending)
    });
  }

  await ensureUniqueIdentity({ email: pending.email, phone: pending.phone });

  const student = await Student.create({
    name: pending.name,
    email: pending.email,
    password: pending.password,
    phone: pending.phone,
    placementYear: normalizePlacementYear(pending.placementYear) || getCurrentPlacementYear()
  });

  const warnings = await notifySignupSuccess({
    email: student.email,
    phone: student.phone,
    name: student.name,
    roleLabel: "Student"
  });

  await PendingSignup.deleteOne({ _id: pending._id });

  const token = signToken({ id: student._id, role: "student" });
  res.status(201).json({
    token,
    user: sanitizeUser(student),
    message: "Student account created successfully",
    warnings
  });
}

// Authenticate a student by email or phone and issue a JWT token.
async function studentLogin(req, res) {
  const { identifier, email, phone, password } = req.body;
  const loginIdentifier = String(identifier || email || phone || "").trim();
  if (!loginIdentifier || !password) return res.status(400).json({ message: "Email or phone number and password required" });

  const student = loginIdentifier.includes("@")
    ? await Student.findOne({ email: normalizeEmail(loginIdentifier) })
    : await Student.findOne({ phone: normalizePhone(loginIdentifier) });
  if (!student) return res.status(401).json({ message: "Invalid credentials" });
  if (password !== student.password) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: student._id, role: "student" });
  res.json({ token, user: sanitizeUser(student) });
}

// Start the student password-reset flow by sending an email OTP.
async function studentForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const student = await Student.findOne({ email: normalizeEmail(email) }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt");
  if (!student) return res.status(404).json({ message: "Student account not found for this email" });

  const otp = generateOtp();
  student.passwordResetOtpHash = hashValue(otp);
  student.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  student.passwordResetVerifiedTokenHash = undefined;
  student.passwordResetVerifiedTokenExpiresAt = undefined;
  await student.save();

  await sendStudentPasswordResetOtp({
    toEmail: student.email,
    studentName: student.name,
    otp
  });

  return res.json({
    message: "OTP sent successfully via email"
  });
}

// Verify the password-reset OTP and issue a short-lived reset token.
async function verifyStudentForgotPasswordOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and otp required" });
  }

  const student = await Student.findOne({ email: normalizeEmail(email) }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetVerifiedTokenHash +passwordResetVerifiedTokenExpiresAt");

  if (!student || !student.passwordResetOtpHash || !student.passwordResetOtpExpiresAt) {
    return res.status(400).json({ message: "OTP not requested or already expired" });
  }

  if (student.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    student.passwordResetOtpHash = undefined;
    student.passwordResetOtpExpiresAt = undefined;
    await student.save();
    return res.status(400).json({ message: "OTP expired. Request a new OTP." });
  }

  if (student.passwordResetOtpHash !== hashValue(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const resetToken = generateVerifiedResetToken();
  student.passwordResetOtpHash = undefined;
  student.passwordResetOtpExpiresAt = undefined;
  student.passwordResetVerifiedTokenHash = hashValue(resetToken);
  student.passwordResetVerifiedTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await student.save();

  return res.json({ message: "OTP verified successfully", resetToken });
}

// Replace the student password after the reset session is verified.
async function resetStudentPasswordWithOtp(req, res) {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: "Email, resetToken and newPassword required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const student = await Student.findOne({ email: normalizeEmail(email) }).select("+passwordResetVerifiedTokenHash +passwordResetVerifiedTokenExpiresAt");

  if (!student || !student.passwordResetVerifiedTokenHash || !student.passwordResetVerifiedTokenExpiresAt) {
    return res.status(400).json({ message: "Reset session expired. Verify OTP again." });
  }

  if (student.passwordResetVerifiedTokenExpiresAt.getTime() < Date.now()) {
    student.passwordResetVerifiedTokenHash = undefined;
    student.passwordResetVerifiedTokenExpiresAt = undefined;
    await student.save();
    return res.status(400).json({ message: "Reset session expired. Verify OTP again." });
  }

  if (student.passwordResetVerifiedTokenHash !== hashValue(resetToken)) {
    return res.status(400).json({ message: "Invalid reset session" });
  }

  student.password = String(newPassword);
  student.passwordResetOtpHash = undefined;
  student.passwordResetOtpExpiresAt = undefined;
  student.passwordResetVerifiedTokenHash = undefined;
  student.passwordResetVerifiedTokenExpiresAt = undefined;
  await student.save();

  return res.json({ message: "Password reset successful" });
}

// Create or update the TPO account after OTP verification succeeds.
async function tpoSignup(req, res) {
  const pending = await getPendingSignupForVerification({ role: "tpo", signupToken: req.body.signupToken });
  if (!pending.emailVerified) {
    return res.status(400).json({
      message: "Verify email OTP before completing signup",
      verification: getSignupVerificationState(pending)
    });
  }

  const { matchedTpo } = await resolveTpoSignupContext(pending);

  let tpo;
  if (!matchedTpo) {
    tpo = await Tpo.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      collegeName: pending.collegeName || "",
      phone: pending.phone
    });
  } else {
    const allTpos = await Tpo.find().sort({ updatedAt: -1, createdAt: -1 });
    const otherTpoIds = allTpos
      .filter((tpoDoc) => String(tpoDoc._id) !== String(matchedTpo._id))
      .map((tpoDoc) => tpoDoc._id);

    if (otherTpoIds.length) {
      await Promise.all([
        Job.updateMany({ createdByTpo: { $in: otherTpoIds } }, { $set: { createdByTpo: matchedTpo._id } }),
        Drive.updateMany({ createdByTpo: { $in: otherTpoIds } }, { $set: { createdByTpo: matchedTpo._id } }),
        Notice.updateMany({ createdByTpo: { $in: otherTpoIds } }, { $set: { createdByTpo: matchedTpo._id } }),
      ]);
      await Tpo.deleteMany({ _id: { $in: otherTpoIds } });
    }

    matchedTpo.name = pending.name;
    matchedTpo.email = pending.email;
    matchedTpo.password = String(pending.password || "").trim();
    matchedTpo.collegeName = pending.collegeName || "";
    matchedTpo.phone = pending.phone;
    await matchedTpo.save();
    tpo = matchedTpo;
  }

  const warnings = await notifySignupSuccess({
    email: tpo.email,
    phone: tpo.phone,
    name: tpo.name,
    roleLabel: "TPO"
  });

  await PendingSignup.deleteOne({ _id: pending._id });

  const token = signToken({ id: tpo._id, role: "tpo" });
  res.status(201).json({
    token,
    user: sanitizeUser(tpo),
    message: "TPO account created successfully",
    warnings
  });
}

// Validate the TPO form and send the signup OTP email.
async function requestTpoSignupOtp(req, res) {
  await resolveTpoSignupContext(req.body);
  const pending = await upsertPendingSignup(buildTpoPendingPayload(req.body));
  await sendSignupOtpByChannel({ channel: "email", record: pending, roleLabel: "TPO" });

  return res.json({
    message: "Signup OTP sent successfully via email",
    verification: getSignupVerificationState(pending)
  });
}

// Verify the TPO signup OTP before allowing final registration.
async function verifyTpoSignupOtp(req, res) {
  const { signupToken, otp } = req.body;
  const pending = await getPendingSignupForVerification({ role: "tpo", signupToken });
  await verifyPendingSignupOtp({ record: pending, channel: "email", otp });

  return res.json({
    message: "Email OTP verified successfully",
    verification: getSignupVerificationState(pending)
  });
}

// Authenticate a TPO by email or phone and issue a JWT token.
async function tpoLogin(req, res) {
  const { identifier, email, phone, password } = req.body;
  const loginIdentifier = String(identifier || email || phone || "").trim();
  if (!loginIdentifier || !password) return res.status(400).json({ message: "Email or phone number and password required" });

  const tpo = loginIdentifier.includes("@")
    ? await Tpo.findOne({ email: normalizeEmail(loginIdentifier) })
    : await Tpo.findOne({ phone: normalizePhone(loginIdentifier) });
  if (!tpo) return res.status(401).json({ message: "Invalid credentials" });
  if (password !== tpo.password) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: tpo._id, role: "tpo" });
  res.json({ token, user: sanitizeUser(tpo) });
}

module.exports = {
  requestStudentSignupOtp,
  verifyStudentSignupOtp,
  studentSignup,
  studentLogin,
  studentForgotPassword,
  verifyStudentForgotPasswordOtp,
  resetStudentPasswordWithOtp,
  requestTpoSignupOtp,
  verifyTpoSignupOtp,
  tpoSignup,
  tpoLogin
};
