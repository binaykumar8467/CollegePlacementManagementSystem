import React, { useState } from "react";
import api from "../../lib/api";

export default function ScheduleInterview({ applicationId, onDone }) {
  const [form, setForm] = useState({ round: "Round 1", dateTime: "", mode: "OFFLINE", location: "", note: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange=(k,v)=>setForm(s=>({...s,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await api.post(`/api/interviews/application/${applicationId}`, form);
      setMsg("Scheduled!");
      onDone?.();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="card" style={{ boxShadow:"none", border:"1px solid #eee" }}>
      <strong>Schedule Interview</strong>
      <form className="grid" onSubmit={submit} style={{ marginTop: 8 }}>
        <div className="grid grid-2">
          <div><label>Round</label><input className="input" value={form.round} onChange={e=>onChange("round", e.target.value)} /></div>
          <div><label>Date & Time *</label><input className="input" type="datetime-local" value={form.dateTime} onChange={e=>onChange("dateTime", e.target.value)} /></div>
        </div>

        <div className="grid grid-2">
          <div>
            <label>Mode</label>
            <select className="input" value={form.mode} onChange={e=>onChange("mode", e.target.value)}>
              <option value="OFFLINE">OFFLINE</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>
          <div><label>Location/Link</label><input className="input" value={form.location} onChange={e=>onChange("location", e.target.value)} /></div>
        </div>

        <div><label>Remarks</label><input className="input" value={form.note} onChange={e=>onChange("note", e.target.value)} /></div>

        {msg ? <small className="muted">{msg}</small> : null}
        {err ? <small style={{ color:"#b00020" }}>{err}</small> : null}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  );
}
