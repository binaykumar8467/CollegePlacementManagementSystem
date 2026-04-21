import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { getAuth, saveAuth } from "../../lib/auth";
import BackButton from "../../components/BackButton";
import { COURSE_OPTIONS, STUDY_YEAR_OPTIONS, formatPlacementYear } from "../../lib/studentOptions";

function normalizeSemesterValues(values) {
  if (!Array.isArray(values)) return [];
  return values
    .slice(0, 8)
    .map((x) => (typeof x === "string" ? x.trim() : x))
    .filter((x) => x !== "" && x !== null && typeof x !== "undefined")
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0);
}

function averagePercentage(values) {
  const cleaned = normalizeSemesterValues(values);
  if (!cleaned.length) return "";
  const total = cleaned.reduce((sum, value) => sum + value, 0);
  return (total / cleaned.length).toFixed(2);
}

export default function StudentProfile() {
  const [refreshKey, setRefreshKey] = useState(0);
  const auth = getAuth();
  const user = auth?.user;
  const [resumeViewing, setResumeViewing] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const [form, setForm] = useState({
    rollNo: user?.rollNo || "", department: user?.department || "", year: user?.year || "", placementYear: formatPlacementYear(user?.placementYear) || "",
    phone: user?.phone || "", skills: (user?.skills || []).join(", "), resumeLink: user?.resumeLink || "", gradingSystem: user?.gradingSystem || "",
    class10Percentage: user?.class10Percentage ?? "", class12Percentage: user?.class12Percentage ?? "",
    cgpa: user?.cgpa ?? "", semesterPercentages: Array.from({ length: 8 }, (_, i) => { const value = user?.semesterPercentages?.[i]; return Number(value) > 0 ? value : ""; })
  });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange=(k,v)=>setForm(s=>({...s,[k]:v}));
  const computedPercentage = averagePercentage(form.semesterPercentages);

  useEffect(() => {
    let objectUrl = "";
    const loadPhoto = async () => {
      if (!user?._id || !user?.profilePhotoFile) {
        setPhotoPreviewUrl("");
        return;
      }
      try {
        const response = await api.get(`/api/students/${user._id}/photo`, { responseType: "blob" });
        objectUrl = window.URL.createObjectURL(response.data);
        setPhotoPreviewUrl(objectUrl);
      } catch {
        setPhotoPreviewUrl("");
      }
    };
    loadPhoto();
    return () => {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [user?._id, user?.profilePhotoFile, refreshKey]);

  const openResume = async () => {
    if (!user?._id || !user?.resumeFile) return;
    setErr("");
    try {
      setResumeViewing(true);
      const response = await api.get(`/api/students/${user._id}/resume`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (e2) { setErr(e2?.response?.data?.message || "Resume open failed"); }
    finally { setResumeViewing(false); }
  };

  const openPhoto = () => {
    if (!photoPreviewUrl) return;
    window.open(photoPreviewUrl, "_blank", "noopener,noreferrer");
  };

  const save = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      const payload = {
        rollNo: form.rollNo, department: form.department, year: form.year, phone: form.phone,
        skills: form.skills ? form.skills.split(",").map(x=>x.trim()).filter(Boolean) : [], resumeLink: form.resumeLink,
        gradingSystem: form.gradingSystem, class10Percentage: form.class10Percentage === "" ? null : Number(form.class10Percentage), class12Percentage: form.class12Percentage === "" ? null : Number(form.class12Percentage),
        cgpa: form.gradingSystem === "cgpa" ? form.cgpa : undefined,
        semesterPercentages: form.gradingSystem === "percentage"
          ? normalizeSemesterValues(form.semesterPercentages)
          : []
      };
      const res = await api.patch("/api/students/me/profile", payload);
      saveAuth({ token: auth.token, role: auth.role, user: res.data }); setMsg("Saved!"); setRefreshKey((k) => k + 1);
    } catch (e2) { setErr(e2?.response?.data?.message || "Save failed"); }
  };

  const uploadFile = async (kind, file) => {
    if (!file) return;
    setErr(''); setMsg('');
    try {
      const fd = new FormData();
      fd.append(kind === 'resume' ? 'resume' : 'photo', file);
      const res = await api.post(kind === 'resume' ? '/api/students/me/resume' : '/api/students/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      saveAuth({ token: auth.token, role: auth.role, user: res.data });
      setMsg(kind === 'resume' ? 'Resume uploaded!' : 'Photo uploaded!');
      setRefreshKey((k) => k + 1);
    } catch (e2) { setErr(e2?.response?.data?.message || `${kind} upload failed`); }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="row" style={{ justifyContent:"space-between" }}><h2>My Profile</h2><BackButton fallback="/student/dashboard" /></div>

        <form className="grid" onSubmit={save} style={{ marginTop: 10 }}>
          <div className="grid grid-2">
            <div><label>Roll No</label><input className="input" type="tel" inputMode="numeric" pattern="[0-9]*" value={form.rollNo} onChange={e=>onChange("rollNo", e.target.value.replace(/\D/g, ""))} /></div>
            <div><label>Phone</label><input className="input" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength="10" value={form.phone} onChange={e=>onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
          </div>

          <div className="grid grid-2">
            <div><label>Course</label><select className="input" value={form.department} onChange={e=>onChange("department", e.target.value)}><option value="">Select Course</option>{COURSE_OPTIONS.map(course => <option key={course} value={course}>{course}</option>)}</select></div>
            <div><label>Study Year</label><select className="input" value={form.year} onChange={e=>onChange("year", e.target.value)}><option value="">Select Year</option>{STUDY_YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}</option>)}</select></div>
          </div>

          <div>
            <label>Session</label>
            <input className="input" value={form.placementYear || "-"} readOnly />
          </div>

          <div className="grid grid-2">
            <div><label>Class 10 %</label><input className="input" type="number" min="0" max="100" step="0.01" value={form.class10Percentage} onChange={e=>onChange("class10Percentage", e.target.value)} placeholder="0 - 100" /></div>
            <div><label>Class 12 %</label><input className="input" type="number" min="0" max="100" step="0.01" value={form.class12Percentage} onChange={e=>onChange("class12Percentage", e.target.value)} placeholder="0 - 100" /></div>
          </div>

          <div>
            <label>Marks Type</label>
            <div className="row" style={{ gap: 18, flexWrap: "wrap", marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" name="gradingSystem" checked={form.gradingSystem === "cgpa"} onChange={() => onChange("gradingSystem", "cgpa")} /> CGPA</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" name="gradingSystem" checked={form.gradingSystem === "percentage"} onChange={() => onChange("gradingSystem", "percentage")} /> Percentage</label>
            </div>
          </div>

          {form.gradingSystem === "cgpa" ? <div><label>Overall CGPA</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={e=>onChange("cgpa", e.target.value)} placeholder="0 - 10" /></div> : null}
          {form.gradingSystem === "percentage" ? <div><label>Semester-wise Percentage (up to 8 semesters)</label><div className="grid grid-2" style={{ marginTop: 6 }}>{Array.from({ length: 8 }).map((_, i) => <div key={i}><label style={{ fontSize: 12 }}>Semester {i + 1} %</label><input className="input" type="number" min="0" max="100" placeholder="0 - 100" value={form.semesterPercentages?.[i] ?? ""} onChange={(e) => { const v = e.target.value; setForm((s) => { const arr = Array.isArray(s.semesterPercentages) ? [...s.semesterPercentages] : Array(8).fill(""); arr[i] = v; return { ...s, semesterPercentages: arr }; }); }} /></div>)}</div><small className="muted"> Enter percentage for completed semesters only.</small><div className="kpi" style={{ marginTop: 10 }}><strong>Calculated Overall Percentage</strong><div>{computedPercentage ? `${computedPercentage}%` : "-"}</div></div></div> : null}

          <div><label>Skills (comma separated)</label><input className="input" value={form.skills} onChange={e=>onChange("skills", e.target.value)} /></div>
          <div><label>Resume Link (optional)</label><input className="input" value={form.resumeLink} onChange={e=>onChange("resumeLink", e.target.value)} /></div>

          <div className="grid grid-2">
            <div>
              <label>Upload Resume (PDF only, max 5MB)</label>
              <input key={`resume-${refreshKey}`} className="input" type="file" accept="application/pdf,.pdf" onChange={(e) => uploadFile('resume', e.target.files?.[0])} />
              {user?.resumeFile ? <small className="muted">Uploaded: <button type="button" className="btn secondary" onClick={openResume} disabled={resumeViewing} style={{ marginLeft: 8 }}>{resumeViewing ? "Opening..." : "View PDF"}</button></small> : null}
            </div>
            <div>
              <label>Upload Profile Photo (JPG/PNG/WEBP, max 3MB)</label>
              <input key={`photo-${refreshKey}`} className="input" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(e) => uploadFile('photo', e.target.files?.[0])} />
              {photoPreviewUrl ? <div style={{ marginTop: 10 }}><img src={photoPreviewUrl} alt="Profile" className="profile-photo-preview" /><div style={{ marginTop: 8 }}><button type="button" className="btn secondary" onClick={openPhoto}>View Photo</button></div></div> : <small className="muted">No photo uploaded yet.</small>}
            </div>
          </div>

          {msg ? <p>{msg}</p> : null}
          {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}
          <button className="btn" type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}
