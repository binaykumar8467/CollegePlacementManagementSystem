import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { getRole } from "../lib/auth";
import { Link, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";
import { latestTimestamp, markModuleSeen, MODULE_KEYS } from "../lib/notifications";

export default function Drives() {
  const [drives, setDrives] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const role = getRole();
  const location = useLocation();
  const backFallback = role === "student" ? "/student/dashboard" : role === "tpo" ? "/tpo/dashboard" : "/";

  const loadDrives = () => {
    api.get("/api/drives")
      .then(r => {
        setDrives(r.data);
        if (role === 'student') markModuleSeen(MODULE_KEYS.drives, latestTimestamp(r.data || []));
      })
      .catch(e => setErr(e?.response?.data?.message || "Failed to load drives"));
  };

  useEffect(() => { loadDrives(); }, []);

  const deleteDrive = async (driveId) => {
    const ok = window.confirm("Delete this drive?");
    if (!ok) return;
    setErr("");
    try {
      await api.delete(`/api/drives/${driveId}`);
      setDrives(prev => prev.filter(d => d._id !== driveId));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete drive");
    }
  };

  const downloadReport = async () => {
    setErr(''); setMsg('');
    try {
      const res = await api.get('/api/drives/report/download', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'drives_summary.csv';
      document.body.appendChild(a); a.click(); a.remove();
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
          <h2 style={{ margin: 0 }}>Campus Drives</h2>
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
            {role === "tpo" ? <Link className="btn" to="/tpo/drives/new">+ Create Drive</Link> : null}
            {role === "tpo" ? <button className="btn secondary" onClick={downloadReport}>Download CSV</button> : null}
            <BackButton fallback={backFallback} label="Back" />
          </div>
        </div>
        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr><th>Title</th><th>Company</th><th>Date</th><th>Venue</th><th></th></tr>
          </thead>
          <tbody>
            {drives.map(d => (
              <tr key={d._id}>
                <td><strong>{d.title}</strong><br /><small className="muted">{d.description || "-"}</small></td>
                <td>{d.company}</td>
                <td>{new Date(d.dateTime).toLocaleString()}</td>
                <td>{d.venue || "-"}</td>
                <td>
                  <div className="row">
                    <Link className="btn secondary" to={`/drives/${d._id}`} state={{ from: "/drives" }}>View</Link>
                    {role === "tpo" ? <Link className="btn secondary" to={`/tpo/drives/${d._id}/edit`}>Edit</Link> : null}
                    {role === "tpo" ? <button className="btn secondary" onClick={() => deleteDrive(d._id)}>Delete</button> : null}
                  </div>
                </td>
              </tr>
            ))}
            {drives.length === 0 ? <tr><td colSpan="5"><small className="muted">No drives yet.</small></td></tr> : null}
          </tbody>
        </table>

        {role === "student" ? <div style={{ marginTop: 10 }}><Link className="btn secondary" to="/student/drives" state={{ from: "/drives" }}>My Drive Registrations</Link></div> : null}
      </div>
    </div>
  );
}
