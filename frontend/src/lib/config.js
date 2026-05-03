// Holds shared frontend configuration values such as API base settings.
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4518";

// Build an absolute backend URL for uploaded files and API resources.
export function absoluteBackendUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}
