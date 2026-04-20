const Student = require('../models/Student');
const Tpo = require('../models/Tpo');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

async function ensureUniqueIdentity({ email, phone, excludeStudentId, excludeTpoId }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail) {
    const [studentEmail, tpoEmail] = await Promise.all([
      Student.findOne({ email: normalizedEmail, ...(excludeStudentId ? { _id: { $ne: excludeStudentId } } : {}) }).select('_id'),
      Tpo.findOne({ email: normalizedEmail, ...(excludeTpoId ? { _id: { $ne: excludeTpoId } } : {}) }).select('_id')
    ]);
    if (studentEmail || tpoEmail) {
      const err = new Error('This email is already registered');
      err.statusCode = 409;
      throw err;
    }
  }

  if (normalizedPhone) {
    const [studentPhone, tpoPhone] = await Promise.all([
      Student.findOne({ phone: normalizedPhone, ...(excludeStudentId ? { _id: { $ne: excludeStudentId } } : {}) }).select('_id'),
      Tpo.findOne({ phone: normalizedPhone, ...(excludeTpoId ? { _id: { $ne: excludeTpoId } } : {}) }).select('_id')
    ]);
    if (studentPhone || tpoPhone) {
      const err = new Error('This phone number is already registered');
      err.statusCode = 409;
      throw err;
    }
  }
}

module.exports = { normalizeEmail, normalizePhone, ensureUniqueIdentity };
