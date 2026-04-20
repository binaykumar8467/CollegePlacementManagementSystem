const KEY = "cpms_auth";

export function saveAuth({ token, role, user }) {
  localStorage.setItem(KEY, JSON.stringify({ token, role, user }));
}

export function getAuth() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function getToken() {
  const a = getAuth();
  return a?.token || null;
}

export function getRole() {
  const a = getAuth();
  return a?.role || null;
}

export function getUser() {
  const a = getAuth();
  return a?.user || null;
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
