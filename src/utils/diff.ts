import type { Snapshot, DiffResult } from '../types';

export function diffSnapshots(
  snapshot: Snapshot,
  current: { followers: string[]; following: string[] }
): DiffResult {
  const snapFollowers = new Set(snapshot.followers);
  const snapFollowing = new Set(snapshot.following);
  const curFollowers = new Set(current.followers);
  const curFollowing = new Set(current.following);

  return {
    newFollowers: current.followers.filter(u => !snapFollowers.has(u)),
    lostFollowers: snapshot.followers.filter(u => !curFollowers.has(u)),
    newFollowing: current.following.filter(u => !snapFollowing.has(u)),
    lostFollowing: snapshot.following.filter(u => !curFollowing.has(u)),
  };
}

export function diffTwoSnapshots(a: Snapshot, b: Snapshot): DiffResult {
  return diffSnapshots(a, { followers: b.followers, following: b.following });
}
