import type { ScanProgress } from '../types';

interface Props {
  scanning: boolean;
  progress: ScanProgress | null;
  onScan: () => void;
  onCancel: () => void;
}

export function ScanButton({ scanning, progress, onScan, onCancel }: Props) {
  const cooldownMsg = progress?.cooldownSecs !== undefined
    ? progress.is429
      ? `Rate limited - waiting ${progress.cooldownSecs}s...`
      : `Cooldown: ${progress.cooldownSecs}s remaining (anti-ban protection)`
    : null;

  const progressText = progress
    ? `Followers: ${progress.followersLoaded}${progress.phase === 'followers' ? '' : ' done'} | Following: ${progress.followingLoaded}${progress.phase === 'following' && !progress.cooldownSecs ? '...' : ''}`
    : null;

  return (
    <div class="ifa-scan-view">
      <div class="ifa-scan-view__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <p class="ifa-scan-view__desc">
        Analyze your followers and following to see who doesn't follow you back.
      </p>

      {!scanning ? (
        <button class="ifa-btn ifa-btn--primary ifa-btn--lg" onClick={onScan}>
          SCAN
        </button>
      ) : (
        <div class="ifa-scan-view__progress">
          {progressText && (
            <div class="ifa-scan-view__progress-text">{progressText}</div>
          )}
          {cooldownMsg && (
            <div class="ifa-scan-view__cooldown">{cooldownMsg}</div>
          )}
          {!cooldownMsg && (
            <div class="ifa-progress-bar">
              <div class="ifa-progress-bar__fill ifa-progress-bar--indeterminate" />
            </div>
          )}
          <button class="ifa-btn ifa-btn--ghost ifa-btn--sm" onClick={onCancel}>
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}
