const P = 'ifa_';

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(P + key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(P + key, JSON.stringify(value));
  } catch {}
}

export function storageRemove(key: string): void {
  localStorage.removeItem(P + key);
}

export function storageClear(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(P));
  keys.forEach(k => localStorage.removeItem(k));
}
