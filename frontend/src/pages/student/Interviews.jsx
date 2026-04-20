import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";
import { latestTimestamp, markModuleSeen, MODULE_KEYS } from "../../lib/notifications";

export default function StudentInterviews() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/interviews/my")
      .then(r => { setItems(r.data); markModuleSeen(MODULE_KEYS.interviews, latestTimestamp(r.data || [])); })
      .catch(e => setErr(e?.response?.data?.message || "Failed to load interviews"));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent:"space-between" }}>
          <h2>My Interviews</h2>
          <BackButton fallback="/student/dashboard" />
        </div>

        {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr><th>Opportunity</th><th>Company</th><th>Round</th><th>Date & Time</th><th>Mode</th><th>Location</th></tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x._id}>
                <td>{x.application?.job?.title || x.driveRegistration?.drive?.title || "-"}</td>
                <td>{x.application?.job?.company || x.driveRegistration?.drive?.company || "-"}</td>
                <td><span className="badge">{x.round}</span></td>
                <td>{new Date(x.dateTime).toLocaleString()}</td>
                <td>{x.mode}</td>
                <td>{x.location || "-"}</td>
              </tr>
            ))}
            {items.length === 0 ? <tr><td colSpan="6"><small className="muted">No interviews scheduled.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
