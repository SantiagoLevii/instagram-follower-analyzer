import { useState, useCallback } from 'preact/hooks';
import { storageGet, storageSet } from '../utils/storage';
import type { Snapshot } from '../types';

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() =>
    storageGet<Snapshot[]>('snapshots', [])
  );

  const save = useCallback((snapshot: Snapshot) => {
    setSnapshots(prev => {
      const next = [snapshot, ...prev];
      storageSet('snapshots', next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSnapshots(prev => {
      const next = prev.filter(s => s.id !== id);
      storageSet('snapshots', next);
      return next;
    });
  }, []);

  const rename = useCallback((id: string, name: string) => {
    setSnapshots(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, name } : s));
      storageSet('snapshots', next);
      return next;
    });
  }, []);

  const importSnapshots = useCallback((imported: Snapshot[]) => {
    setSnapshots(imported);
    storageSet('snapshots', imported);
  }, []);

  return { snapshots, save, remove, rename, importSnapshots };
}
