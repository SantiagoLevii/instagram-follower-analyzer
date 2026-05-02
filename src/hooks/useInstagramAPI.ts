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
  addToast: (msg: string, type: 'info' | 'success' | 'error' | 'cooldown', duration?: number) => string
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
        (n, secs, is429, reqNum) => {
          followersCount = n;
          setProgress({ phase: 'followers', followersLoaded: n, followingLoaded: 0, cooldownSecs: secs, is429, reqNum });
        },
        ctrlRef.current.signal
      );

      const following = await fetchAllFollowing(
        userId,
        settings,
        (n, secs, is429, reqNum) => {
          setProgress({ phase: 'following', followersLoaded: followersCount, followingLoaded: n, cooldownSecs: secs, is429, reqNum });
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
            addToast(`Instagram rate limited this session. Pausing ${waitSecs}s...`, 'error', 4000);
            for (let s = waitSecs; s > 0; s--) {
              setUnfollowProgress({ done: i, total, cooldownSecs: s });
              await sleep(1000);
            }
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
        setUnfollowProgress({ done: i + 1, total, cooldownSecs: undefined });
        addToast(`Unfollowed @${user.username} (${i + 1}/${total})`, 'info', 3000);
        backoffMs = 120_000;
      }

      if (i < targets.length - 1) {
        if ((i + 1) % 10 === 0) {
          const secs = settings.unfollowCooldown;
          for (let s = secs; s > 0; s--) {
            setUnfollowProgress({ done: i + 1, total, cooldownSecs: s });
            await sleep(1000);
          }
        } else {
          await sleep(settings.unfollowDelay);
        }
      }
    }

    setUnfollowProgress(null);
    onComplete(unfollowed);
  }, [settings, addToast]);

  return { scanning, progress, unfollowProgress, startScan, cancelScan, runUnfollow };
}
