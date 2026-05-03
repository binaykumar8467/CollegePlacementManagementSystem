// Provides the form for creating and editing campus placement drives.
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";
import { COURSE_OPTIONS } from "../../lib/studentOptions";

// Convert stored date values into the browser datetime-local input format.
function toInputDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
// Handle the pad logic used in this file.
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Render the drive form and handle drive creation or editing.
export default function CreateDrive() {
  const nav = useNavigate();
  const { driveId } = useParams();
  const isEdit = Boolean(driveId);
  const [form, setForm] = useState({ title:"", company:"", dateTime:"", venue:"", description:"", eligibleDepartments:[], minCgpa:"", minPercentage:"" });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api.get('/api/drives').then((r) => {
      const drive = (r.data || []).find((x) => x._id === driveId);
      if (!drive) return setErr('Drive not found');
      setForm({
        title: drive.title || '', company: drive.company || '', dateTime: toInputDateTime(drive.dateTime), venue: drive.venue || '', description: drive.description || '',
        eligibleDepartments: drive.eligibleDepartments || [], minCgpa: drive.minCgpa ?? '', minPercentage: drive.minPercentage ?? ''
      });
    }).catch((e) => setErr(e?.response?.data?.message || 'Failed to load drive'));
  }, [driveId, isEdit]);

// Handle the on change logic used in this file.
  const onChange=(k,v)=>setForm(s=>({...s,[k]:v}));
// Handle the on course change logic used in this file.
  const onCourseChange = (e) => onChange("eligibleDepartments", Array.from(e.target.selectedOptions).map(option => option.value).filter(Boolean));

// Handle the submit logic used in this file.
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      const payload = { ...form, minCgpa: Number(form.minCgpa || 0), minPercentage: Number(form.minPercentage || 0) };
      if (isEdit) await api.put(`/api/drives/${driveId}`, payload); else await api.post("/api/drives", payload);
      nav("/drives");
    } catch (e2) { setErr(e2?.response?.data?.message || `${isEdit ? 'Update' : 'Create'} drive failed`); }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="row" style={{ justifyContent:"space-between" }}><h2>{isEdit ? 'Edit Drive' : 'Create Drive'}</h2><BackButton fallback="/drives" /></div>
        <form className="grid" onSubmit={submit} style={{ marginTop: 10 }}>
          <div className="grid grid-2"><div><label>Title *</label><input className="input" value={form.title} onChange={e=>onChange("title", e.target.value)} /></div><div><label>Company *</label><input className="input" value={form.company} onChange={e=>onChange("company", e.target.value)} /></div></div>
          <div><label>Date & Time *</label><input className="input" type="datetime-local" value={form.dateTime} onChange={e=>onChange("dateTime", e.target.value)} /></div>
          <div><label>Venue</label><input className="input" value={form.venue} onChange={e=>onChange("venue", e.target.value)} /></div>
          <div><label>Description</label><textarea className="input" rows="4" value={form.description} onChange={e=>onChange("description", e.target.value)} /></div>
          <div><label>Eligible Courses</label><select className="input" multiple value={form.eligibleDepartments} onChange={onCourseChange} style={{ minHeight: 180 }}>{COURSE_OPTIONS.map(course => <option key={course} value={course}>{course}</option>)}</select><small className="muted">Ctrl/Command to select multiple courses</small></div>
          <div className="grid grid-2"><div><label>Minimum CGPA</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.minCgpa} onChange={e=>onChange("minCgpa", e.target.value)} placeholder="Leave blank if not needed" /></div><div><label>Minimum Percentage</label><input className="input" type="number" step="0.01" min="0" max="100" value={form.minPercentage} onChange={e=>onChange("minPercentage", e.target.value)} placeholder="Leave blank if not needed" /></div></div>
          {err ? <p style={{ color:"#b00020", margin:0 }}>{err}</p> : null}
          <button className="btn" type="submit">{isEdit ? 'Update Drive' : 'Create Drive'}</button>
        </form>
      </div>
    </div>
  );
}
