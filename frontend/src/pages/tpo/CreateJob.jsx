// Provides the form for creating and editing job postings.
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";
import { COURSE_OPTIONS } from "../../lib/studentOptions";

// Convert stored date values into the browser datetime-local input format.
function toInputDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
// Handle the pad logic used in this file.
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Parse job eligibility values so old text-based jobs can still be edited safely.
function parseEligibilityCourses(rawEligibility) {
  if (Array.isArray(rawEligibility)) {
    return rawEligibility
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(rawEligibility || "")
    .split(/[,/\n|]+/)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

// Render the job form and handle job creation or editing.
export default function CreateJob() {
  const nav = useNavigate();
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);
  const [form, setForm] = useState({
    title: "", company: "", location: "", salary: "",
    description: "", eligibilityCourses: [], deadline: ""
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/api/jobs/${jobId}`)
      .then((r) => {
        const job = r.data;
        setForm({
          title: job.title || "",
          company: job.company || "",
          location: job.location || "",
          salary: job.salary || "",
          description: job.description || "",
          eligibilityCourses: parseEligibilityCourses(
            Array.isArray(job.eligibilityCourses) && job.eligibilityCourses.length
              ? job.eligibilityCourses
              : job.eligibility
          ),
          deadline: toInputDateTime(job.deadline)
        });
      })
      .catch((e) => setErr(e?.response?.data?.message || "Failed to load job"));
  }, [isEdit, jobId]);

// Handle the on change logic used in this file.
  const onChange = (k,v)=>setForm(s=>({...s,[k]:v}));

// Save selected course values from the multi-select eligibility field.
  const onEligibilityCoursesChange = (e) => {
    const selectedCourses = Array.from(e.target.selectedOptions, (option) => option.value);
    onChange("eligibilityCourses", selectedCourses);
  };

// Handle the submit logic used in this file.
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (isEdit) await api.put(`/api/jobs/${jobId}`, form);
      else await api.post("/api/jobs", form);
      nav("/tpo/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || `${isEdit ? "Update" : "Create"} job failed`);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>{isEdit ? "Edit Job" : "Create Job"}</h2>
          <BackButton fallback="/jobs" />
        </div>
        <form onSubmit={submit} className="grid" style={{ marginTop: 10 }}>
          <div className="grid grid-2">
            <div>
              <label>Title *</label>
              <input className="input" value={form.title} onChange={e=>onChange("title", e.target.value)} />
            </div>
            <div>
              <label>Company *</label>
              <input className="input" value={form.company} onChange={e=>onChange("company", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <label>Location</label>
              <input className="input" value={form.location} onChange={e=>onChange("location", e.target.value)} />
            </div>
            <div>
              <label>Salary</label>
              <input className="input" value={form.salary} onChange={e=>onChange("salary", e.target.value)} />
            </div>
          </div>

          <div>
            <label>Deadline *</label>
            <input className="input" type="datetime-local" value={form.deadline} onChange={e=>onChange("deadline", e.target.value)} />
          </div>

          <div className="grid grid-2">
            <div>
              <label>Description</label>
              <textarea className="input" rows="5" value={form.description} onChange={e=>onChange("description", e.target.value)} />
            </div>
          <div>
              <label>Eligibility Courses</label>
              <select
                className="input"
                multiple
                size="10"
                value={form.eligibilityCourses}
                onChange={onEligibilityCoursesChange}
              >
                {COURSE_OPTIONS.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <small className="muted">
                Hold `Ctrl` or `Cmd` to select multiple eligible courses.
              </small>
            </div>
          </div>

          {err ? <p style={{ color:"#b00020", margin:0 }}>{err}</p> : null}
          <button className="btn" type="submit">{isEdit ? "Update Job" : "Publish Job"}</button>
        </form>
      </div>
    </div>
  );
}
