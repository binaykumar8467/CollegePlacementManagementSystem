import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { COURSE_OPTIONS, formatPlacementYear, getCurrentPlacementYear, getPlacementYearOptions } from "../../lib/studentOptions";
import BackButton from "../../components/BackButton";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const [placementYear, setPlacementYear] = useState(getCurrentPlacementYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const load = () => {
    setErr("");
    setMsg("");
    api.get("/api/students", { params: { placementYear } })
      .then((r) => {
        setStudents(r.data || []);
        setSelectedIds([]);
      })
      .catch((e) => setErr(e?.response?.data?.message || "Failed to load students"));
  };

  useEffect(() => { load(); }, [placementYear]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesName = !query || String(student?.name || "").toLowerCase().includes(query);
      const matchesBranch = !branchFilter || String(student?.department || "") === branchFilter;
      return matchesName && matchesBranch;
    });
  }, [students, searchTerm, branchFilter]);

  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every((student) => selectedIds.includes(student._id));

  const toggle = async (studentId, current) => {
    setErr("");
    setMsg("");
    try {
      await api.patch(`/api/students/${studentId}/approval`, { isApproved: !current });
      setMsg("Updated!");
      load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Update failed");
    }
  };

  const viewResume = async (studentId) => {
    setErr("");
    try {
      const response = await api.get(`/api/students/${studentId}/resume`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      setErr(e?.response?.data?.message || "Resume open failed");
    }
  };

  const openPhoto = async (studentId) => {
    setErr("");
    try {
      const response = await api.get(`/api/students/${studentId}/photo`, { responseType: "blob" });
      const contentType = response.headers?.["content-type"] || "image/jpeg";
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      setErr(e?.response?.data?.message || "Photo open failed");
    }
  };

  const downloadPhoto = async (studentId, name) => {
    try {
      const res = await api.get(`/api/students/${studentId}/photo`, { responseType: "blob" });
      const contentType = res.headers?.["content-type"] || "image/jpeg";
      const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(name || "student").replace(/\s+/g, "_")}_photo.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.response?.data?.message || "Photo download failed");
    }
  };

  const removeStudent = async (studentId, studentName) => {
    const ok = window.confirm(`Remove ${studentName} from the student list?`);
    if (!ok) return;
    setErr("");
    setMsg("");
    try {
      await api.delete(`/api/students/${studentId}`);
      setMsg("Student removed successfully!");
      load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Remove failed");
    }
  };

  const toggleSelected = (studentId) => {
    setSelectedIds((current) => (
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    ));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredStudents.some((student) => student._id === id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...filteredStudents.map((student) => student._id)])));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    const ok = window.confirm(`Remove ${selectedIds.length} selected students from the list?`);
    if (!ok) return;
    setErr("");
    setMsg("");
    try {
      await Promise.all(selectedIds.map((studentId) => api.delete(`/api/students/${studentId}`)));
      setMsg("Selected students removed successfully!");
      load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Bulk remove failed");
    }
  };

  const downloadCSV = async () => {
    setErr("");
    setMsg("");
    try {
      const res = await api.get("/api/students/report/download", { params: { placementYear }, responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_${placementYear}.csv`;
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
        <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <h2>Students Approval</h2>
            <small className="muted">Search students, filter by branch, and manage records by session.</small>
          </div>
          <div className="row" style={{ gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label>Session</label>
            <select className="input placement-year-select" value={placementYear} onChange={(e) => setPlacementYear(e.target.value)}>
                {placementYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button className="btn" onClick={downloadCSV}>Download CSV</button>
            <BackButton fallback="/tpo/dashboard" />
          </div>
        </div>

        <div className="tpo-filter-bar">
          <div className="tpo-filter-field">
            <label>Search Student</label>
            <input className="input" placeholder="Type student name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="tpo-filter-field">
            <label>Branch</label>
            <select className="input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="">All Branches</option>
              {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{course}</option>)}
            </select>
          </div>
          <div className="tpo-filter-summary">
            <strong>{filteredStudents.length}</strong>
            <span>students found</span>
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn secondary" onClick={toggleSelectAllVisible}>
            {allVisibleSelected ? "Unselect All" : "Select All"}
          </button>
          <button type="button" className="btn secondary" onClick={clearSelection} disabled={!selectedIds.length}>Clear Selection</button>
          <button type="button" className="btn danger" onClick={deleteSelected} disabled={!selectedIds.length}>Delete Selected</button>
        </div>

        {msg ? <p>{msg}</p> : null}
        {err ? <p style={{ color: "#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Study Year</th>
              <th>Session</th>
              <th>Approved</th>
              <th>Resume</th>
              <th>Photo</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td><input type="checkbox" checked={selectedIds.includes(student._id)} onChange={() => toggleSelected(student._id)} /></td>
                <td><strong>{student.name}</strong><br /><small className="muted">{student.rollNo || "-"}</small></td>
                <td>{student.email}</td>
                <td>{student.department || "-"}</td>
                <td>{student.year || "-"}</td>
                <td>{formatPlacementYear(student.placementYear) || "-"}</td>
                <td><span className="badge">{student.isApproved ? "YES" : "NO"}</span></td>
                <td>{student.resumeFile ? <button className="btn secondary" onClick={() => viewResume(student._id)}>View PDF</button> : <small className="muted">-</small>}</td>
                <td>{student.profilePhotoFile ? <div className="row" style={{ gap: 8, alignItems: "center" }}><button className="btn secondary" onClick={() => openPhoto(student._id)}>View</button><button type="button" className="icon-btn" title="Download photo" aria-label="Download photo" onClick={() => downloadPhoto(student._id, student.name)}>⬇</button></div> : <small className="muted">-</small>}</td>
                <td><div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className={`btn ${student.isApproved ? "danger" : ""}`} onClick={() => toggle(student._id, student.isApproved)}>{student.isApproved ? "Disapprove" : "Approve"}</button><button className="btn secondary" onClick={() => removeStudent(student._id, student.name)}>Remove</button></div></td>
              </tr>
            ))}
            {filteredStudents.length === 0 ? <tr><td colSpan="10"><small className="muted">No students found for the selected filters.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
