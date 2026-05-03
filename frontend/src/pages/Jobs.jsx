// Lists available jobs and management actions based on user role.
import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { getRole } from "../lib/auth";
import { Link, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";
import { latestTimestamp, markModuleSeen, MODULE_KEYS } from "../lib/notifications";

// Render the job listing page and load available job posts.
export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const role = getRole();
  const location = useLocation();
  const backFallback = role === "student" ? "/student/dashboard" : role === "tpo" ? "/tpo/dashboard" : "/";

// Load  jobs data needed by this screen.
  const loadJobs = () => {
    api.get("/api/jobs")
      .then(r => {
        setJobs(r.data);
        if (role === 'student') markModuleSeen(MODULE_KEYS.jobs, latestTimestamp(r.data || []));
      })
      .catch(e => setErr(e?.response?.data?.message || "Failed to load jobs"));
  };

  useEffect(() => { loadJobs(); }, []);

// Delete  job data for the current flow.
  const deleteJob = async (jobId) => {
    const ok = window.confirm("Delete this job?");
    if (!ok) return;
    setErr("");
    try {
      await api.delete(`/api/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete job");
    }
  };

// Prepare and download  report data as a report.
  const downloadReport = async () => {
    setErr(""); setMsg("");
    try {
      const res = await api.get('/api/jobs/report/download', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jobs_summary.csv';
      document.body.appendChild(a);
      a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setMsg('Report downloaded!');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Download failed');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Jobs</h2>
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
            {role === "tpo" ? <Link className="btn" to="/tpo/jobs/new">+ Create Job</Link> : null}
            {role === "tpo" ? <button className="btn secondary" onClick={downloadReport}>Download CSV</button> : null}
            <BackButton fallback={backFallback} label="Back" />
          </div>
        </div>
        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr><th>Title</th><th>Company</th><th>Deadline</th><th>Salary</th><th></th></tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j._id}>
                <td><strong>{j.title}</strong><br /><small className="muted">{j.location || "-"}</small></td>
                <td>{j.company}</td>
                <td>{new Date(j.deadline).toLocaleDateString()}</td>
                <td>{j.salary || "-"}</td>
                <td><div className="row"><Link className="btn secondary" to={`/jobs/${j._id}`} state={{ from: "/jobs" }}>View</Link>{role === "tpo" ? <Link className="btn secondary" to={`/tpo/jobs/${j._id}/edit`} state={{ from: "/jobs" }}>Edit</Link> : null}{role === "tpo" ? <button className="btn secondary" onClick={() => deleteJob(j._id)}>Delete</button> : null}</div></td>
              </tr>
            ))}
            {jobs.length === 0 ? <tr><td colSpan="5"><small className="muted">No jobs posted yet.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
