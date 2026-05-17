import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useProject } from './ProjectContext.jsx';

/**
 * Undo/redo + clipboard for node-graph operations on the Information tab.
 *
 * What gets recorded:
 *   - Node creation (single via addIdentifier, batch via paste/duplicate)
 *   - Node deletion (with cascaded connections + pinLinks)
 *   - Node position changes (only on drag-stop, not during drag)
 *
 * Each history entry is `{ apply(state), revert(state) }` — both return the
 * next project state. undo() pops the top entry and runs `revert`; redo()
 * runs `apply`. Both go through `updateProject` directly so they don't
 * generate new history entries.
 *
 * The clipboard is a snapshot array of identifier records, used by paste.
 */

const HISTORY_LIMIT = 20;
const NodeHistoryContext = createContext(null);

// --- Action factories ---------------------------------------------------------

function buildCreateAction(identifier) {
  return {
    apply: (p) => ({ ...p, identifiers: [...p.identifiers, identifier] }),
    revert: (p) => ({
      ...p,
      identifiers: p.identifiers.filter((i) => i.id !== identifier.id),
      connections: p.connections.filter(
        (c) => c.source !== identifier.id && c.target !== identifier.id,
      ),
      pinLinks: (p.pinLinks ?? []).filter(
        (l) => l.identifierId !== identifier.id,
      ),
    }),
  };
}

function buildBatchCreateAction(records) {
  const ids = new Set(records.map((r) => r.id));
  return {
    apply: (p) => ({ ...p, identifiers: [...p.identifiers, ...records] }),
    revert: (p) => ({
      ...p,
      identifiers: p.identifiers.filter((i) => !ids.has(i.id)),
      connections: p.connections.filter(
        (c) => !ids.has(c.source) && !ids.has(c.target),
      ),
      pinLinks: (p.pinLinks ?? []).filter((l) => !ids.has(l.identifierId)),
    }),
  };
}

function buildDeleteAction(identifier, connections, pinLinks) {
  return {
    apply: (p) => ({
      ...p,
      identifiers: p.identifiers.filter((i) => i.id !== identifier.id),
      connections: p.connections.filter(
        (c) => c.source !== identifier.id && c.target !== identifier.id,
      ),
      pinLinks: (p.pinLinks ?? []).filter(
        (l) => l.identifierId !== identifier.id,
      ),
    }),
    revert: (p) => ({
      ...p,
      identifiers: [...p.identifiers, identifier],
      connections: [...p.connections, ...connections],
      pinLinks: [...(p.pinLinks ?? []), ...pinLinks],
    }),
  };
}

// Multi-node delete (e.g. selecting several nodes and pressing Delete).
// Stored as ONE history entry so a single Ctrl+Z restores all of them.
function buildBatchDeleteAction(items) {
  const ids = new Set(items.map((it) => it.identifier.id));
  // When BOTH endpoints of an edge are in the batch, the same edge appears
  // in both items' captured `connections` array. Dedupe by id so we don't
  // re-insert duplicates on revert.
  const seenConn = new Set();
  const allConns = [];
  for (const it of items) {
    for (const c of it.connections ?? []) {
      if (seenConn.has(c.id)) continue;
      seenConn.add(c.id);
      allConns.push(c);
    }
  }
  const seenLink = new Set();
  const allLinks = [];
  for (const it of items) {
    for (const l of it.pinLinks ?? []) {
      if (seenLink.has(l.id)) continue;
      seenLink.add(l.id);
      allLinks.push(l);
    }
  }
  return {
    apply: (p) => ({
      ...p,
      identifiers: p.identifiers.filter((i) => !ids.has(i.id)),
      connections: p.connections.filter(
        (c) => !ids.has(c.source) && !ids.has(c.target),
      ),
      pinLinks: (p.pinLinks ?? []).filter((l) => !ids.has(l.identifierId)),
    }),
    revert: (p) => ({
      ...p,
      identifiers: [...p.identifiers, ...items.map((it) => it.identifier)],
      connections: [...p.connections, ...allConns],
      pinLinks: [...(p.pinLinks ?? []), ...allLinks],
    }),
  };
}

function buildMoveAction(id, from, to) {
  return {
    apply: (p) => ({
      ...p,
      identifiers: p.identifiers.map((i) =>
        i.id === id ? { ...i, position: to } : i,
      ),
    }),
    revert: (p) => ({
      ...p,
      identifiers: p.identifiers.map((i) =>
        i.id === id ? { ...i, position: from } : i,
      ),
    }),
  };
}

// --- Edge (connection) actions ---------------------------------------------

function buildCreateEdgeAction(connection) {
  return {
    apply: (p) => ({
      ...p,
      connections: [...p.connections, connection],
    }),
    revert: (p) => ({
      ...p,
      connections: p.connections.filter((c) => c.id !== connection.id),
    }),
  };
}

function buildDeleteEdgeAction(connection) {
  return {
    apply: (p) => ({
      ...p,
      connections: p.connections.filter((c) => c.id !== connection.id),
    }),
    revert: (p) => ({
      ...p,
      connections: [...p.connections, connection],
    }),
  };
}

function buildBatchDeleteEdgesAction(connections) {
  const ids = new Set(connections.map((c) => c.id));
  return {
    apply: (p) => ({
      ...p,
      connections: p.connections.filter((c) => !ids.has(c.id)),
    }),
    revert: (p) => ({
      ...p,
      connections: [...p.connections, ...connections],
    }),
  };
}

// --- Compound action --------------------------------------------------------

// Combine N actions into a single history entry — useful for flows that
// touch multiple kinds of state at once (e.g. Blender-style drag → creates
// both a node and an edge, but should be one Ctrl+Z step).
function buildCompoundAction(actions) {
  return {
    apply: (p) => actions.reduce((acc, a) => a.apply(acc), p),
    revert: (p) =>
      [...actions].reverse().reduce((acc, a) => a.revert(acc), p),
  };
}

// --- Provider -----------------------------------------------------------------

export function NodeHistoryProvider({ children }) {
  const { updateProject } = useProject();
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const clipboardRef = useRef([]);

  const pushAction = useCallback((action) => {
    if (!action) return;
    setUndoStack((prev) => {
      const next = [...prev, action];
      return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
    });
    setRedoStack([]);
  }, []);

  const recordCreate = useCallback(
    (identifier) => pushAction(buildCreateAction(identifier)),
    [pushAction],
  );

  const recordBatchCreate = useCallback(
    (records) => {
      if (!records || records.length === 0) return;
      pushAction(buildBatchCreateAction(records));
    },
    [pushAction],
  );

  const recordDelete = useCallback(
    (identifier, connections = [], pinLinks = []) =>
      pushAction(buildDeleteAction(identifier, connections, pinLinks)),
    [pushAction],
  );

  const recordBatchDelete = useCallback(
    (items) => {
      if (!items || items.length === 0) return;
      if (items.length === 1) {
        return pushAction(
          buildDeleteAction(
            items[0].identifier,
            items[0].connections ?? [],
            items[0].pinLinks ?? [],
          ),
        );
      }
      pushAction(buildBatchDeleteAction(items));
    },
    [pushAction],
  );

  const recordMove = useCallback(
    (id, from, to) => {
      if (!from || !to) return;
      if (from.x === to.x && from.y === to.y) return;
      pushAction(buildMoveAction(id, from, to));
    },
    [pushAction],
  );

  const recordCreateEdge = useCallback(
    (connection) =>
      connection && pushAction(buildCreateEdgeAction(connection)),
    [pushAction],
  );

  const recordDeleteEdge = useCallback(
    (connection) =>
      connection && pushAction(buildDeleteEdgeAction(connection)),
    [pushAction],
  );

  const recordBatchDeleteEdges = useCallback(
    (connections) => {
      if (!connections || connections.length === 0) return;
      if (connections.length === 1) {
        return pushAction(buildDeleteEdgeAction(connections[0]));
      }
      pushAction(buildBatchDeleteEdgesAction(connections));
    },
    [pushAction],
  );

  // Record a node + edge as a single undo entry — used by the Blender-style
  // drag-handle-to-empty-space flow which creates both at once.
  const recordCreateNodeWithEdge = useCallback(
    (identifier, connection) => {
      if (!identifier) return;
      if (!connection) {
        return pushAction(buildCreateAction(identifier));
      }
      pushAction(
        buildCompoundAction([
          buildCreateAction(identifier),
          buildCreateEdgeAction(connection),
        ]),
      );
    },
    [pushAction],
  );

  const undo = useCallback(() => {
    let popped = null;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      popped = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    // Defer state mutations until after the stack update so React schedules
    // them in the same commit (avoids the popped-but-not-applied race).
    queueMicrotask(() => {
      if (!popped) return;
      updateProject(popped.revert);
      setRedoStack((r) => [...r, popped]);
    });
  }, [updateProject]);

  const redo = useCallback(() => {
    let popped = null;
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      popped = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    queueMicrotask(() => {
      if (!popped) return;
      updateProject(popped.apply);
      setUndoStack((u) => {
        const next = [...u, popped];
        return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
      });
    });
  }, [updateProject]);

  const setClipboard = useCallback((records) => {
    clipboardRef.current = records ?? [];
  }, []);

  const getClipboard = useCallback(() => clipboardRef.current, []);

  const value = useMemo(
    () => ({
      recordCreate,
      recordBatchCreate,
      recordDelete,
      recordBatchDelete,
      recordMove,
      recordCreateEdge,
      recordDeleteEdge,
      recordBatchDeleteEdges,
      recordCreateNodeWithEdge,
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      setClipboard,
      getClipboard,
    }),
    [
      recordCreate,
      recordBatchCreate,
      recordDelete,
      recordBatchDelete,
      recordMove,
      recordCreateEdge,
      recordDeleteEdge,
      recordBatchDeleteEdges,
      recordCreateNodeWithEdge,
      undo,
      redo,
      undoStack.length,
      redoStack.length,
      setClipboard,
      getClipboard,
    ],
  );

  return (
    <NodeHistoryContext.Provider value={value}>
      {children}
    </NodeHistoryContext.Provider>
  );
}

export function useNodeHistory() {
  const ctx = useContext(NodeHistoryContext);
  if (!ctx)
    throw new Error('useNodeHistory must be used within NodeHistoryProvider');
  return ctx;
}
