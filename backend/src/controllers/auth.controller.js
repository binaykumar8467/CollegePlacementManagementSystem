const Student = require("../models/Student");
const Tpo = require("../models/Tpo");
const Job = require("../models/Job");
const Drive = require("../models/Drive");
const Notice = require("../models/Notice");
const { signToken } = require("../utils/jwt");
const { ensureUniqueIdentity, normalizeEmail, normalizePhone } = require("../utils/identity");
const { validateStudentSignupInput, validateTpoSignupInput } = require("../utils/authValidation");
const { normalizePlacementYear, getCurrentPlacementYear } = require("../utils/placementYear");
const { generateOtp, hashValue, generateVerifiedResetToken } = require("../utils/passwordReset");
const { sendStudentPasswordResetOtp, sendStudentPasswordResetSmsOtp } = require("../utils/mailer");

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.resumeData;
  delete obj.profilePhotoData;
  return obj;
}

async function studentSignup(req, res) {
  const { name, email, password, phone, placementYear } = req.body;
  validateStudentSignupInput({ name, email, password, phone, placementYear });

  await ensureUniqueIdentity({ email, phone });

  const student = await Student.create({
    name,
    email: normalizeEmail(email),
    password,
    phone: normalizePhone(phone),
    placementYear: normalizePlacementYear(placementYear) || getCurrentPlacementYear()
  });

  const token = signToken({ id: student._id, role: "student" });
  res.status(201).json({ token, user: sanitizeUser(student) });
}

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

async function studentForgotPassword(req, res) {
  const { channel, email, phone } = req.body;
  if (!["email", "phone"].includes(channel)) {
    return res.status(400).json({ message: "Valid OTP channel required" });
  }

  const student = channel === "email"
    ? await Student.findOne({ email: normalizeEmail(email) }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt")
    : await Student.findOne({ phone: normalizePhone(phone) }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt");
  if (!student) return res.status(404).json({ message: `Student account not found for this ${channel}` });

  const otp = generateOtp();
  student.passwordResetOtpHash = hashValue(otp);
  student.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  student.passwordResetVerifiedTokenHash = undefined;
  student.passwordResetVerifiedTokenExpiresAt = undefined;
  await student.save();

  if (channel === "email") {
    await sendStudentPasswordResetOtp({
      toEmail: student.email,
      studentName: student.name,
      otp
    });
  } else {
    await sendStudentPasswordResetSmsOtp({
      toPhone: student.phone,
      studentName: student.name,
      otp
    });
  }

  return res.json({
    message: `OTP sent successfully via ${channel === "email" ? "email" : "phone"}`
  });
}

async function verifyStudentForgotPasswordOtp(req, res) {
  const { channel, email, phone, otp } = req.body;
  if (!["email", "phone"].includes(channel) || !otp) {
    return res.status(400).json({ message: "Valid OTP channel and otp required" });
  }

  const student = channel === "email"
    ? await Student.findOne({ email: normalizeEmail(email) }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetVerifiedTokenHash +passwordResetVerifiedTokenExpiresAt")
    : await Student.findOne({ phone: normalizePhone(phone) }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetVerifiedTokenHash +passwordResetVerifiedTokenExpiresAt");

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

async function resetStudentPasswordWithOtp(req, res) {
  const { channel, email, phone, resetToken, newPassword } = req.body;
  if (!["email", "phone"].includes(channel) || !resetToken || !newPassword) {
    return res.status(400).json({ message: "Valid channel, resetToken and newPassword required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const student = channel === "email"
    ? await Student.findOne({ email: normalizeEmail(email) }).select("+passwordResetVerifiedTokenHash +passwordResetVerifiedTokenExpiresAt")
    : await Student.findOne({ phone: normalizePhone(phone) }).select("+passwordResetVerifiedTokenHash +passwordResetVerifiedTokenExpiresAt");

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

async function tpoSignup(req, res) {
  const { name, email, password, collegeName, phone, previousPassword } = req.body;
  validateTpoSignupInput({ name, email, password, collegeName, phone });

  const allTpos = await Tpo.find().sort({ updatedAt: -1, createdAt: -1 });

  if (!allTpos.length) {
    await ensureUniqueIdentity({ email, phone });
    const tpo = await Tpo.create({
      name,
      email: normalizeEmail(email),
      password,
      collegeName: collegeName || "",
      phone: normalizePhone(phone)
    });

    const token = signToken({ id: tpo._id, role: "tpo" });
    return res.status(201).json({ token, user: sanitizeUser(tpo) });
  }

  const normalizedPreviousPassword = String(previousPassword || "").trim();
  if (!normalizedPreviousPassword) {
    return res.status(400).json({ message: "Existing TPO password required to create a new TPO account" });
  }

  const matchedTpo = allTpos.find((tpo) => String(tpo.password || "").trim() === normalizedPreviousPassword);
  if (!matchedTpo) {
    return res.status(401).json({ message: "Previous TPO password did not match" });
  }

  await ensureUniqueIdentity({ email, phone, excludeTpoId: matchedTpo._id });

  const otherTpoIds = allTpos
    .filter((tpo) => String(tpo._id) !== String(matchedTpo._id))
    .map((tpo) => tpo._id);

  if (otherTpoIds.length) {
    await Promise.all([
      Job.updateMany({ createdByTpo: { $in: otherTpoIds } }, { $set: { createdByTpo: matchedTpo._id } }),
      Drive.updateMany({ createdByTpo: { $in: otherTpoIds } }, { $set: { createdByTpo: matchedTpo._id } }),
      Notice.updateMany({ createdByTpo: { $in: otherTpoIds } }, { $set: { createdByTpo: matchedTpo._id } }),
    ]);
    await Tpo.deleteMany({ _id: { $in: otherTpoIds } });
  }

  matchedTpo.name = name;
  matchedTpo.email = normalizeEmail(email);
  matchedTpo.password = String(password || "").trim();
  matchedTpo.collegeName = collegeName || "";
  matchedTpo.phone = normalizePhone(phone);
  await matchedTpo.save();

  const token = signToken({ id: matchedTpo._id, role: "tpo" });
  res.status(201).json({ token, user: sanitizeUser(matchedTpo) });
}

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
  studentSignup,
  studentLogin,
  studentForgotPassword,
  verifyStudentForgotPasswordOtp,
  resetStudentPasswordWithOtp,
  tpoSignup,
  tpoLogin
};
