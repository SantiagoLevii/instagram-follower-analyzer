import { useState } from 'preact/hooks';
import type { Snapshot, IGUser, DiffResult } from '../types';
import { diffSnapshots, diffTwoSnapshots } from '../utils/diff';
import { exportSnapshots, importJSON } from '../utils/export';

interface Props {
  snapshots: Snapshot[];
  currentFollowers?: IGUser[];
  currentFollowing?: IGUser[];
  onSave: (s: Snapshot) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onImport: (snapshots: Snapshot[]) => void;
}

function DiffView({ diff, labelA, labelB }: { diff: DiffResult; labelA: string; labelB: string }) {
  return (
    <div class="ifa-diff-view">
      <div class="ifa-diff-section">
        <h4>New followers ({diff.newFollowers.length})</h4>
        <p class="ifa-diff-desc">Present in {labelB}, absent in {labelA}</p>
        <ul>{diff.newFollowers.map(u => <li key={u}><a href={`https://www.instagram.com/${u}/`} target="_blank" rel="noopener noreferrer">@{u}</a></li>)}</ul>
      </div>
      <div class="ifa-diff-section">
        <h4>Lost followers ({diff.lostFollowers.length})</h4>
        <p class="ifa-diff-desc">Present in {labelA}, absent in {labelB}</p>
        <ul>{diff.lostFollowers.map(u => <li key={u}>@{u}</li>)}</ul>
      </div>
      <div class="ifa-diff-section">
        <h4>Started following ({diff.newFollowing.length})</h4>
        <ul>{diff.newFollowing.map(u => <li key={u}><a href={`https://www.instagram.com/${u}/`} target="_blank" rel="noopener noreferrer">@{u}</a></li>)}</ul>
      </div>
      <div class="ifa-diff-section">
        <h4>Stopped following ({diff.lostFollowing.length})</h4>
        <ul>{diff.lostFollowing.map(u => <li key={u}>@{u}</li>)}</ul>
      </div>
    </div>
  );
}

export function Snapshots({ snapshots, currentFollowers, currentFollowing, onDelete, onRename, onImport }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const selectedSnap = snapshots.find(s => s.id === selected);
  const snapA = snapshots.find(s => s.id === compareA);
  const snapB = snapshots.find(s => s.id === compareB);

  const currentDiff =
    selectedSnap && currentFollowers && currentFollowing
      ? diffSnapshots(selectedSnap, {
          followers: currentFollowers.map(u => u.username),
          following: currentFollowing.map(u => u.username),
        })
      : null;

  const compareDiff = snapA && snapB ? diffTwoSnapshots(snapA, snapB) : null;

  return (
    <div class="ifa-snapshots">
      <div class="ifa-snapshots__toolbar">
        <button
          class="ifa-btn ifa-btn--ghost ifa-btn--sm"
          onClick={() => exportSnapshots(snapshots)}
          disabled={snapshots.length === 0}
        >
          Export
        </button>
        <button
          class="ifa-btn ifa-btn--ghost ifa-btn--sm"
          onClick={() => importJSON<Snapshot[]>(onImport)}
        >
          Import
        </button>
      </div>

      {snapshots.length === 0 && (
        <div class="ifa-empty">No snapshots yet. Save one from the dashboard after scanning.</div>
      )}

      <div class="ifa-snapshot-list">
        {snapshots.map(s => (
          <div
            key={s.id}
            class={`ifa-snapshot-item${selected === s.id ? ' ifa-snapshot-item--selected' : ''}`}
          >
            {editId === s.id ? (
              <input
                class="ifa-input"
                value={editName}
                onInput={e => setEditName((e.target as HTMLInputElement).value)}
                onBlur={() => { onRename(s.id, editName); setEditId(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { onRename(s.id, editName); setEditId(null); } }}
                autoFocus
              />
            ) : (
              <button
                class="ifa-snapshot-item__name"
                onClick={() => setSelected(selected === s.id ? null : s.id)}
              >
                <span>{s.name}</span>
                <span class="ifa-snapshot-item__meta">
                  {new Date(s.date).toLocaleDateString()} - {s.followerCount} followers / {s.followingCount} following
                </span>
              </button>
            )}
            <div class="ifa-snapshot-item__actions">
              <button
                class="ifa-btn ifa-btn--sm ifa-btn--ghost"
                onClick={() => { setEditId(s.id); setEditName(s.name); }}
                title="Rename"
              >
                Edit
              </button>
              <button
                class="ifa-btn ifa-btn--sm ifa-btn--danger"
                onClick={() => onDelete(s.id)}
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedSnap && currentDiff && (
        <div class="ifa-snapshots__diff">
          <h3>Changes vs. current state</h3>
          <DiffView diff={currentDiff} labelA={selectedSnap.name} labelB="current" />
        </div>
      )}

      {snapshots.length >= 2 && (
        <div class="ifa-snapshots__compare">
          <h3>Compare two snapshots</h3>
          <div class="ifa-snapshots__compare-selects">
            <select class="ifa-select" value={compareA} onChange={e => setCompareA((e.target as HTMLSelectElement).value)}>
              <option value="">Select snapshot A</option>
              {snapshots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span>vs.</span>
            <select class="ifa-select" value={compareB} onChange={e => setCompareB((e.target as HTMLSelectElement).value)}>
              <option value="">Select snapshot B</option>
              {snapshots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {compareDiff && <DiffView diff={compareDiff} labelA={snapA!.name} labelB={snapB!.name} />}
        </div>
      )}
    </div>
  );
}
