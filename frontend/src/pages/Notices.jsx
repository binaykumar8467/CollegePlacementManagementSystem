import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { getRole } from "../lib/auth";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { latestTimestamp, markModuleSeen, MODULE_KEYS } from "../lib/notifications";
import { getPlacementYearOptions } from "../lib/studentOptions";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function shortContent(text) {
  const value = String(text || "").trim();
  return value.length <= 120 ? value : `${value.slice(0, 120)}...`;
}

export default function Notices() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");
  const role = getRole();
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const [placementYear, setPlacementYear] = useState("");

  const loadNotices = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/notices", { params: { placementYear } });
      setItems(r.data || []);
      setErr("");
      if (role === "student") {
        markModuleSeen(MODULE_KEYS.notices, latestTimestamp(r.data || []));
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [placementYear]);

  const openedNotice = useMemo(() => items.find((n) => n._id === openId) || null, [items, openId]);

  const removeNotice = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this notice?");
    if (!ok) return;
    setBusyId(id);
    try {
      await api.delete(`/api/notices/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      if (openId === id) setOpenId(null);
    } catch (e) {
      window.alert(e?.response?.data?.message || "Delete notice failed");
    } finally {
      setBusyId(null);
    }
  };

  const downloadReport = async () => {
    setErr("");
    setMsg("");
    try {
      const res = await api.get("/api/notices/report/download", { params: { placementYear }, responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notices_summary_${placementYear || "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMsg("Report downloaded!");
    } catch (e) {
      setErr(e?.response?.data?.message || "Download failed");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Notices</h2>
          <div className="row">
            <BackButton fallback={role === "student" ? "/student/dashboard" : role === "tpo" ? "/tpo/dashboard" : "/"} label="Back" />
            {role === "tpo" ? <button className="btn secondary" onClick={downloadReport}>Download CSV</button> : null}
            {role === "tpo" ? <Link className="btn" to="/tpo/notices/new">+ Create Notice</Link> : null}
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 12, marginBottom: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label>Session</label>
            <select className="input placement-year-select" value={placementYear} onChange={(e) => setPlacementYear(e.target.value)}>
              <option value="">All Sessions</option>
              {placementYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}
        {loading ? <p className="muted">Loading notices...</p> : null}

        <div className="grid" style={{ marginTop: 10 }}>
          {items.map((n) => (
            <div className="card" key={n._id} style={{ boxShadow: "none", border: "1px solid #eee", padding: "12px 14px", borderRadius: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <strong>{n.title}</strong>
                  <div>
                    <small className="muted">{n.placementYear || "All Sessions"} | {formatDate(n.createdAt)}</small>
                  </div>
                </div>
                <div className="row">
                  <button className="btn secondary" type="button" onClick={() => setOpenId(n._id)}>View</button>
                  {role === "tpo" ? (
                    <>
                      <Link className="btn" to={`/tpo/notices/${n._id}/edit`}>Edit</Link>
                      <button className="btn danger" type="button" disabled={busyId === n._id} onClick={() => removeNotice(n._id)}>
                        {busyId === n._id ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <p style={{ margin: "6px 0 4px", lineHeight: 1.45 }}>{shortContent(n.content)}</p>
              {n.attachment?.url ? <small className="muted">Attachment available: {n.attachment.originalName || n.attachment.fileName}</small> : null}
            </div>
          ))}
          {!loading && items.length === 0 ? <small className="muted">No notices yet.</small> : null}
        </div>
      </div>

      {openedNotice ? (
        <div className="modal-backdrop" onClick={() => setOpenId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{openedNotice.title}</h3>
                <small className="muted">{formatDate(openedNotice.createdAt)}</small>
              </div>
              <button className="btn secondary" type="button" onClick={() => setOpenId(null)}>Close</button>
            </div>
            <div className="notice-full-content">{openedNotice.content}</div>
            {openedNotice.attachment?.url ? (
              <div className="notice-attachment-box">
                <strong>Attached File</strong>
                <div style={{ marginTop: 6 }}>{openedNotice.attachment.originalName || openedNotice.attachment.fileName}</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <a className="notice-link" href={`${api.defaults.baseURL}${openedNotice.attachment.url}`} target="_blank" rel="noreferrer">
                    View / Download Attachment
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
