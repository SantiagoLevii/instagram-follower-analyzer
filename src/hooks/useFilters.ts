import { useState, useMemo } from 'preact/hooks';
import type { IGUser } from '../types';

export type SortOrder = 'asc' | 'desc';

export function useFilters(users: IGUser[]) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOrder>('asc');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = q
      ? users.filter(
          u =>
            u.username.toLowerCase().includes(q) ||
            u.full_name.toLowerCase().includes(q)
        )
      : users;

    result = [...result].sort((a, b) =>
      sort === 'asc'
        ? a.username.localeCompare(b.username)
        : b.username.localeCompare(a.username)
    );

    return result;
  }, [users, search, sort]);

  return { search, setSearch, sort, setSort, filtered };
}
