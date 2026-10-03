import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Load data from the API and re-load whenever `deps` change.
 *
 *   const { data, error, loading, reload } = useAsync(() => groupsApi.get(id), [id, refreshKey]);
 *
 * `data` keeps its previous value while re-loading, so screens don't flash
 * empty after every save. Pass `enabled: false` to skip loading.
 */
export function useAsync(load, deps, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const latest = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) return;
    const callId = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load();
      if (callId === latest.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (callId === latest.current) setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
