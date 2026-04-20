import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { getUser } from "../../lib/auth";
import { Link } from "react-router-dom";
import { hasUnseen, latestTimestamp, MODULE_KEYS } from "../../lib/notifications";

const dashboardCardStyle = {
  boxShadow: "0 18px 36px rgba(0, 33, 71, 0.14)",
  border: "1px solid rgba(0, 33, 71, 0.28)",
  backdropFilter: "blur(10px)",
  display: "block"
};

function QuickLink({ title, subtitle, to, showDot }) {
  return (
    <Link to={to} state={{ from: "/student/dashboard" }} className="card quick-link-card" style={dashboardCardStyle}>
      {showDot ? <span className="notif-dot-corner" /> : null}
      <strong>{title}</strong>
      <div style={{ marginTop: 6 }}><small className="muted">{subtitle}</small></div>
    </Link>
  );
}

export default function StudentDashboard() {
  const user = getUser();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [updates, setUpdates] = useState({ jobs: false, drives: false, notices: false, placements: false, interviews: false });

  useEffect(() => {
    Promise.all([api.get("/api/applications/my"), api.get("/api/drives/my/registrations")])
      .then(([applicationsRes, registrationsRes]) => {
        const applicationItems = (applicationsRes.data || []).map((item) => ({
          id: `job-${item._id}`,
          type: "Job",
          title: item.job?.title || "-",
          company: item.job?.company || "-",
          status: item.status,
          note: item.note || "-",
          to: item.job?._id ? `/jobs/${item.job._id}` : null
        }));
        const registrationItems = (registrationsRes.data || []).map((item) => ({
          id: `drive-${item._id}`,
          type: "Drive",
          title: item.drive?.title || "-",
          company: item.drive?.company || "-",
          status: item.status || "REGISTERED",
          note: item.note || "-",
          to: item.drive?._id ? `/drives/${item.drive._id}` : null
        }));
        setItems([...applicationItems, ...registrationItems]);
      })
      .catch(e => setErr(e?.response?.data?.message || "Failed to load applications"));
  }, []);

  useEffect(() => {
    Promise.all([api.get('/api/jobs'), api.get('/api/drives'), api.get('/api/notices'), api.get('/api/placements'), api.get('/api/interviews/my')])
      .then(([jobsRes, drivesRes, noticesRes, placementsRes, interviewsRes]) => {
        setUpdates({
          jobs: hasUnseen(MODULE_KEYS.jobs, latestTimestamp(jobsRes.data || [])),
          drives: hasUnseen(MODULE_KEYS.drives, latestTimestamp(drivesRes.data || [])),
          notices: hasUnseen(MODULE_KEYS.notices, latestTimestamp(noticesRes.data || [])),
          placements: hasUnseen(MODULE_KEYS.placements, latestTimestamp(placementsRes.data || [])),
          interviews: hasUnseen(MODULE_KEYS.interviews, latestTimestamp(interviewsRes.data || []))
        });
      })
      .catch(() => {});
  }, []);

  const approved = Boolean(user?.isApproved);

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div><h2>Student Dashboard</h2><small className="muted">{user?.name} • {user?.email}</small></div>
          <div className="row"><Link className="btn secondary" to="/student/profile" state={{ from: "/student/dashboard" }}>Profile</Link><Link className="btn secondary dashboard-interviews-btn" to="/student/interviews" state={{ from: "/student/dashboard" }}><span className="nav-with-dot">Interviews{updates.interviews ? <span className="notif-dot" aria-hidden="true" /> : null}</span></Link></div>
        </div>

        <div className="kpi" style={{ marginTop: 12, boxShadow: "0 18px 36px rgba(0, 33, 71, 0.12)", border: "1px solid rgba(0, 33, 71, 0.24)", backdropFilter: "blur(10px)" }}>
          <strong>Placement Eligibility</strong>
          <div style={{ marginTop: 6 }}>{approved ? <span className="badge">APPROVED</span> : <span className="badge">NOT APPROVED</span>}</div>
          {!approved ? <small className="muted">You cannot apply until TPO approves you.</small> : null}
          {user?.approvalNote ? <div style={{ marginTop: 8 }}><small className="muted">Remarks: {user.approvalNote}</small></div> : null}
        </div>

        <div className="grid grid-2" style={{ marginTop: 14 }}>
          <QuickLink title="Jobs" subtitle="New jobs" to="/jobs" showDot={updates.jobs} />
          <QuickLink title="Drives" subtitle="See upcoming campus drives" to="/drives" showDot={updates.drives} />
          <QuickLink title="Notices" subtitle="Read latest TPO notices" to="/notices" showDot={updates.notices} />
          <QuickLink title="Placements" subtitle="Placement results and updates" to="/placements" showDot={updates.placements} />
        </div>

        {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}

        <h3 style={{ marginTop: 14 }}>My Applications</h3>
        <table className="table">
          <thead><tr><th>Opportunity</th><th>Company</th><th>Current Status</th><th>Remarks</th></tr></thead>
          <tbody>
            {items.map(item => <tr key={item.id}><td>{item.to ? <Link to={item.to} state={{ from: "/student/dashboard" }}>{item.title}</Link> : item.title}<br /><small className="muted">{item.type}</small></td><td>{item.company}</td><td><span className={`badge compact-status-badge${item.status === "REJECTED" ? " badge-rejected" : ""}`}>{item.status}</span></td><td>{item.note || "-"}</td></tr>)}
            {items.length === 0 ? <tr><td colSpan="4"><small className="muted">No applications yet.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
