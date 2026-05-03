// Validates signup form values before they are submitted from the frontend.
import { getPlacementYearOptions } from "./studentOptions";

const emailRegex = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;
const phoneRegex = /^\d{10}$/;
const nameRegex = /^[A-Za-z][A-Za-z\s.'-]*$/;
const rollNoRegex = /^[A-Za-z0-9/-]+$/;
const passwordLetterRegex = /[A-Za-z]/;
const passwordNumberRegex = /\d/;
const passwordSpecialRegex = /[^A-Za-z0-9]/;

// Trim form input before running validation checks.
function normalizeText(value) {
  return String(value || "").trim();
}

// Validate the user name field on the frontend.
export function validateName(value) {
  const name = normalizeText(value);
  if (!name) return "Name is required";
  if (!nameRegex.test(name)) return "Name must contain only letters";
  return "";
}

// Validate the email field on the frontend.
export function validateEmail(value) {
  const email = normalizeText(value);
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Enter a valid email address";
  const localPart = email.split("@")[0] || "";
  if (!/[A-Za-z]/.test(localPart)) return "Email must contain at least one letter before @";
  return "";
}

// Validate a login identifier that may be an email or phone number.
export function validateEmailOrPhone(value) {
  const input = normalizeText(value);
  if (!input) return "Email or phone number is required";
  if (phoneRegex.test(input)) return "";
  if (emailRegex.test(input)) {
    const localPart = input.split("@")[0] || "";
    if (!/[A-Za-z]/.test(localPart)) return "Email must contain at least one letter before @";
    return "";
  }
  return "Enter a valid email or phone number";
}

// Validate the password field on the frontend.
export function validatePassword(value) {
  const password = String(value || "");
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 16) return "Password must be at most 16 characters";
  if (!passwordLetterRegex.test(password)) return "Password must contain at least one letter";
  if (!passwordNumberRegex.test(password)) return "Password must contain at least one number";
  if (!passwordSpecialRegex.test(password)) return "Password must contain at least one special character";
  return "";
}

// Validate the phone number field on the frontend.
export function validatePhone(value) {
  const phone = normalizeText(value);
  if (!phone) return "Phone number is required";
  if (!phoneRegex.test(phone)) return "Phone number must be 10 digits";
  return "";
}

// Validate the placement session field on the frontend.
export function validatePlacementYear(value) {
  const placementYear = normalizeText(value);
  const placementYears = getPlacementYearOptions();
  if (!placementYear) return "Session is required";
  if (!placementYears.includes(placementYear)) return "Select a valid session";
  return "";
}

// Validate the college name field for TPO signup.
export function validateCollegeName(value) {
  const collegeName = normalizeText(value);
  if (!collegeName) return "College name is required";
  if (!nameRegex.test(collegeName)) return "College name must contain only letters";
  return "";
}

// Validate the previous-password field required for additional TPO accounts.
export function validatePreviousPassword(value, needsPreviousPassword = false) {
  const previousPassword = String(value || "").trim();
  if (needsPreviousPassword && !previousPassword) return "Previous TPO password is required";
  return "";
}

// Run field-level validation for the student signup form.
export function validateStudentField(name, value) {
  switch (name) {
    case "name": return validateName(value);
    case "email": return validateEmail(value);
    case "password": return validatePassword(value);
    case "phone": return validatePhone(value);
    case "placementYear": return validatePlacementYear(value);
    default: return "";
  }
}

// Run field-level validation for the TPO signup form.
export function validateTpoField(name, value, needsPreviousPassword = false) {
  switch (name) {
    case "name": return validateName(value);
    case "email": return validateEmail(value);
    case "password": return validatePassword(value);
    case "collegeName": return validateCollegeName(value);
    case "phone": return validatePhone(value);
    case "previousPassword": return validatePreviousPassword(value, needsPreviousPassword);
    default: return "";
  }
}

// Check whether the complete student signup form is valid.
export function validateStudentSignup(form) {
  const requiredFields = ["name", "email", "password", "phone", "placementYear"];
  const allEmpty = requiredFields.every((field) => !normalizeText(form[field]));
  if (allEmpty) return "All fields are mandatory";

  const fieldOrder = ["name", "email", "password", "phone", "placementYear"];
  for (const field of fieldOrder) {
    const error = validateStudentField(field, form[field]);
    if (error) return error;
  }
  return "";
}

// Collect field errors for the student signup form.
export function getStudentSignupErrors(form) {
  const fieldOrder = ["name", "email", "password", "phone", "placementYear"];
  return fieldOrder.reduce((errors, field) => {
    const error = validateStudentField(field, form[field]);
    if (error) {
      errors[field] = error;
    }
    return errors;
  }, {});
}

// Check whether the complete TPO signup form is valid.
export function validateTpoSignup(form, needsPreviousPassword = false) {
  const requiredFields = ["name", "email", "password", "collegeName", "phone"];
  const allRequiredEmpty = requiredFields.every((field) => !normalizeText(form[field]));
  const previousPasswordEmpty = !normalizeText(form.previousPassword);
  if (allRequiredEmpty && (!needsPreviousPassword || previousPasswordEmpty)) return "All fields are mandatory";

  const fieldOrder = ["name", "email", "password", "collegeName", "phone", "previousPassword"];
  for (const field of fieldOrder) {
    const error = validateTpoField(field, form[field], needsPreviousPassword);
    if (error) return error;
  }
  return "";
}

// Collect field errors for the TPO signup form.
export function getTpoSignupErrors(form, needsPreviousPassword = false) {
  const fieldOrder = ["name", "email", "password", "collegeName", "phone", "previousPassword"];
  return fieldOrder.reduce((errors, field) => {
    const error = validateTpoField(field, form[field], needsPreviousPassword);
    if (error) {
      errors[field] = error;
    }
    return errors;
  }, {});
}
