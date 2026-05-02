function normalizeCourseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseEligibilityCourses(rawEligibility) {
  return String(rawEligibility || "")
    .split(/[,/\n|]+/)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function isStudentProfileComplete(student) {
  if (!student) return false;

  const hasBasicDetails = Boolean(
    String(student.rollNo || "").trim() &&
    String(student.department || "").trim() &&
    String(student.year || "").trim() &&
    String(student.phone || "").trim()
  );

  if (!hasBasicDetails) return false;

  if (!student.gradingSystem) return false;

  if (student.gradingSystem === "cgpa") {
    return Number.isFinite(Number(student.cgpa));
  }

  if (student.gradingSystem === "percentage") {
    return Number.isFinite(Number(student.percentage));
  }

  return false;
}

function matchesEligibleCourse(studentDepartment, eligibleCourses) {
  const normalizedStudentCourse = normalizeCourseValue(studentDepartment);
  if (!normalizedStudentCourse) return false;

  if (!Array.isArray(eligibleCourses) || !eligibleCourses.length) {
    return true;
  }

  const normalizedEligibleCourses = eligibleCourses.map(normalizeCourseValue).filter(Boolean);
  return normalizedEligibleCourses.includes(normalizedStudentCourse);
}

module.exports = {
  parseEligibilityCourses,
  isStudentProfileComplete,
  matchesEligibleCourse,
};
