// Shows the drives registered by the logged-in student.
import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";

// Render the student drive-history page and load registered drives.
export default function MyDrives() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/drives/my/registrations")
      .then(r => setItems(r.data))
      .catch(e => setErr(e?.response?.data?.message || "Failed to load"));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent:"space-between" }}>
          <h2>My Drive Registrations</h2>
          <BackButton fallback="/drives" />
        </div>

        {err ? <p style={{ color:"#b00020" }}>{err}</p> : null}

        <table className="table">
          <thead>
            <tr><th>Drive</th><th>Company</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x._id}>
                <td><strong>{x.drive?.title}</strong></td>
                <td>{x.drive?.company}</td>
                <td>{x.drive?.dateTime ? new Date(x.drive.dateTime).toLocaleString() : "-"}</td>
                <td><span className="badge">{x.status}</span></td>
              </tr>
            ))}
            {items.length === 0 ? <tr><td colSpan="4"><small className="muted">No registrations.</small></td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
