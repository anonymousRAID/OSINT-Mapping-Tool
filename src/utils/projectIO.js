import { PROJECT_SCHEMA_VERSION } from './createProject.js';

export function downloadProject(project) {
  const stamped = { ...project, updatedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(stamped, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (stamped.name || 'project')
    .replace(/[^a-z0-9-_]+/gi, '_')
    .toLowerCase();
  a.href = url;
  a.download = `${safeName}.osint.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return stamped;
}

export function readProjectFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const validated = validateProject(parsed);
        resolve(validated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function validateProject(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Project file is not a valid JSON object.');
  }
  if (typeof obj.name !== 'string') {
    throw new Error('Project file is missing a "name".');
  }
  if (obj.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    // Soft accept for now; future migrations can branch here.
    console.warn(
      `Project schemaVersion ${obj.schemaVersion} differs from current ${PROJECT_SCHEMA_VERSION}.`,
    );
  }
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: obj.id || crypto.randomUUID(),
    name: obj.name,
    createdAt: obj.createdAt || new Date().toISOString(),
    updatedAt: obj.updatedAt || new Date().toISOString(),
    target: {
      name: obj.target?.name ?? '',
      notes: obj.target?.notes ?? '',
    },
    identifiers: Array.isArray(obj.identifiers) ? obj.identifiers : [],
    connections: Array.isArray(obj.connections) ? obj.connections : [],
    locations: Array.isArray(obj.locations) ? obj.locations : [],
    pinLinks: Array.isArray(obj.pinLinks) ? obj.pinLinks : [],
    mapDisplay: {
      showPinConnections: !!obj.mapDisplay?.showPinConnections,
      pinConnectionColor:
        typeof obj.mapDisplay?.pinConnectionColor === 'string'
          ? obj.mapDisplay.pinConnectionColor
          : '#ef4444',
    },
  };
}
