import type { IGUser, Snapshot } from '../types';

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(users: IGUser[], filename = 'users.csv'): void {
  const header = 'username,full_name,verified\n';
  const rows = users.map(u => `${u.username},${JSON.stringify(u.full_name)},${u.is_verified}`).join('\n');
  download(header + rows, filename, 'text/csv');
}

export function exportTXT(users: IGUser[], filename = 'users.txt'): void {
  const lines = users.map(u => `@${u.username}${u.full_name ? ` (${u.full_name})` : ''}`).join('\n');
  download(lines, filename, 'text/plain');
}

export function exportJSON(data: unknown, filename = 'data.json'): void {
  download(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function exportSnapshots(snapshots: Snapshot[]): void {
  exportJSON(snapshots, `ifa-snapshots-${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportWhitelist(usernames: string[]): void {
  exportJSON(usernames, `ifa-whitelist-${new Date().toISOString().slice(0, 10)}.json`);
}

export function importJSON<T>(onLoad: (data: T) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as T;
        onLoad(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
