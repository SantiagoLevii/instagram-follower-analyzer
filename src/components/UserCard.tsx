import { useState } from 'preact/hooks';
import type { IGUser } from '../types';

interface Props {
  user: IGUser;
  whitelisted: boolean;
  selected: boolean;
  onToggleWhitelist: () => void;
  onSelect: () => void;
}

export function UserCard({ user, whitelisted, selected, onToggleWhitelist, onSelect }: Props) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div class={`ifa-user-card${whitelisted ? ' ifa-user-card--whitelisted' : ''}`}>
      <input
        type="checkbox"
        class="ifa-checkbox"
        checked={selected}
        disabled={whitelisted}
        onChange={onSelect}
      />
      <div class="ifa-user-card__avatar" onClick={onToggleWhitelist} title={whitelisted ? 'Remove from whitelist' : 'Add to whitelist'}>
        {!imgErr ? (
          <img
            src={user.profile_pic_url}
            alt={user.username}
            width={40}
            height={40}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div class="ifa-avatar-fallback">{user.username[0]?.toUpperCase()}</div>
        )}
        {whitelisted && <span class="ifa-star" title="Whitelisted">*</span>}
      </div>
      <div class="ifa-user-card__info">
        <a
          class="ifa-user-card__username"
          href={`https://www.instagram.com/${user.username}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{user.username}
          {user.is_verified && <span class="ifa-verified" title="Verified">V</span>}
        </a>
        {user.full_name && <span class="ifa-user-card__fullname">{user.full_name}</span>}
      </div>
      <button
        class={`ifa-whitelist-btn${whitelisted ? ' ifa-whitelist-btn--active' : ''}`}
        onClick={onToggleWhitelist}
        title={whitelisted ? 'Remove from whitelist' : 'Whitelist'}
      >
        {whitelisted ? '★' : '☆'}
      </button>
    </div>
  );
}
