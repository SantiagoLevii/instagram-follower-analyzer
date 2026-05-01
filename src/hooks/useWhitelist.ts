import { useState, useCallback } from 'preact/hooks';
import { storageGet, storageSet } from '../utils/storage';

export function useWhitelist() {
  const [whitelist, setWhitelist] = useState<Set<string>>(() => {
    const saved = storageGet<string[]>('whitelist', []);
    return new Set(saved);
  });

  const toggle = useCallback((username: string) => {
    setWhitelist(prev => {
      const next = new Set(prev);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      storageSet('whitelist', Array.from(next));
      return next;
    });
  }, []);

  const importList = useCallback((usernames: string[]) => {
    const next = new Set(usernames);
    setWhitelist(next);
    storageSet('whitelist', usernames);
  }, []);

  const clear = useCallback(() => {
    setWhitelist(new Set());
    storageSet('whitelist', []);
  }, []);

  return { whitelist, toggle, importList, clear };
}
