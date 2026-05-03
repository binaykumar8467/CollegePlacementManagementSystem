// Contains helper logic for profile completeness and job or drive eligibility checks.
function normalizeCourseValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Split the job eligibility text into comparable course values.
function parseEligibilityCourses(rawEligibility) {
  if (Array.isArray(rawEligibility)) {
    return rawEligibility
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(rawEligibility || "")
    .split(/[,/\n|]+/)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

// Check whether the student profile has the required fields for placements.
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

// Compare the student course with the allowed course list.
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
  normalizeCourseValue,
  parseEligibilityCourses,
  isStudentProfileComplete,
  matchesEligibleCourse,
};
