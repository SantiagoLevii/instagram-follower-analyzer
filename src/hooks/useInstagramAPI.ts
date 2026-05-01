import { useState, useRef, useCallback } from 'preact/hooks';
import { fetchAllFollowers, fetchAllFollowing, getUserId, unfollowUser, getCsrfToken } from '../api/instagram';
import type { IGUser, Settings, ScanProgress, UnfollowProgress } from '../types';

interface ScanResult {
  followers: IGUser[];
  following: IGUser[];
  scannedAt: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function useInstagramAPI(
  settings: Settings,
  addToast: (msg: string, type: 'info' | 'success' | 'error' | 'cooldown', duration?: number) => string,
  removeToast: (id: string) => void
) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [unfollowProgress, setUnfollowProgress] = useState<UnfollowProgress | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const startScan = useCallback(async (): Promise<ScanResult | null> => {
    const userId = getUserId();
    if (!userId) {
      addToast('Not logged in. Log into Instagram and re-run the script.', 'error');
      return null;
    }

    ctrlRef.current = new AbortController();
    setScanning(true);

    try {
      let followersCount = 0;

      const followers = await fetchAllFollowers(
        userId,
        settings,
        (n, secs, is429) => {
          followersCount = n;
          setProgress({ phase: 'followers', followersLoaded: n, followingLoaded: 0, cooldownSecs: secs, is429 });
          if (secs !== undefined) {
            const msg = is429
              ? `Rate limited by Instagram, waiting ${secs}s...`
              : `Cooldown: ${secs}s remaining (anti-ban protection)`;
            addToast(msg, is429 ? 'error' : 'cooldown', 0);
          }
        },
        ctrlRef.current.signal
      );

      const following = await fetchAllFollowing(
        userId,
        settings,
        (n, secs, is429) => {
          setProgress({ phase: 'following', followersLoaded: followersCount, followingLoaded: n, cooldownSecs: secs, is429 });
          if (secs !== undefined) {
            const msg = is429
              ? `Rate limited by Instagram, waiting ${secs}s...`
              : `Cooldown: ${secs}s remaining (anti-ban protection)`;
            addToast(msg, is429 ? 'error' : 'cooldown', 0);
          }
        },
        ctrlRef.current.signal
      );

      if (ctrlRef.current.signal.aborted) return null;

      const result: ScanResult = {
        followers,
        following,
        scannedAt: new Date().toISOString(),
      };

      addToast(`Scan completed: ${followers.length} followers, ${following.length} following`, 'success', 4000);
      return result;
    } catch (err) {
      if (!ctrlRef.current?.signal.aborted) {
        const msg = err instanceof Error ? err.message : 'Scan failed';
        addToast(msg, 'error', 5000);
      }
      return null;
    } finally {
      setScanning(false);
      setProgress(null);
    }
  }, [settings, addToast]);

  const cancelScan = useCallback(() => {
    ctrlRef.current?.abort();
  }, []);

  const runUnfollow = useCallback(async (
    targets: IGUser[],
    onComplete: (unfollowed: string[]) => void
  ) => {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      addToast('No CSRF token found. Try reloading Instagram.', 'error', 5000);
      return;
    }

    const total = targets.length;
    const unfollowed: string[] = [];
    let backoffMs = 120_000;

    setUnfollowProgress({ done: 0, total });

    for (let i = 0; i < targets.length; i++) {
      const user = targets[i];
      let success = false;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await unfollowUser(user.pk, csrfToken);
          success = true;
          break;
        } catch (err: unknown) {
          const apiErr = err as { status?: number };
          if (apiErr?.status === 429) {
            const waitSecs = backoffMs / 1000;
            const toastId = addToast(`Rate limited by Instagram, waiting ${waitSecs}s...`, 'error', 0);
            for (let s = waitSecs; s > 0; s--) {
              setUnfollowProgress({ done: i, total, cooldownSecs: s });
              await sleep(1000);
            }
            removeToast(toastId);
            backoffMs = Math.min(backoffMs * 2, 900_000);
          } else if (apiErr?.status === 401) {
            addToast('Session expired. Reload Instagram and try again.', 'error', 0);
            setUnfollowProgress(null);
            return;
          } else {
            addToast(`Failed to unfollow @${user.username}`, 'error', 3000);
            break;
          }
        }
      }

      if (success) {
        unfollowed.push(user.pk);
        const nextCooldownIn = 10 - ((i + 1) % 10);
        setUnfollowProgress({ done: i + 1, total, cooldownSecs: undefined });
        addToast(
          `Unfollowed @${user.username} (${i + 1}/${total})${nextCooldownIn <= 3 && nextCooldownIn > 0 ? ` - cooldown in ${nextCooldownIn}` : ''}`,
          'info',
          3000
        );
        backoffMs = 120_000;
      }

      if (i < targets.length - 1) {
        if ((i + 1) % 10 === 0) {
          const secs = settings.unfollowCooldown;
          const toastId = addToast(`Cooldown: pausing ${secs}s (anti-ban)...`, 'cooldown', 0);
          for (let s = secs; s > 0; s--) {
            setUnfollowProgress({ done: i + 1, total, cooldownSecs: s });
            await sleep(1000);
          }
          removeToast(toastId);
        } else {
          await sleep(settings.unfollowDelay);
        }
      }
    }

    setUnfollowProgress(null);
    onComplete(unfollowed);
  }, [settings, addToast, removeToast]);

  return { scanning, progress, unfollowProgress, startScan, cancelScan, runUnfollow };
}
