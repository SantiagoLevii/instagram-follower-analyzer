export interface IGUser {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
}

export interface Snapshot {
  id: string;
  name: string;
  date: string;
  followers: string[];
  following: string[];
  followerCount: number;
  followingCount: number;
}

export interface Settings {
  requestDelay: number;
  scanCooldown: number;
  unfollowDelay: number;
  unfollowCooldown: number;
  autoSaveSnapshot: boolean;
  theme: 'dark' | 'light';
}

export interface ScanProgress {
  phase: 'followers' | 'following';
  followersLoaded: number;
  followingLoaded: number;
  cooldownSecs?: number;
  is429?: boolean;
}

export interface UnfollowProgress {
  done: number;
  total: number;
  cooldownSecs?: number;
}

export interface DiffResult {
  newFollowers: string[];
  lostFollowers: string[];
  newFollowing: string[];
  lostFollowing: string[];
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'cooldown';
}

export interface ConfirmOptions {
  message: string;
  detail?: string;
  onConfirm: () => void;
}

export type TabId = 'not-following-back' | 'not-followed-back' | 'mutuals' | 'followers' | 'following';
export type View = 'scan' | 'results' | 'snapshots' | 'settings';

export const DEFAULT_SETTINGS: Settings = {
  requestDelay: 1000,
  scanCooldown: 10,
  unfollowDelay: 3000,
  unfollowCooldown: 15,
  autoSaveSnapshot: false,
  theme: 'dark',
};

export const MIN_SETTINGS = {
  requestDelay: 800,
  scanCooldown: 10,
  unfollowDelay: 3000,
  unfollowCooldown: 15,
};
