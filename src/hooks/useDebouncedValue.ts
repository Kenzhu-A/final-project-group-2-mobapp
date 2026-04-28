// [DASHBOARD-REDESIGN] generic debounce; used by Dashboard + Saved search inputs
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 250): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
