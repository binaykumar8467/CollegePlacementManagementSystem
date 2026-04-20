function toAcademicYear(startYear) {
  const start = Number(startYear);
  if (!Number.isInteger(start)) return "";
  return `${start}-${start + 1}`;
}

function normalizePlacementYear(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const academicMatch = raw.match(/^(\d{4})-(\d{4})$/);
  if (academicMatch) {
    const start = Number(academicMatch[1]);
    const end = Number(academicMatch[2]);
    return end === start + 1 ? raw : "";
  }

  if (/^\d{4}$/.test(raw)) {
    return toAcademicYear(raw);
  }

  return "";
}

function getCurrentPlacementYear() {
  return toAcademicYear(new Date().getFullYear());
}

function getPlacementYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => toAcademicYear(currentYear + index));
}

module.exports = {
  normalizePlacementYear,
  getCurrentPlacementYear,
  getPlacementYearOptions
};
