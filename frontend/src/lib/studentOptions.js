// Stores reusable dropdown options and formatting helpers for student forms.
export const COURSE_OPTIONS = [
  "BA", "BBA", "BCA", "B.Com", "B.Com (Hons)", "B.Des", "B.Ed", "BHM", "BJMC", "B.Lib.I.Sc",
  "B.P.Ed", "B.Pharm", "B.Sc", "B.Sc Agriculture", "B.Sc Biotechnology", "B.Sc Computer Science",
  "B.Sc Data Science", "B.Sc Information Technology", "B.Sc Nursing", "BSW", "B.Tech", "B.Tech CSE",
  "B.Tech AI & ML", "B.Tech Data Science", "B.Tech IT", "B.Tech ECE", "B.Tech EE", "B.Tech ME",
  "B.Tech CE", "B.Tech Biotechnology", "B.Voc", "LLB", "LLM", "MA", "MBA", "MCA", "M.Com", "M.Des",
  "M.Ed", "M.Lib.I.Sc", "M.P.Ed", "M.Pharm", "M.Sc", "M.Sc Biotechnology", "M.Sc Computer Science",
  "M.Sc Data Science", "M.Sc Information Technology", "MSW", "M.Tech", "M.Tech CSE", "M.Tech AI & ML",
  "M.Tech Data Science", "M.Tech IT", "M.Tech ECE", "M.Tech EE", "M.Tech ME", "M.Tech CE", "PGDM"
];

export const STUDY_YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const formatPlacementYear = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const academicMatch = raw.match(/^(\d{4})-(\d{4})$/);
  if (academicMatch) {
    const start = Number(academicMatch[1]);
    const end = Number(academicMatch[2]);
    return end === start + 1 ? raw : "";
  }

  if (/^\d{4}$/.test(raw)) {
    const start = Number(raw);
    return `${start}-${start + 1}`;
  }

  return "";
};

export const getCurrentPlacementYear = () => formatPlacementYear(new Date().getFullYear());

export const getPlacementYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => formatPlacementYear(currentYear + index));
};
