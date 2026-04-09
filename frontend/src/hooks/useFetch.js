import { useCallback, useEffect, useState } from 'react';

/**
 * Generic data-fetching hook.
 *
 * @param {Function} fetchFn  — async function that returns data
 * @param {Array}    deps     — dependency array (re-fetches when deps change)
 *
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFn()
      .then(setData)
      .catch((err) => setError(err.message || 'Erreur'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
