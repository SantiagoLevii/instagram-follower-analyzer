import type { IGUser, Snapshot, TabId } from '../types';
import { diffSnapshots } from '../utils/diff';

interface ComputedData {
  notFollowingBack: IGUser[];
  notFollowedBack: IGUser[];
  mutuals: IGUser[];
}

interface Props {
  followers: IGUser[];
  following: IGUser[];
  computed: ComputedData;
  scannedAt: string;
  snapshots: Snapshot[];
  onTabSelect: (tab: TabId) => void;
  onRescan: () => void;
  onSaveSnapshot: () => void;
}

interface StatCardProps {
  label: string;
  count: number;
  color: string;
  onClick: () => void;
}

function StatCard({ label, count, color, onClick }: StatCardProps) {
  return (
    <button class={`ifa-stat-card ifa-stat-card--${color}`} onClick={onClick}>
      <span class="ifa-stat-card__count">{count}</span>
      <span class="ifa-stat-card__label">{label}</span>
    </button>
  );
}

export function Dashboard({ followers, following, computed, scannedAt, snapshots, onTabSelect, onRescan, onSaveSnapshot }: Props) {
  const lastSnapshot = snapshots[0];
  let diff: { newFollowers: number; lostFollowers: number } | null = null;

  if (lastSnapshot) {
    const d = diffSnapshots(lastSnapshot, {
      followers: followers.map(u => u.username),
      following: following.map(u => u.username),
    });
    diff = { newFollowers: d.newFollowers.length, lostFollowers: d.lostFollowers.length };
  }

  const scanDate = new Date(scannedAt).toLocaleString();

  return (
    <div class="ifa-dashboard">
      <div class="ifa-dashboard__date">Last scan: {scanDate}</div>

      {diff && (
        <div class="ifa-dashboard__diff">
          {diff.newFollowers > 0 && <span class="ifa-diff--positive">+{diff.newFollowers} new followers</span>}
          {diff.lostFollowers > 0 && <span class="ifa-diff--negative">-{diff.lostFollowers} unfollowed you</span>}
          {diff.newFollowers === 0 && diff.lostFollowers === 0 && <span>No changes since last snapshot</span>}
          <span class="ifa-diff__since"> since last scan</span>
        </div>
      )}

      <div class="ifa-stat-grid">
        <StatCard label="Followers" count={followers.length} color="blue" onClick={() => onTabSelect('followers')} />
        <StatCard label="Following" count={following.length} color="purple" onClick={() => onTabSelect('following')} />
        <StatCard label="Mutuals" count={computed.mutuals.length} color="green" onClick={() => onTabSelect('mutuals')} />
        <StatCard label="Not Following Back" count={computed.notFollowingBack.length} color="red" onClick={() => onTabSelect('not-following-back')} />
        <StatCard label="Not Followed Back" count={computed.notFollowedBack.length} color="orange" onClick={() => onTabSelect('not-followed-back')} />
      </div>

      <div class="ifa-dashboard__actions">
        <button class="ifa-btn ifa-btn--ghost" onClick={onRescan}>Re-scan</button>
        <button class="ifa-btn ifa-btn--primary" onClick={onSaveSnapshot}>Save Snapshot</button>
      </div>
    </div>
  );
}
