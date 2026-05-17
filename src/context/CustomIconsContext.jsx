import { createContext, useCallback, useContext, useState } from 'react';
import {
  loadCustomIcons,
  newCustomIconId,
  persistCustomIcons,
} from '../utils/customIcons.js';

const CustomIconsContext = createContext(null);

export function CustomIconsProvider({ children }) {
  const [icons, setIcons] = useState(() => loadCustomIcons());

  const addIcon = useCallback((name, dataUrl) => {
    const id = newCustomIconId();
    setIcons((cur) => {
      const next = { ...cur, [id]: { name: name || 'Untitled icon', dataUrl } };
      persistCustomIcons(next);
      return next;
    });
    return id;
  }, []);

  const removeIcon = useCallback((id) => {
    setIcons((cur) => {
      if (!cur[id]) return cur;
      const next = { ...cur };
      delete next[id];
      persistCustomIcons(next);
      return next;
    });
  }, []);

  const renameIcon = useCallback((id, name) => {
    setIcons((cur) => {
      if (!cur[id]) return cur;
      const next = { ...cur, [id]: { ...cur[id], name } };
      persistCustomIcons(next);
      return next;
    });
  }, []);

  return (
    <CustomIconsContext.Provider value={{ icons, addIcon, removeIcon, renameIcon }}>
      {children}
    </CustomIconsContext.Provider>
  );
}

export function useCustomIcons() {
  const ctx = useContext(CustomIconsContext);
  if (!ctx)
    throw new Error('useCustomIcons must be used within CustomIconsProvider');
  return ctx;
}
