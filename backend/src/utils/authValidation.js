// Validates student and TPO authentication form input before processing.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const nameRegex = /^[A-Za-z][A-Za-z\s.'-]*$/;
const { getPlacementYearOptions, normalizePlacementYear } = require("./placementYear");

// Trim text input before validation checks are applied.
function normalizeText(value) {
  return String(value || "").trim();
}

// Create a reusable validation error with a 400 status code.
function createValidationError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

// Validate the shared signup fields used by both student and TPO forms.
function validateCommonSignupFields({ name, email, password, phone }) {
  const normalizedName = normalizeText(name);
  const normalizedEmail = normalizeText(email);
  const normalizedPassword = String(password || "");
  const normalizedPhone = normalizeText(phone);

  if (!normalizedName) throw createValidationError("Name is required");
  if (!nameRegex.test(normalizedName)) throw createValidationError("Name must contain only letters");
  if (!normalizedEmail) throw createValidationError("Email is required");
  if (!emailRegex.test(normalizedEmail)) throw createValidationError("Enter a valid email address");
  if (!/[A-Za-z]/.test(normalizedEmail.split("@")[0] || "")) {
    throw createValidationError("Email must contain at least one letter before @");
  }
  if (!normalizedPassword) throw createValidationError("Password is required");
  if (normalizedPassword.length < 6) throw createValidationError("Password must be at least 6 characters");
  if (!normalizedPhone) throw createValidationError("Phone number is required");
  if (!phoneRegex.test(normalizedPhone)) throw createValidationError("Phone number must be 10 digits");
}

// Validate the student-specific signup fields before account creation.
function validateStudentSignupInput({ name, email, password, phone, placementYear }) {
  validateCommonSignupFields({ name, email, password, phone });

  const normalizedPlacementYear = normalizePlacementYear(placementYear);
  if (!normalizedPlacementYear) throw createValidationError("Session is required");
  if (!getPlacementYearOptions().includes(normalizedPlacementYear)) {
    throw createValidationError("Select a valid session");
  }
}

// Validate the TPO-specific signup fields before account creation.
function validateTpoSignupInput({ name, email, password, collegeName, phone }) {
  validateCommonSignupFields({ name, email, password, phone });

  const normalizedCollegeName = normalizeText(collegeName);
  if (!normalizedCollegeName) throw createValidationError("College name is required");
  if (!nameRegex.test(normalizedCollegeName)) throw createValidationError("College name must contain only letters");
}

module.exports = {
  validateStudentSignupInput,
  validateTpoSignupInput
};
