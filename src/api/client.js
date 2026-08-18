import { generateId, loadCollection, saveCollection } from './storage';

const ENTITY_NAMES = [
  'DroneDetection',
  'GameSession',
  'GameSessionParticipant',
  'ATCSession',
  'Aircraft',
  'Watchlist',
  'Incident',
];

const listeners = new Map();
const conversationListeners = new Map();

function getListeners(entityName) {
  if (!listeners.has(entityName)) {
    listeners.set(entityName, new Set());
  }
  return listeners.get(entityName);
}

function emit(entityName, event) {
  getListeners(entityName).forEach((listener) => listener(event));
}

function parseSortField(sortField) {
  if (!sortField) return { field: 'created_date', desc: true };
  const desc = sortField.startsWith('-');
  return { field: desc ? sortField.slice(1) : sortField, desc };
}

function sortRecords(records, sortField) {
  const { field, desc } = parseSortField(sortField);
  return [...records].sort((a, b) => {
    const aVal = a[field] ?? '';
    const bVal = b[field] ?? '';
    if (aVal < bVal) return desc ? 1 : -1;
    if (aVal > bVal) return desc ? -1 : 1;
    return 0;
  });
}

function matchesFilter(record, filters) {
  return Object.entries(filters).every(([key, value]) => record[key] === value);
}

function createEntityApi(entityName) {
  return {
    async create(data) {
      const records = loadCollection(entityName);
      const now = new Date().toISOString();
      const record = {
        id: generateId(),
        created_date: now,
        updated_date: now,
        ...data,
      };
      records.push(record);
      saveCollection(entityName, records);
      emit(entityName, { type: 'create', id: record.id, data: record });
      return record;
    },

    async update(id, data) {
      const records = loadCollection(entityName);
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) throw new Error(`${entityName} not found`);
      const updated = {
        ...records[index],
        ...data,
        updated_date: new Date().toISOString(),
      };
      records[index] = updated;
      saveCollection(entityName, records);
      emit(entityName, { type: 'update', id, data: updated });
      return updated;
    },

    async delete(id) {
      const records = loadCollection(entityName);
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) throw new Error(`${entityName} not found`);
      const [removed] = records.splice(index, 1);
      saveCollection(entityName, records);
      emit(entityName, { type: 'delete', id, data: removed });
      return removed;
    },

    async get(id) {
      const records = loadCollection(entityName);
      const record = records.find((item) => item.id === id);
      if (!record) throw new Error(`${entityName} not found`);
      return record;
    },

    async filter(filters = {}, sortField = '-created_date', limit) {
      const records = loadCollection(entityName).filter((record) => matchesFilter(record, filters));
      const sorted = sortRecords(records, sortField);
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
    },

    async list(sortField = '-created_date', limit = 100) {
      const records = sortRecords(loadCollection(entityName), sortField);
      return records.slice(0, limit);
    },

    subscribe(callback) {
      const set = getListeners(entityName);
      set.add(callback);
      return () => set.delete(callback);
    },
  };
}

const DEFAULT_USER = {
  id: 'local-user',
  email: 'operator@atc.local',
  full_name: 'ATC Operator',
  role: 'admin',
};

const SUPERVISOR_RESPONSES = [
  'Maintain current separation. Monitor the inbound traffic on final.',
  'Consider vectoring that aircraft to a holding pattern until weather clears.',
  'Emergency acknowledged. Priority handling is in effect for that callsign.',
  'Runway assignment looks good. Continue monitoring wake turbulence separation.',
  'Recommend reducing arrival rate if separation losses continue.',
];

function getConversationStore() {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('atc_app_agent_conversations') || '{}');
  } catch {
    return {};
  }
}

function saveConversationStore(store) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('atc_app_agent_conversations', JSON.stringify(store));
}

function loadConversation(id) {
  const store = getConversationStore();
  return store[id] || { id, messages: [] };
}

function saveConversation(conversation) {
  const store = getConversationStore();
  store[conversation.id] = conversation;
  saveConversationStore(store);
}

function emitConversation(conversationId) {
  const conversation = loadConversation(conversationId);
  const set = conversationListeners.get(conversationId);
  if (set) {
    set.forEach((listener) => listener(conversation));
  }
}

export const api = {
  auth: {
    async me() {
      return DEFAULT_USER;
    },
    logout() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('atc_app_access_token');
      }
    },
    redirectToLogin() {
      // Local app runs without external auth.
    },
  },

  entities: Object.fromEntries(ENTITY_NAMES.map((name) => [name, createEntityApi(name)])),

  agents: {
    async createConversation({ metadata = {} } = {}) {
      const conversation = {
        id: generateId(),
        metadata,
        messages: [],
      };
      saveConversation(conversation);
      return conversation;
    },

    subscribeToConversation(conversationId, callback) {
      if (!conversationListeners.has(conversationId)) {
        conversationListeners.set(conversationId, new Set());
      }
      conversationListeners.get(conversationId).add(callback);
      callback(loadConversation(conversationId));
      return () => conversationListeners.get(conversationId)?.delete(callback);
    },

    async addMessage(conversation, { role, content }) {
      const current = loadConversation(conversation.id);
      const userMessage = {
        id: generateId(),
        role,
        content,
        created_at: new Date().toISOString(),
      };
      current.messages = [...current.messages, userMessage];
      saveConversation(current);
      emitConversation(conversation.id);

      if (role === 'user') {
        setTimeout(() => {
          const reply = {
            id: generateId(),
            role: 'assistant',
            content: SUPERVISOR_RESPONSES[Math.floor(Math.random() * SUPERVISOR_RESPONSES.length)],
            created_at: new Date().toISOString(),
          };
          const updated = loadConversation(conversation.id);
          updated.messages = [...updated.messages, reply];
          saveConversation(updated);
          emitConversation(conversation.id);
        }, 600);
      }

      return userMessage;
    },
  },
};
