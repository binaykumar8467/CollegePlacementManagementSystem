export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4518";

export function absoluteBackendUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}
