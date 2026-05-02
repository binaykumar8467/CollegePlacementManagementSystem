import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { getRole, getUser } from "../lib/auth";
import BackButton from "../components/BackButton";

function normalizeCourseValue(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
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

function matchesEligibleCourse(studentCourse, eligibleCourses) {
  if (!Array.isArray(eligibleCourses) || !eligibleCourses.length) return true;
  const normalizedStudentCourse = normalizeCourseValue(studentCourse);
  return eligibleCourses.map(normalizeCourseValue).includes(normalizedStudentCourse);
}

export default function DriveDetails() {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const user = getUser();
  const [drive, setDrive] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/drives")
      .then(r => setDrive(r.data.find(x => x._id === driveId) || null))
      .catch(e => setErr(e?.response?.data?.message || "Failed to load drive"));
  }, [driveId]);

  const register = async () => {
    setErr(""); setMsg("");
    try {
      await api.post(`/api/drives/${driveId}/register`);
      setMsg("✅ Registered for drive!");
    } catch (e) {
      setErr(e?.response?.data?.message || "Register failed");
    }
  };

  const deleteDrive = async () => {
    const ok = window.confirm("Delete this drive?");
    if (!ok) return;
    setErr("");
    try {
      await api.delete(`/api/drives/${driveId}`);
      navigate("/drives");
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed");
    }
  };

  if (!drive) {
    return (
      <div className="container">
        <div className="card">
          {err ? <p style={{ color:"#b00020" }}>{err}</p> : <p>Loading...</p>}
          <BackButton fallback="/drives" label="Back" />
        </div>
      </div>
    );
  }

  const approved = Boolean(user?.isApproved);
  const profileComplete = isProfileComplete(user);
  const courseMatched = matchesEligibleCourse(user?.department, drive.eligibleDepartments || []);
  const canRegister = approved && profileComplete && courseMatched;

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent:"space-between" }}>
          <div>
            <h2>{drive.title}</h2>
            <small className="muted">{drive.company} • {new Date(drive.dateTime).toLocaleString()}</small>
          </div>
          <BackButton fallback="/drives" label="Back" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <div className="kpi"><strong>Venue</strong><div>{drive.venue || "-"}</div></div>
          <div className="kpi"><strong>Eligible Courses</strong><div>{drive.eligibleDepartments?.length ? drive.eligibleDepartments.join(", ") : "All"}</div></div>
        </div>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <div className="kpi"><strong>Minimum CGPA</strong><div>{Number(drive.minCgpa || 0) || "-"}</div></div>
          <div className="kpi"><strong>Minimum Percentage</strong><div>{Number(drive.minPercentage || 0) || "-"}</div></div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>Description</h3>
          <p>{drive.description || "-"}</p>
        </div>

        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}

        {role === "student" ? (
          <>
            {!approved ? <small className="muted">You are not approved by TPO. You cannot register.</small> : null}
            {approved && !profileComplete ? <small className="muted">Complete your profile with roll number, course, year, phone, and marks before registering.</small> : null}
            {approved && profileComplete && !courseMatched ? <small className="muted">You cannot register because your course does not match the drive eligibility.</small> : null}
            <div style={{ height: 8 }} />
            <button className="btn" onClick={register} disabled={!canRegister}>
              {!approved ? "Not Approved" : (!profileComplete ? "Complete Profile First" : (!courseMatched ? "Course Not Eligible" : "Register"))}
            </button>
          </>
        ) : role === "tpo" ? (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Link className="btn" to={`/tpo/drives/${driveId}/registrations`} state={{ from: location.pathname }}>Registrations</Link>
            <Link className="btn secondary" to={`/tpo/drives/${driveId}/edit`} state={{ from: location.pathname }}>Edit Drive</Link>
            <button className="btn secondary" onClick={deleteDrive}>Delete Drive</button>
          </div>
        ) : (
          <small className="muted">Login as student to register.</small>
        )}
      </div>
    </div>
  );
}
