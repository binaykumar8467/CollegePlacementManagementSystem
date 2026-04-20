import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../lib/api";
import { getRole, getUser } from "../lib/auth";
import BackButton from "../components/BackButton";

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
            <div style={{ height: 8 }} />
            <button className="btn" onClick={apply} disabled={deadlinePassed || !approved}>
              {deadlinePassed ? "Deadline Passed" : (!approved ? "Not Approved" : "Apply")}
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
