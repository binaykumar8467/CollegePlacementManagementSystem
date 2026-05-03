// Displays the TPO dashboard with placement management shortcuts and summaries.
import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { getUser } from "../../lib/auth";
import { Link } from "react-router-dom";

const dashboardCardStyle = {
  boxShadow: "0 18px 36px rgba(0, 33, 71, 0.14)",
  border: "1px solid rgba(0, 33, 71, 0.28)",
  backdropFilter: "blur(10px)"
};

// Render a reusable dashboard shortcut card for TPO users.
function QuickLink({ title, subtitle, to, actions }) {
  return (
    <div className="card quick-link-card" style={dashboardCardStyle}>
      <Link to={to} state={{ from: "/tpo/dashboard" }} style={{ display: "block" }}>
        <strong>{title}</strong>
        <div style={{ marginTop: 6 }}>
          <small className="muted">{subtitle}</small>
        </div>
      </Link>
      {actions ? <div className="row" style={{ marginTop: 12 }}>{actions}</div> : null}
    </div>
  );
}

// Render the TPO dashboard and load high-level management summaries.
export default function TpoDashboard() {
  const user = getUser();
  const [jobs, setJobs] = useState([]);
  const [drives, setDrives] = useState([]);
  const [notices, setNotices] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [err, setErr] = useState("");

  // Load dashboard data needed by this screen.
  const loadDashboard = async () => {
    try {
      const [jobsRes, drivesRes, noticesRes, placementsRes] = await Promise.all([
        api.get("/api/jobs"),
        api.get("/api/drives"),
        api.get("/api/notices"),
        api.get("/api/placements")
      ]);
      setJobs(jobsRes.data || []);
      setDrives(drivesRes.data || []);
      setNotices(noticesRes.data || []);
      setPlacements(placementsRes.data || []);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load dashboard data");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>TPO Dashboard</h2>
            <small className="muted">{user?.name} | {user?.email}</small>
          </div>
          <div className="row">
            <Link className="btn" to="/tpo/jobs/new" state={{ from: "/tpo/dashboard" }}>+ Job</Link>
            <Link className="btn" to="/tpo/drives/new" state={{ from: "/tpo/dashboard" }}>+ Drive</Link>
            <Link className="btn" to="/tpo/notices/new" state={{ from: "/tpo/dashboard" }}>+ Notice</Link>
          </div>
        </div>

        {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}

        <div className="grid grid-2" style={{ marginTop: 14 }}>
          <QuickLink
            title="Jobs"
            subtitle={`${jobs.length} jobs available. View applicants, edit jobs, and manage hiring posts.`}
            to="/jobs"
            actions={
              <>
                <Link className="btn" to="/jobs" state={{ from: "/tpo/dashboard" }}>Open Jobs</Link>
                <Link className="btn" to="/tpo/jobs/new" state={{ from: "/tpo/dashboard" }}>Create Job</Link>
              </>
            }
          />
          <QuickLink
            title="Drives"
            subtitle={`${drives.length} drives created. Check campus drive details and registrations.`}
            to="/drives"
            actions={
              <>
                <Link className="btn" to="/drives" state={{ from: "/tpo/dashboard" }}>Open Drives</Link>
                <Link className="btn" to="/tpo/drives/new" state={{ from: "/tpo/dashboard" }}>Create Drive</Link>
              </>
            }
          />
          <QuickLink
            title="Notices"
            subtitle={`${notices.length} notices published. Create updates and manage student notices.`}
            to="/notices"
            actions={
              <>
                <Link className="btn" to="/notices" state={{ from: "/tpo/dashboard" }}>Open Notices</Link>
                <Link className="btn" to="/tpo/notices/new" state={{ from: "/tpo/dashboard" }}>Create Notice</Link>
              </>
            }
          />
          <QuickLink
            title="Placements"
            subtitle={`${placements.length} placement records available. Review selected students and reports.`}
            to="/placements"
            actions={<Link className="btn" to="/placements" state={{ from: "/tpo/dashboard" }}>Open Placements</Link>}
          />
        </div>

        <div className="grid grid-2" style={{ marginTop: 14 }}>
          <div className="kpi" style={{ boxShadow: "0 18px 36px rgba(0, 33, 71, 0.12)", border: "1px solid rgba(0, 33, 71, 0.24)", backdropFilter: "blur(10px)" }}>
            <strong>Students Approval</strong>
            <div style={{ marginTop: 8 }}>
              <small className="muted">Approve students, view profile documents, and download reports.</small>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <Link className="btn" to="/tpo/students">Open Students</Link>
            </div>
          </div>
          <div className="kpi" style={{ boxShadow: "0 18px 36px rgba(0, 33, 71, 0.12)", border: "1px solid rgba(0, 33, 71, 0.24)", backdropFilter: "blur(10px)" }}>
            <strong>Quick Summary</strong>
            <div style={{ marginTop: 8 }}>
              <small className="muted">Jobs: {jobs.length} | Drives: {drives.length} | Notices: {notices.length} | Placements: {placements.length}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
