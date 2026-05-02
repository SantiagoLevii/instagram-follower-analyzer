import { useState, useEffect, useRef } from 'preact/hooks';
import type { ScanProgress, UnfollowProgress } from '../types';

interface Props {
  scanning: boolean;
  progress: ScanProgress | null;
  unfollowProgress: UnfollowProgress | null;
}

export function StatusBar({ scanning, progress, unfollowProgress }: Props) {
  const [scanDone, setScanDone] = useState(false);
  const [maxCooldown, setMaxCooldown] = useState(0);
  const wasActiveRef = useRef(false);
  const prevCooldownRef = useRef<number | undefined>(undefined);

  const isActive = scanning || !!progress || !!unfollowProgress;

  useEffect(() => {
    if (!isActive && wasActiveRef.current) {
      setScanDone(true);
      const t = setTimeout(() => setScanDone(false), 3000);
      wasActiveRef.current = false;
      return () => clearTimeout(t);
    }
    if (isActive) {
      wasActiveRef.current = true;
      setScanDone(false);
    }
  }, [isActive]);

  const activeCooldown = progress?.cooldownSecs ?? unfollowProgress?.cooldownSecs;

  useEffect(() => {
    if (activeCooldown !== undefined && prevCooldownRef.current === undefined) {
      setMaxCooldown(activeCooldown);
    }
    prevCooldownRef.current = activeCooldown;
  }, [activeCooldown]);

  if (!isActive && !scanDone) return null;

  let text = '';
  let cooldownPct: number | null = null;

  if (unfollowProgress) {
    if (unfollowProgress.cooldownSecs !== undefined) {
      text = `Cooldown: ${unfollowProgress.cooldownSecs}s remaining`;
      cooldownPct = maxCooldown > 0 ? unfollowProgress.cooldownSecs / maxCooldown : 1;
    } else {
      const next10 = 10 - (unfollowProgress.done % 10);
      const hint = next10 <= 3 && next10 > 0 ? ` (cooldown in ${next10})` : '';
      text = `Unfollowing ${unfollowProgress.done}/${unfollowProgress.total}...${hint}`;
    }
  } else if (progress) {
    if (progress.cooldownSecs !== undefined) {
      const label = progress.is429 ? 'Rate limited' : 'Cooldown';
      text = `${label}: ${progress.cooldownSecs}s remaining`;
      cooldownPct = maxCooldown > 0 ? progress.cooldownSecs / maxCooldown : 1;
    } else {
      const phase = progress.phase === 'followers' ? 'followers' : 'following';
      const loaded = progress.phase === 'followers' ? progress.followersLoaded : progress.followingLoaded;
      let reqInfo = '';
      if (progress.reqNum !== undefined) {
        const inCycle = progress.reqNum % 10;
        const cooldownIn = inCycle === 0 ? 0 : 10 - inCycle;
        if (cooldownIn > 0 && cooldownIn <= 3) {
          reqInfo = ` (req ${progress.reqNum}, cooldown in ${cooldownIn})`;
        } else {
          reqInfo = ` (req ${progress.reqNum})`;
        }
      }
      text = `Scanning ${phase}: ${loaded} loaded${reqInfo}`;
    }
  } else if (scanning) {
    text = 'Starting scan...';
  } else if (scanDone) {
    text = 'Scan complete';
  }

  return (
    <div class="ifa-status-bar">
      <span class="ifa-status-bar__text">{text}</span>
      {cooldownPct !== null && (
        <div class="ifa-status-bar__progress">
          <div
            class="ifa-status-bar__progress-fill"
            style={{ width: `${Math.max(0, cooldownPct * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
