import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../lib/api";
import { getRole, getUser } from "../lib/auth";
import BackButton from "../components/BackButton";

function normalizeCourseValue(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseEligibilityCourses(rawEligibility) {
  return String(rawEligibility || "")
    .split(/[,/\n|]+/)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function isProfileComplete(user) {
  if (!user) return false;
  const hasBasicDetails = Boolean(
    String(user.rollNo || "").trim() &&
    String(user.department || "").trim() &&
    String(user.year || "").trim() &&
    String(user.phone || "").trim()
  );
  if (!hasBasicDetails) return false;
  if (user.gradingSystem === "cgpa") return Number.isFinite(Number(user.cgpa));
  if (user.gradingSystem === "percentage") return Number.isFinite(Number(user.percentage));
  return false;
}

function matchesEligibleCourse(studentCourse, rawEligibility) {
  const eligibleCourses = parseEligibilityCourses(rawEligibility);
  if (!eligibleCourses.length) return true;
  const normalizedStudentCourse = normalizeCourseValue(studentCourse);
  return eligibleCourses.map(normalizeCourseValue).includes(normalizedStudentCourse);
}

export default function JobDetails() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const role = getRole();
  const user = getUser();

  useEffect(() => {
    api.get("/api/jobs")
      .then(r => {
        const found = r.data.find(x => x._id === jobId);
        setJob(found || null);
      })
      .catch(e => setErr(e?.response?.data?.message || "Failed to load job"));
  }, [jobId]);

  const apply = async () => {
    setErr(""); setMsg("");
    try {
      await api.post(`/api/applications/${jobId}/apply`);
      setMsg("✅ Applied successfully!");
    } catch (e) {
      setErr(e?.response?.data?.message || "Apply failed");
    }
  };

  const deleteJob = async () => {
    const ok = window.confirm("Delete this job?");
    if (!ok) return;
    setErr(""); setMsg("");
    try {
      await api.delete(`/api/jobs/${jobId}`);
      nav("/jobs");
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed");
    }
  };

  if (!job) {
    return (
      <div className="container">
        <div className="card">
          {err ? <p style={{ color: "#b00020" }}>{err}</p> : <p>Loading...</p>}
          <BackButton fallback="/jobs" label="Back" />
        </div>
      </div>
    );
  }

  const deadlinePassed = new Date(job.deadline).getTime() < Date.now();
  const approved = Boolean(user?.isApproved);
  const profileComplete = isProfileComplete(user);
  const courseMatched = matchesEligibleCourse(user?.department, job.eligibility);
  const canApply = approved && profileComplete && courseMatched && !deadlinePassed;

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>{job.title}</h2>
            <small className="muted">{job.company} • {job.location || "—"}</small>
          </div>
          <BackButton fallback="/jobs" label="Back" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <div className="kpi">
            <strong>Deadline</strong><div>{new Date(job.deadline).toLocaleString()}</div>
          </div>
          <div className="kpi">
            <strong>Salary</strong><div>{job.salary || "—"}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>Description</h3>
          <p>{job.description || "—"}</p>
          <h3>Eligibility</h3>
          <p>{job.eligibility || "—"}</p>
        </div>

        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}

        {role === "student" ? (
          <>
            {!approved ? <small className="muted">You are not approved by TPO. You cannot apply.</small> : null}
            {approved && !profileComplete ? <small className="muted">Complete your profile with roll number, course, year, phone, and marks before applying.</small> : null}
            {approved && profileComplete && !courseMatched ? <small className="muted">You cannot apply because your course does not match the job eligibility.</small> : null}
            <div style={{ height: 8 }} />
            <button className="btn" onClick={apply} disabled={!canApply}>
              {deadlinePassed ? "Deadline Passed" : (!approved ? "Not Approved" : (!profileComplete ? "Complete Profile First" : (!courseMatched ? "Course Not Eligible" : "Apply")))}
            </button>
          </>
        ) : role === "tpo" ? (
          <div className="row">
            <Link className="btn" to={`/tpo/jobs/${jobId}/applicants`}>View Applicants</Link>
            <button className="btn secondary" onClick={deleteJob}>Delete Job</button>
          </div>
        ) : (
          <small className="muted">Login as student to apply.</small>
        )}
      </div>
    </div>
  );
}
