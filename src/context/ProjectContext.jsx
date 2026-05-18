import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createProject } from '../utils/createProject.js';
import { downloadProject, readProjectFromFile } from '../utils/projectIO.js';
import {
  saveRecent,
  markRecentSaved,
} from '../utils/recentProjects.js';
import { DEFAULT_PIN_COLOR } from '../pinColors.js';

const ProjectContext = createContext(null);

const AUTOSAVE_DELAY_MS = 500;

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null);
  // Latest project state mirrored synchronously for flush-on-unmount paths
  // (e.g. closeProject) where setState wouldn't have applied yet.
  const projectRef = useRef(null);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Debounced auto-snapshot of every change so the user can resume after
  // accidentally backing out. Snapshot is keyed by project.id; carries the
  // existing lastSavedAt across (saveRecent default).
  useEffect(() => {
    if (!project) return;
    const t = setTimeout(() => saveRecent(project), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [project]);

  const newProject = (init) => {
    const created = createProject(init);
    setProject(created);
    // Immediate snapshot so the row appears in recents even before any edit.
    saveRecent(created, { lastSavedAt: null });
  };

  const openProjectFromFile = async (file) => {
    const loaded = await readProjectFromFile(file);
    setProject(loaded);
    // The file represents a saved state — mark the recent entry as saved.
    saveRecent(loaded, { lastSavedAt: new Date().toISOString() });
    return loaded;
  };

  // Resume a project from a stored recent snapshot (no file read).
  const openProjectFromSnapshot = (snapshot) => {
    if (!snapshot) return null;
    setProject(snapshot);
    return snapshot;
  };

  const closeProject = () => {
    // Flush the latest state synchronously before unmounting so the auto-save
    // debounce can't race the user clicking Back.
    const current = projectRef.current;
    if (current) saveRecent(current);
    setProject(null);
  };

  const saveProject = () => {
    if (!project) return;
    const stamped = downloadProject(project);
    setProject(stamped);
    // The downloaded file IS the saved state — flush + mark.
    saveRecent(stamped, { lastSavedAt: new Date().toISOString() });
    markRecentSaved(stamped.id);
  };

  const updateProject = (updater) => {
    setProject((current) => {
      if (!current) return current;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...next, updatedAt: new Date().toISOString() };
    });
  };

  const addIdentifier = (identifier) => {
    const now = new Date().toISOString();
    let created;
    updateProject((p) => {
      const idx = p.identifiers.length;
      const defaultPosition = {
        x: 60 + (idx % 4) * 240,
        y: 60 + Math.floor(idx / 4) * 150,
      };
      created = {
        id: identifier.id ?? crypto.randomUUID(),
        type: identifier.type,
        fields: identifier.fields ?? {},
        notes: identifier.notes ?? '',
        position: identifier.position ?? defaultPosition,
        customIconId: identifier.customIconId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      return { ...p, identifiers: [...p.identifiers, created] };
    });
    return created;
  };

  // Batched-add for paste / duplicate. Commits all records in one updateProject
  // so React only renders once and the action shows up as a single undo entry.
  const bulkAddIdentifiers = (records) => {
    if (!records || records.length === 0) return [];
    const now = new Date().toISOString();
    const built = [];
    updateProject((p) => {
      const startIdx = p.identifiers.length;
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const idx = startIdx + i;
        const defaultPosition = {
          x: 60 + (idx % 4) * 240,
          y: 60 + Math.floor(idx / 4) * 150,
        };
        built.push({
          id: r.id ?? crypto.randomUUID(),
          type: r.type,
          fields: r.fields ?? {},
          notes: r.notes ?? '',
          position: r.position ?? defaultPosition,
          customIconId: r.customIconId ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }
      return { ...p, identifiers: [...p.identifiers, ...built] };
    });
    return built;
  };

  const updateIdentifier = (id, patch) => {
    updateProject((p) => ({
      ...p,
      identifiers: p.identifiers.map((it) =>
        it.id === id
          ? { ...it, ...patch, id: it.id, updatedAt: new Date().toISOString() }
          : it,
      ),
    }));
  };

  const deleteIdentifier = (id) => {
    updateProject((p) => ({
      ...p,
      identifiers: p.identifiers.filter((it) => it.id !== id),
      connections: p.connections.filter(
        (c) => c.source !== id && c.target !== id,
      ),
      pinLinks: (p.pinLinks ?? []).filter((l) => l.identifierId !== id),
    }));
  };

  const addConnection = (
    source,
    target,
    sourceHandle = null,
    targetHandle = null,
  ) => {
    if (!source || !target || source === target) return null;
    let created = null;
    updateProject((p) => {
      const exists = p.connections.some(
        (c) =>
          (c.source === source && c.target === target) ||
          (c.source === target && c.target === source),
      );
      if (exists) return p;
      created = {
        id: crypto.randomUUID(),
        source,
        target,
        sourceHandle: sourceHandle ?? null,
        targetHandle: targetHandle ?? null,
        label: '',
      };
      return { ...p, connections: [...p.connections, created] };
    });
    return created;
  };

  const deleteConnection = (id) => {
    updateProject((p) => ({
      ...p,
      connections: p.connections.filter((c) => c.id !== id),
    }));
  };

  const addPin = (pin) => {
    const now = new Date().toISOString();
    const record = {
      id: pin.id ?? crypto.randomUUID(),
      label: pin.label ?? '',
      address: pin.address ?? '',
      lat: pin.lat,
      lng: pin.lng,
      placeId: pin.placeId ?? null,
      visitedAt: pin.visitedAt ?? '',
      withWho: pin.withWho ?? '',
      notes: pin.notes ?? '',
      color: pin.color ?? DEFAULT_PIN_COLOR,
      iconId: pin.iconId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    updateProject((p) => ({ ...p, locations: [...p.locations, record] }));
    return record;
  };

  const updatePin = (id, patch) => {
    updateProject((p) => ({
      ...p,
      locations: p.locations.map((it) =>
        it.id === id
          ? { ...it, ...patch, id: it.id, updatedAt: new Date().toISOString() }
          : it,
      ),
    }));
  };

  const deletePin = (id) => {
    updateProject((p) => ({
      ...p,
      locations: p.locations.filter((it) => it.id !== id),
      pinLinks: (p.pinLinks ?? []).filter((l) => l.pinId !== id),
    }));
  };

  const addPinLink = (pinId, identifierId, context = '') => {
    if (!pinId || !identifierId) return null;
    let created = null;
    updateProject((p) => {
      const existing = (p.pinLinks ?? []).find(
        (l) => l.pinId === pinId && l.identifierId === identifierId,
      );
      if (existing) {
        created = existing;
        return p;
      }
      created = {
        id: crypto.randomUUID(),
        pinId,
        identifierId,
        context,
        createdAt: new Date().toISOString(),
      };
      return { ...p, pinLinks: [...(p.pinLinks ?? []), created] };
    });
    return created;
  };

  const updateMapDisplay = (patch) => {
    updateProject((p) => ({
      ...p,
      mapDisplay: {
        showPinConnections: false,
        pinConnectionColor: '#ef4444',
        ...(p.mapDisplay ?? {}),
        ...patch,
      },
    }));
  };

  const setPinLinkContext = (pinId, identifierId, context) => {
    updateProject((p) => ({
      ...p,
      pinLinks: (p.pinLinks ?? []).map((l) =>
        l.pinId === pinId && l.identifierId === identifierId
          ? { ...l, context }
          : l,
      ),
    }));
  };

  const removePinLink = (linkId) => {
    if (!linkId) return;
    updateProject((p) => ({
      ...p,
      pinLinks: (p.pinLinks ?? []).filter((l) => l.id !== linkId),
    }));
  };

  const removePinLinkByPair = (pinId, identifierId) => {
    updateProject((p) => ({
      ...p,
      pinLinks: (p.pinLinks ?? []).filter(
        (l) => !(l.pinId === pinId && l.identifierId === identifierId),
      ),
    }));
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        newProject,
        openProjectFromFile,
        openProjectFromSnapshot,
        closeProject,
        saveProject,
        updateProject,
        addIdentifier,
        bulkAddIdentifiers,
        updateIdentifier,
        deleteIdentifier,
        addConnection,
        deleteConnection,
        addPin,
        updatePin,
        deletePin,
        addPinLink,
        removePinLink,
        removePinLinkByPair,
        setPinLinkContext,
        updateMapDisplay,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
