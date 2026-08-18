const STORAGE_PREFIX = 'atc_app_';

export function loadCollection(name) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCollection(name, records) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(records));
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
