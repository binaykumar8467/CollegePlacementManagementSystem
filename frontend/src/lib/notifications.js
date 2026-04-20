const PREFIX = 'cpms_seen_';

export const MODULE_KEYS = {
  jobs: 'jobs',
  drives: 'drives',
  notices: 'notices',
  placements: 'placements',
  interviews: 'interviews'
};

export function getSeenAt(moduleKey) {
  return Number(localStorage.getItem(PREFIX + moduleKey) || 0);
}

export function markModuleSeen(moduleKey, latestAt) {
  const value = latestAt ? new Date(latestAt).getTime() : Date.now();
  localStorage.setItem(PREFIX + moduleKey, String(value));
  window.dispatchEvent(new CustomEvent('cpms-notifications-updated'));
}

export function hasUnseen(moduleKey, latestAt) {
  if (!latestAt) return false;
  return new Date(latestAt).getTime() > getSeenAt(moduleKey);
}

export function latestTimestamp(items = []) {
  let latest = 0;
  for (const item of items) {
    const ts = new Date(item?.updatedAt || item?.createdAt || 0).getTime();
    if (Number.isFinite(ts) && ts > latest) latest = ts;
  }
  return latest || 0;
}
