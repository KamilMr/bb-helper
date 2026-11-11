import { useState, useEffect } from "react";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(fetcher: () => Promise<T>): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    fetcher()
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
