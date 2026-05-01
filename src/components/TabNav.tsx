import type { TabId } from '../types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'not-following-back', label: 'Not Following' },
  { id: 'not-followed-back', label: 'Not Followed' },
  { id: 'mutuals', label: 'Mutuals' },
  { id: 'followers', label: 'Followers' },
  { id: 'following', label: 'Following' },
];

interface Props {
  activeTab: TabId;
  counts: Record<TabId, number>;
  onChange: (tab: TabId) => void;
}

export function TabNav({ activeTab, counts, onChange }: Props) {
  return (
    <div class="ifa-tab-nav">
      {TABS.map(t => (
        <button
          key={t.id}
          class={`ifa-tab${activeTab === t.id ? ' ifa-tab--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          <span class="ifa-tab__count">{counts[t.id]}</span>
        </button>
      ))}
    </div>
  );
}
