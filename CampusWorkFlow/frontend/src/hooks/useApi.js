import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError } from "../api/errors.js";

/**
 * Charge une ressource asynchrone et expose { data, error, loading, reload, setData }.
 * `fetcher` doit être stable (fonction de module ou `useCallback`).
 * Passer `null` comme fetcher désactive le chargement.
 */
export function useApi(fetcher, { initialData = null } = {}) {
  const [state, setState] = useState({ data: initialData, error: null, loading: Boolean(fetcher) });
  const requestId = useRef(0);
  const initial = useRef(initialData);

  const run = useCallback(async () => {
    if (!fetcher) return;
    requestId.current += 1;
    const current = requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (current === requestId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (current === requestId.current) {
        setState({ data: initial.current, error: toApiError(error), loading: false });
      }
    }
  }, [fetcher]);

  useEffect(() => {
    run();
    return () => {
      requestId.current += 1; // ignore les réponses tardives après démontage
    };
  }, [run]);

  const setData = useCallback(
    (updater) =>
      setState((prev) => ({ ...prev, data: typeof updater === "function" ? updater(prev.data) : updater })),
    []
  );

  return { ...state, reload: run, setData };
}

/**
 * Charge plusieurs ressources indépendantes en parallèle : l'échec d'une
 * source n'empêche pas l'affichage des autres (fallback UI par bloc).
 * Retourne { data: { key: value|null }, errors: { key: ApiError }, loading, reload }.
 */
export function useApiAll(fetchers) {
  const fetchAll = useCallback(async () => {
    const entries = Object.entries(fetchers || {});
    const results = await Promise.allSettled(entries.map(([, fn]) => fn()));
    const data = {};
    const errors = {};
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === "fulfilled") data[key] = result.value;
      else {
        data[key] = null;
        errors[key] = toApiError(result.reason);
      }
    });
    return { data, errors };
  }, [fetchers]);

  const { data, loading, reload, error } = useApi(fetchers ? fetchAll : null);
  return { data: data?.data || {}, errors: data?.errors || {}, error, loading, reload };
}

/** Exécute une mutation en suivant son état ; renvoie [execute, { pending }]. */
export function useMutation(action) {
  const [pending, setPending] = useState(false);
  const execute = useCallback(
    async (...args) => {
      setPending(true);
      try {
        return await action(...args);
      } catch (error) {
        throw toApiError(error);
      } finally {
        setPending(false);
      }
    },
    [action]
  );
  return [execute, { pending }];
}
