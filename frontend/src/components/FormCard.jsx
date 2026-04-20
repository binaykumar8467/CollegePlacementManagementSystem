import React from "react";

export default function FormCard({ title, subtitle, children }) {
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2>{title}</h2>
        {subtitle ? <small className="muted">{subtitle}</small> : null}
        <div style={{ height: 10 }} />
        {children}
      </div>
    </div>
  );
}
