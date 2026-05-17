export const PROJECT_SCHEMA_VERSION = 1;

export function createProject({ name, targetName = '', notes = '' }) {
  const now = new Date().toISOString();
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    target: {
      name: targetName.trim(),
      notes: notes.trim(),
    },
    identifiers: [],
    connections: [],
    locations: [],
    pinLinks: [],
    mapDisplay: {
      showPinConnections: false,
      pinConnectionColor: '#ef4444',
    },
  };
}
