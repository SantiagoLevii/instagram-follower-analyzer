import type { IGUser, Settings } from '../types';

const APP_ID = '936619743392459';

export function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function getUserId(): string | null {
  return getCookie('ds_user_id');
}

export function getCsrfToken(): string | null {
  return getCookie('csrftoken');
}

const BASE_HEADERS = {
  'X-IG-App-ID': APP_ID,
};

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

type ProgressCb = (loaded: number, cooldownSecs?: number, is429?: boolean) => void;

interface IGApiError {
  status: number;
}

async function fetchPage(url: string, signal: AbortSignal): Promise<{
  users: IGUser[];
  next_max_id?: string;
}> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: BASE_HEADERS,
    method: 'GET',
    signal,
  });

  if (res.status === 429) throw { status: 429 } as IGApiError;
  if (res.status === 401) throw { status: 401 } as IGApiError;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return res.json();
}

async function fetchAll(
  userId: string,
  endpoint: 'followers' | 'following',
  settings: Settings,
  onProgress: ProgressCb,
  signal: AbortSignal
): Promise<IGUser[]> {
  const users: IGUser[] = [];
  let cursor: string | undefined;
  let reqCount = 0;
  let backoffMs = 60_000;

  while (!signal.aborted) {
    const url =
      `https://www.instagram.com/api/v1/friendships/${userId}/${endpoint}/?count=50` +
      (cursor ? `&max_id=${cursor}` : '');

    try {
      const data = await fetchPage(url, signal);
      users.push(...data.users);
      reqCount++;
      cursor = data.next_max_id;
      onProgress(users.length);

      if (!cursor) break;

      if (reqCount % 10 === 0) {
        const secs = settings.scanCooldown;
        for (let s = secs; s > 0 && !signal.aborted; s--) {
          onProgress(users.length, s);
          await sleep(1000);
        }
        onProgress(users.length);
      } else {
        const jitter = Math.random() * 700;
        await sleep(settings.requestDelay + jitter);
      }

      backoffMs = 60_000;
    } catch (err: unknown) {
      if (signal.aborted) break;
      const apiErr = err as IGApiError;
      if (apiErr?.status === 429) {
        const waitSecs = backoffMs / 1000;
        for (let s = waitSecs; s > 0 && !signal.aborted; s--) {
          onProgress(users.length, s, true);
          await sleep(1000);
        }
        backoffMs = Math.min(backoffMs * 2, 900_000);
      } else if (apiErr?.status === 401) {
        throw new Error('Session expired. Reload Instagram and try again.');
      } else {
        throw err;
      }
    }
  }

  return users;
}

export function fetchAllFollowers(
  userId: string,
  settings: Settings,
  onProgress: ProgressCb,
  signal: AbortSignal
): Promise<IGUser[]> {
  return fetchAll(userId, 'followers', settings, onProgress, signal);
}

export function fetchAllFollowing(
  userId: string,
  settings: Settings,
  onProgress: ProgressCb,
  signal: AbortSignal
): Promise<IGUser[]> {
  return fetchAll(userId, 'following', settings, onProgress, signal);
}

export async function unfollowUser(targetUserId: string, csrfToken: string): Promise<void> {
  const res = await fetch(
    `https://www.instagram.com/api/v1/friendships/destroy/${targetUserId}/`,
    {
      credentials: 'include',
      headers: { ...BASE_HEADERS, 'x-csrftoken': csrfToken },
      method: 'POST',
    }
  );
  if (res.status === 429) throw { status: 429 } as IGApiError;
  if (res.status === 401) throw { status: 401 } as IGApiError;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
