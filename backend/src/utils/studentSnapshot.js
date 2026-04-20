function buildStudentSnapshot(student) {
  if (!student) return {};

  return {
    name: student.name || "",
    email: student.email || "",
    rollNo: student.rollNo || "",
    department: student.department || "",
    year: student.year || "",
    placementYear: student.placementYear || "",
    phone: student.phone || "",
    gradingSystem: student.gradingSystem || "",
    cgpa: Number.isFinite(Number(student.cgpa)) ? Number(student.cgpa) : null,
    percentage: Number.isFinite(Number(student.percentage)) ? Number(student.percentage) : null,
    class10Percentage: Number.isFinite(Number(student.class10Percentage)) ? Number(student.class10Percentage) : null,
    class12Percentage: Number.isFinite(Number(student.class12Percentage)) ? Number(student.class12Percentage) : null,
    skills: Array.isArray(student.skills) ? student.skills : [],
    resumeLink: student.resumeLink || "",
    isApproved: Boolean(student.isApproved)
  };
}

module.exports = { buildStudentSnapshot };
