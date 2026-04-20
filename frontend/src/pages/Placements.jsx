import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { getRole } from "../lib/auth";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { latestTimestamp, markModuleSeen, MODULE_KEYS } from "../lib/notifications";
import { formatPlacementYear, getPlacementYearOptions } from "../lib/studentOptions";

function getStudentView(placement) {
  return placement?.student || placement?.studentSnapshot || {};
}

export default function Placements() {
  const role = getRole();
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const [placementYear, setPlacementYear] = useState("");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setErr(""); setMsg("");
    const params = role === "tpo" ? { placementYear } : undefined;
    api.get("/api/placements", { params })
      .then(r => { setItems(r.data || []); if (role === "student") markModuleSeen(MODULE_KEYS.placements, latestTimestamp(r.data || [])); })
      .catch(e => setErr(e?.response?.data?.message || "Failed to load placements"));
  };

  useEffect(() => { load(); }, [role, placementYear]);

  const download = async () => {
    setErr(""); setMsg("");
    try {
      const params = role === "tpo" ? { placementYear } : undefined;
      const res = await api.get("/api/placements/report/download", { params, responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placements_report_${role === "tpo" ? placementYear : "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMsg("Report downloaded!");
    } catch (e) {
      setErr(e?.response?.data?.message || "Download failed");
    }
  };

  const deletePlacement = async (placementId) => {
    if (!window.confirm("Delete this placement entry?")) return;
    setErr(""); setMsg("");
    try {
      await api.delete(`/api/placements/${placementId}`);
      setItems((prev) => prev.filter((x) => x._id !== placementId));
      setMsg("Placement deleted.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent:"space-between" }}>
          <h2>Placements</h2>
          <div className="row">
            <BackButton fallback={role === "student" ? "/student/dashboard" : role === "tpo" ? "/tpo/dashboard" : "/"} label="Back" />
            {role === "tpo" ? <button className="btn" onClick={download}>Download CSV</button> : null}
          </div>
        </div>

        {role === "tpo" ? (
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            <div>
              <label>Session</label>
              <select className="input placement-year-select" value={placementYear} onChange={(e) => setPlacementYear(e.target.value)}>
                <option value="">All Sessions</option>
                {placementYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        ) : null}

        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr><th>Student</th><th>Session</th><th>Company</th><th>Opportunity</th><th>Package</th><th>Date</th>{role === "tpo" ? <th>Actions</th> : null}</tr>
          </thead>
          <tbody>
            {items.map(p => {
              const student = getStudentView(p);
              return (
              <tr key={p._id}>
                <td><strong>{student?.name}</strong><br/><small className="muted">{student?.email}</small></td>
                <td>{formatPlacementYear(student?.placementYear) || "-"}</td>
                <td>{p.company}</td>
                <td>{p.job?.title || p.drive?.title || "-"}</td>
                <td>{p.package || "-"}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                {role === "tpo" ? <td><button className="btn secondary" onClick={() => deletePlacement(p._id)}>Delete</button></td> : null}
              </tr>
            );
            })}
            {items.length === 0 ? <tr><td colSpan={role === "tpo" ? 7 : 6}><small className="muted">No placements yet{role === "tpo" && placementYear ? ` for session ${placementYear}` : ""}.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
