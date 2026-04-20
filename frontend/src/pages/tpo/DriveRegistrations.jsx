import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";
import { COURSE_OPTIONS, getCurrentPlacementYear, getPlacementYearOptions } from "../../lib/studentOptions";

const statuses = ["REGISTERED", "SHORTLISTED", "REJECTED", "SELECTED"];
const defaultSchedule = { round: "Round 1", dateTime: "", mode: "OFFLINE", location: "", note: "" };

function getStudentView(item) {
  return item?.student || item?.studentSnapshot || {};
}

function toInputDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DriveRegistrations() {
  const { driveId } = useParams();
  const [items, setItems] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [noteFor, setNoteFor] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("REGISTERED");
  const [scheduleFor, setScheduleFor] = useState("");
  const [shortlistChoiceFor, setShortlistChoiceFor] = useState("");
  const [form, setForm] = useState(defaultSchedule);
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const [placementYear, setPlacementYear] = useState(getCurrentPlacementYear());
  const interviewMap = useMemo(() => {
    const map = new Map();
    (interviews || []).forEach((item) => {
      const id = item?.driveRegistration?._id;
      if (id) map.set(String(id), item);
    });
    return map;
  }, [interviews]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const student = getStudentView(item);
      const matchesSearch = !query
        || String(student?.name || "").toLowerCase().includes(query)
        || String(student?.rollNo || "").toLowerCase().includes(query);
      const matchesBranch = !branchFilter || String(student?.department || "") === branchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [items, searchTerm, branchFilter]);
  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item._id));

  const load = () => {
    setErr("");
    setMsg("");
    Promise.all([
      api.get(`/api/drives/${driveId}/registrations`, { params: { placementYear } }),
      api.get(`/api/interviews/drive/${driveId}`)
    ])
      .then(([registrationsRes, interviewsRes]) => {
        const registrations = registrationsRes.data || [];
        setItems(registrations);
        setInterviews(interviewsRes.data || []);
        setNoteDrafts(Object.fromEntries(registrations.map((item) => [item._id, item.note || ""])));
        setSelectedIds([]);
      })
      .catch((e) => setErr(e?.response?.data?.message || "Failed to load"));
  };

  useEffect(() => { load(); }, [driveId, placementYear]);

  const updateStatus = async (registrationId, status, noteValue = noteDrafts[registrationId] || "") => {
    if (status === "SHORTLISTED") {
      const existing = interviewMap.get(String(registrationId));
      setShortlistChoiceFor(registrationId);
      setScheduleFor("");
      setForm(existing ? {
        round: existing.round || "Round 1",
        dateTime: toInputDateTime(existing.dateTime),
        mode: existing.mode || "OFFLINE",
        location: existing.location || "",
        note: existing.note || ""
      } : {
        ...defaultSchedule,
        dateTime: toInputDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
      });
      return;
    }
    setErr("");
    setMsg("");
    setShortlistChoiceFor("");
    setScheduleFor("");
    setForm(defaultSchedule);
    try {
      await api.patch(`/api/drives/registration/${registrationId}/status`, { status, note: noteValue });
      setMsg(`Status changed to ${status}.`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Update failed");
    }
  };

  const shortlistOnly = async (registrationId) => {
    setErr("");
    setMsg("");
    try {
      await api.patch(`/api/drives/registration/${registrationId}/status`, { status: "SHORTLISTED", note: noteDrafts[registrationId] || "" });
      setMsg("Applicant shortlisted.");
      setShortlistChoiceFor("");
      setScheduleFor("");
      setForm(defaultSchedule);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Shortlist failed");
    }
  };

  const openSchedule = (registrationId) => {
    setShortlistChoiceFor("");
    setScheduleFor(registrationId);
  };

  const saveInterview = async (registrationId) => {
    if (!form.dateTime) {
      setErr("Interview date & time required");
      return;
    }
    setErr("");
    setMsg("");
    try {
      await api.patch(`/api/drives/registration/${registrationId}/status`, { status: "SHORTLISTED" });
      const existing = interviewMap.get(String(registrationId));
      await api.post(`/api/interviews/drive-registration/${registrationId}`, form);
      setMsg(existing?._id ? "Shortlist and interview updated." : "Applicant shortlisted and interview scheduled.");
      setShortlistChoiceFor("");
      setScheduleFor("");
      setForm(defaultSchedule);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Interview scheduling failed");
    }
  };

  const toggleSelected = (registrationId) => {
    setSelectedIds((current) => (
      current.includes(registrationId)
        ? current.filter((id) => id !== registrationId)
        : [...current, registrationId]
    ));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredItems.some((item) => item._id === id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...filteredItems.map((item) => item._id)])));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const saveNote = async (registrationId) => {
    const registration = items.find((item) => item._id === registrationId);
    if (!registration) return;
    await updateStatus(registrationId, registration.status || "REGISTERED", noteDrafts[registrationId] || "");
    setMsg("Remarks saved.");
    setNoteFor("");
  };

  const bulkUpdateStatus = async () => {
    if (!selectedIds.length) return;
    const ok = window.confirm(`Change status to ${bulkStatus} for ${selectedIds.length} selected registrations?`);
    if (!ok) return;
    setErr("");
    setMsg("");
    try {
      await Promise.all(selectedIds.map((registrationId) => api.patch(`/api/drives/registration/${registrationId}/status`, { status: bulkStatus, note: noteDrafts[registrationId] || "" })));
      setMsg(`Status changed to ${bulkStatus} for selected registrations.`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Bulk status update failed");
    }
  };

  const download = async () => {
    setErr("");
    setMsg("");
    try {
      const res = await api.get(`/api/drives/${driveId}/report`, { params: { placementYear }, responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drive_registrations_${placementYear}.csv`;
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
        <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2>Drive Registrations</h2>
            <small className="muted">Search students and filter registered students by branch and session.</small>
          </div>
          <div className="row">
            <button className="btn" onClick={download}>Download CSV</button>
            <BackButton fallback="/drives" />
          </div>
        </div>

        <div className="tpo-filter-bar drive-filter-bar">
          <div className="tpo-filter-field">
            <label>Session</label>
            <select className="input placement-year-select" value={placementYear} onChange={(e) => setPlacementYear(e.target.value)}>
              {placementYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <div className="tpo-filter-field">
            <label>Search Student / Roll No</label>
            <input className="input" placeholder="Type student name or roll no" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="tpo-filter-field">
            <label>Branch</label>
            <select className="input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="">All Branches</option>
              {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{course}</option>)}
            </select>
          </div>
          <div className="tpo-filter-summary drive-filter-summary">
            <strong>{filteredItems.length}</strong>
            <span>registrations found</span>
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn secondary" onClick={toggleSelectAllVisible}>
            {allVisibleSelected ? "Unselect All" : "Select All"}
          </button>
          <button type="button" className="btn secondary" onClick={clearSelection} disabled={!selectedIds.length}>Clear Selection</button>
          <select className="input" style={{ width: 190 }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="button" className="btn" onClick={bulkUpdateStatus} disabled={!selectedIds.length}>Apply Bulk Status</button>
        </div>

        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr><th className="compact-checkbox-cell"></th><th>Student</th><th>Email</th><th>Dept</th><th>Approved</th><th className="hiring-status-cell">Current Status</th><th className="note-action-cell">Remarks</th></tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const interview = interviewMap.get(String(item._id));
              const student = getStudentView(item);
              return (
                <React.Fragment key={item._id}>
                  <tr>
                    <td className="compact-checkbox-cell"><input className="compact-checkbox" type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleSelected(item._id)} /></td>
                    <td><strong>{student?.name}</strong><br /><small className="muted">{student?.rollNo || "-"}</small></td>
                    <td>{student?.email}</td>
                    <td>{student?.department || "-"}</td>
                    <td><span className="badge compact-status-badge">{student?.isApproved ? "YES" : "NO"}</span></td>
                    <td className="hiring-status-cell">
                      <select className="input" value={item.status || "REGISTERED"} onChange={(e) => updateStatus(item._id, e.target.value)}>
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      {interview ? <small className="muted" style={{ display: "block", marginTop: 6 }}>{interview.round} | {new Date(interview.dateTime).toLocaleString()}</small> : null}
                    </td>
                    <td className="note-action-cell">
                      <button type="button" className="btn secondary compact-note-btn" onClick={() => setNoteFor(item._id)}>
                        Remarks
                      </button>
                    </td>
                  </tr>

                  {shortlistChoiceFor === item._id ? (
                    <tr>
                      <td colSpan="7">
                        <div className="card" style={{ margin: 0, background: "#fafcff" }}>
                          <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <strong>Shortlist Applicant</strong>
                            <button className="btn secondary" onClick={() => { setShortlistChoiceFor(""); setScheduleFor(""); setForm(defaultSchedule); }}>Cancel</button>
                          </div>
                          <p className="muted" style={{ marginTop: 10 }}>You can shortlist only, or shortlist and schedule an interview right now.</p>
                          <div className="row" style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                            <button className="btn secondary" onClick={() => shortlistOnly(item._id)}>Shortlist Only</button>
                            <button className="btn" onClick={() => openSchedule(item._id)}>Shortlist + Schedule Interview</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}

                  {scheduleFor === item._id ? (
                    <tr>
                      <td colSpan="7">
                        <div className="card" style={{ margin: 0, background: "#fafcff" }}>
                          <div className="row" style={{ justifyContent: "space-between" }}>
                            <strong>Schedule Interview</strong>
                            <button className="btn secondary" onClick={() => { setShortlistChoiceFor(""); setScheduleFor(""); setForm(defaultSchedule); }}>Cancel</button>
                          </div>
                          <div className="grid grid-2" style={{ marginTop: 10 }}>
                            <div>
                              <label>Round</label>
                              <input className="input" value={form.round} onChange={(e) => setForm((s) => ({ ...s, round: e.target.value }))} />
                            </div>
                            <div>
                              <label>Date & Time *</label>
                              <input className="input" type="datetime-local" value={form.dateTime} onChange={(e) => setForm((s) => ({ ...s, dateTime: e.target.value }))} />
                            </div>
                            <div>
                              <label>Mode</label>
                              <select className="input" value={form.mode} onChange={(e) => setForm((s) => ({ ...s, mode: e.target.value }))}>
                                <option value="OFFLINE">OFFLINE</option>
                                <option value="ONLINE">ONLINE</option>
                              </select>
                            </div>
                            <div>
                              <label>Location / Link</label>
                              <input className="input" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
                            </div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <label>Remarks</label>
                            <textarea className="input" rows="3" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
                          </div>
                          <div className="row" style={{ marginTop: 10 }}>
                            <button className="btn" onClick={() => saveInterview(item._id)}>Save Shortlist + Interview</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
            {filteredItems.length === 0 ? <tr><td colSpan="7"><small className="muted">No registrations found for the selected filters.</small></td></tr> : null}
          </tbody>
        </table>
      </div>

      {noteFor ? (
        <div className="modal-backdrop" onClick={() => setNoteFor("")}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>Registration Remarks</h3>
                <small className="muted">These remarks will be visible to the student in My Applications.</small>
              </div>
              <button className="btn secondary" type="button" onClick={() => setNoteFor("")}>Close</button>
            </div>
            <div style={{ marginTop: 14 }}>
              <label>Remarks</label>
              <textarea
                className="input"
                rows="5"
                placeholder="Write remarks for student"
                value={noteDrafts[noteFor] || ""}
                onChange={(e) => setNoteDrafts((current) => ({ ...current, [noteFor]: e.target.value }))}
              />
            </div>
            <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
              <button className="btn secondary" type="button" onClick={() => setNoteFor("")}>Cancel</button>
              <button className="btn" type="button" onClick={() => saveNote(noteFor)}>Save Remarks</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
