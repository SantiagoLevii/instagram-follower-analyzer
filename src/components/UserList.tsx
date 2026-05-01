import { useState, useMemo } from 'preact/hooks';
import { UserCard } from './UserCard';
import { useFilters } from '../hooks/useFilters';
import { exportCSV, exportTXT } from '../utils/export';
import type { IGUser, TabId } from '../types';

const UNFOLLOW_TABS: TabId[] = ['not-following-back', 'mutuals', 'following'];

interface Props {
  users: IGUser[];
  whitelist: Set<string>;
  onToggleWhitelist: (username: string) => void;
  onUnfollowSelected: (users: IGUser[]) => void;
  tabId: TabId;
  unfollowProgress: { done: number; total: number; cooldownSecs?: number } | null;
}

export function UserList({ users, whitelist, onToggleWhitelist, onUnfollowSelected, tabId, unfollowProgress }: Props) {
  const { search, setSearch, sort, setSort, filtered } = useFilters(users);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const eligibleForSelect = useMemo(
    () => filtered.filter(u => !whitelist.has(u.username)),
    [filtered, whitelist]
  );

  const allSelected = eligibleForSelect.length > 0 && eligibleForSelect.every(u => selected.has(u.pk));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligibleForSelect.map(u => u.pk)));
    }
  };

  const toggleSelect = (pk: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(pk)) next.delete(pk);
      else next.add(pk);
      return next;
    });
  };

  const selectedUsers = useMemo(
    () => users.filter(u => selected.has(u.pk) && !whitelist.has(u.username)),
    [users, selected, whitelist]
  );

  const showUnfollowBtn = UNFOLLOW_TABS.includes(tabId);

  const handleExport = (format: 'csv' | 'txt') => {
    const base = `ifa-${tabId}-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') exportCSV(filtered, base + '.csv');
    else exportTXT(filtered, base + '.txt');
  };

  return (
    <div class="ifa-user-list">
      <div class="ifa-user-list__toolbar">
        <input
          class="ifa-input ifa-user-list__search"
          type="text"
          placeholder="Search username or name..."
          value={search}
          onInput={e => setSearch((e.target as HTMLInputElement).value)}
        />
        <select
          class="ifa-select"
          value={sort}
          onChange={e => setSort((e.target as HTMLSelectElement).value as 'asc' | 'desc')}
        >
          <option value="asc">A-Z</option>
          <option value="desc">Z-A</option>
        </select>
      </div>

      <div class="ifa-user-list__meta">
        <label class="ifa-user-list__select-all">
          <input
            type="checkbox"
            class="ifa-checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={eligibleForSelect.length === 0}
          />
          Select All
        </label>
        <span class="ifa-user-list__count">
          Showing {filtered.length} of {users.length}
        </span>
        <div class="ifa-user-list__export">
          <button class="ifa-btn ifa-btn--sm ifa-btn--ghost" onClick={() => handleExport('csv')}>CSV</button>
          <button class="ifa-btn ifa-btn--sm ifa-btn--ghost" onClick={() => handleExport('txt')}>TXT</button>
        </div>
      </div>

      {unfollowProgress && (
        <div class="ifa-unfollow-bar">
          {unfollowProgress.cooldownSecs
            ? `Cooldown: ${unfollowProgress.cooldownSecs}s (anti-ban)...`
            : `Unfollowing ${unfollowProgress.done}/${unfollowProgress.total}...${
                10 - (unfollowProgress.done % 10) <= 3 && unfollowProgress.done % 10 !== 0
                  ? ` cooldown in ${10 - (unfollowProgress.done % 10)}`
                  : ''
              }`}
        </div>
      )}

      <div class="ifa-user-list__items">
        {filtered.map(user => (
          <UserCard
            key={user.pk}
            user={user}
            whitelisted={whitelist.has(user.username)}
            selected={selected.has(user.pk)}
            onToggleWhitelist={() => onToggleWhitelist(user.username)}
            onSelect={() => toggleSelect(user.pk)}
          />
        ))}
        {filtered.length === 0 && (
          <div class="ifa-empty">No users found.</div>
        )}
      </div>

      {showUnfollowBtn && selectedUsers.length > 0 && !unfollowProgress && (
        <div class="ifa-user-list__actions">
          <button
            class="ifa-btn ifa-btn--danger"
            onClick={() => onUnfollowSelected(selectedUsers)}
          >
            Unfollow Selected ({selectedUsers.length})
          </button>
        </div>
      )}
    </div>
  );
}
