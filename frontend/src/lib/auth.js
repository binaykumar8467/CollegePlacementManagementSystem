// Stores, reads, and clears authentication data in browser storage.
const KEY = "cpms_auth";

// Save the current login session in browser storage.
export function saveAuth({ token, role, user }) {
  localStorage.setItem(KEY, JSON.stringify({ token, role, user }));
}

// Read the saved login session from browser storage.
export function getAuth() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

// Return only the saved JWT token for API requests.
export function getToken() {
  const a = getAuth();
  return a?.token || null;
}

// Return only the saved user role from browser storage.
export function getRole() {
  const a = getAuth();
  return a?.role || null;
}

// Return only the saved user object from browser storage.
export function getUser() {
  const a = getAuth();
  return a?.user || null;
}

// Remove the saved login session during logout.
export function clearAuth() {
  localStorage.removeItem(KEY);
}
