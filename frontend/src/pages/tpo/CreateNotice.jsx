// Provides the form for creating and editing placement notices.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";
import { getCurrentPlacementYear, getPlacementYearOptions } from "../../lib/studentOptions";

// Render the notice form and handle notice creation or editing.
export default function CreateNotice() {
  const nav = useNavigate();
  const { noticeId } = useParams();
  const isEdit = Boolean(noticeId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const placementYears = useMemo(() => getPlacementYearOptions(), []);
  const [placementYear, setPlacementYear] = useState(getCurrentPlacementYear());

  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    api.get("/api/notices")
      .then((r) => {
        if (!mounted) return;
        const found = (r.data || []).find((item) => item._id === noticeId);
        if (!found) {
          setErr("Notice not found");
          return;
        }
        setTitle(found.title || "");
        setContent(found.content || "");
        setPlacementYear(found.placementYear || getCurrentPlacementYear());
        setExistingAttachment(found.attachment || null);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(e?.response?.data?.message || "Failed to load notice");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [isEdit, noticeId]);

  const attachmentInfo = useMemo(() => {
    if (attachment) return `${attachment.name} (${Math.max(1, Math.round(attachment.size / 1024))} KB)`;
    if (existingAttachment && !removeAttachment) return existingAttachment.originalName || existingAttachment.fileName;
    return "";
  }, [attachment, existingAttachment, removeAttachment]);

// Handle the submit logic used in this file.
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("placementYear", placementYear);
      if (attachment) formData.append("attachment", attachment);
      if (removeAttachment) formData.append("removeAttachment", "true");

      if (isEdit) {
        await api.put(`/api/notices/${noticeId}`, formData);
      } else {
        await api.post("/api/notices", formData);
      }
      nav("/notices");
    } catch (e2) {
      setErr(e2?.response?.data?.message || (isEdit ? "Update notice failed" : "Create notice failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>{isEdit ? "Edit Notice" : "Create Notice"}</h2>
          <BackButton fallback="/notices" />
        </div>

        {loading ? <p className="muted">Loading notice...</p> : (
          <form onSubmit={submit} className="grid" style={{ marginTop: 10 }}>
            <div>
              <label>Title *</label>
              <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
            </div>
            <div>
              <label>Session *</label>
              <select className="input placement-year-select" value={placementYear} onChange={(e) => setPlacementYear(e.target.value)}>
                {placementYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label>Content *</label>
              <textarea className="input" rows="8" value={content} onChange={e=>setContent(e.target.value)} />
            </div>
            <div>
              <label>Attachment (Optional: PDF, DOC, DOCX)</label>
              <input
                className="input"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAttachment(file);
                  if (file) setRemoveAttachment(false);
                }}
              />
              {attachmentInfo ? <small className="muted">Selected: {attachmentInfo}</small> : <small className="muted">No attachment selected.</small>}
              {existingAttachment && !attachment ? (
                <div className="row" style={{ marginTop: 8 }}>
                  <a
                    href={`${api.defaults.baseURL}${existingAttachment.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="notice-link"
                  >
                    Open current attachment
                  </a>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={removeAttachment}
                      onChange={(e) => setRemoveAttachment(e.target.checked)}
                    />
                    Remove current attachment
                  </label>
                </div>
              ) : null}
            </div>

            {err ? <p style={{ color:"#b00020", margin:0 }}>{err}</p> : null}
            <button className="btn" type="submit" disabled={saving}>
              {saving ? (isEdit ? "Updating..." : "Publishing...") : (isEdit ? "Update Notice" : "Publish Notice")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
