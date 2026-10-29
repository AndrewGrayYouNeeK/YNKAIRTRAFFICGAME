const STORAGE_PREFIX = "atc_app_";

const memory = new Map();
const listeners = new Map();

function storage() {
  if (typeof localStorage !== "undefined") return localStorage;
  return {
    getItem(key) {
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      memory.set(key, String(value));
    },
    removeItem(key) {
      memory.delete(key);
    },
  };
}

function storageKey(collection) {
  return `${STORAGE_PREFIX}${collection}`;
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadRecords(collection) {
  try {
    const raw = storage().getItem(storageKey(collection));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(collection, records) {
  storage().setItem(storageKey(collection), JSON.stringify(records));
}

function getListeners(collection) {
  if (!listeners.has(collection)) listeners.set(collection, new Set());
  return listeners.get(collection);
}

function emit(collection, event) {
  getListeners(collection).forEach((listener) => listener(event));
}

function parseSortField(sortField) {
  if (!sortField) return { field: "created_date", desc: true };
  const desc = sortField.startsWith("-");
  return { field: desc ? sortField.slice(1) : sortField, desc };
}

function sortRecords(records, sortField) {
  const { field, desc } = parseSortField(sortField);
  return [...records].sort((a, b) => {
    const aVal = a[field] ?? "";
    const bVal = b[field] ?? "";
    if (aVal < bVal) return desc ? 1 : -1;
    if (aVal > bVal) return desc ? -1 : 1;
    return 0;
  });
}

function matchesFilter(record, filters) {
  return Object.entries(filters).every(([key, value]) => record[key] === value);
}

export async function createRecord(collection, data) {
  const records = loadRecords(collection);
  const now = new Date().toISOString();
  const record = {
    id: generateId(),
    created_date: now,
    updated_date: now,
    ...data,
  };
  records.push(record);
  saveRecords(collection, records);
  emit(collection, { type: "create", id: record.id, data: record });
  return record;
}

export async function updateRecord(collection, id, data) {
  const records = loadRecords(collection);
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new Error(`${collection} not found`);
  const updated = {
    ...records[index],
    ...data,
    updated_date: new Date().toISOString(),
  };
  records[index] = updated;
  saveRecords(collection, records);
  emit(collection, { type: "update", id, data: updated });
  return updated;
}

export async function deleteRecord(collection, id) {
  const records = loadRecords(collection);
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new Error(`${collection} not found`);
  const [removed] = records.splice(index, 1);
  saveRecords(collection, records);
  emit(collection, { type: "delete", id, data: removed });
  return removed;
}

export async function filterRecords(collection, filters = {}, sortField = "-created_date", limit) {
  const records = loadRecords(collection).filter((record) => matchesFilter(record, filters));
  const sorted = sortRecords(records, sortField);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function listRecords(collection, sortField = "-created_date", limit = 100) {
  return sortRecords(loadRecords(collection), sortField).slice(0, limit);
}

export function subscribeRecords(collection, callback) {
  const set = getListeners(collection);
  set.add(callback);
  return () => set.delete(callback);
}

export function sumField(records, field) {
  return records.reduce((sum, record) => sum + (Number(record[field]) || 0), 0);
}

export function clearRecords(collection) {
  saveRecords(collection, []);
}
