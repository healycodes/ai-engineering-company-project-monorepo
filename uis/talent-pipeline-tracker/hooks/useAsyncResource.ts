"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api";
import type { AsyncState } from "@/types/candidate";

type Settled<T> =
  | { key: string; status: "error"; error: string }
  | { key: string; status: "success"; data: T };

/**
 * Runs `fetcher` whenever `key` changes and exposes loading / error / success.
 * Loading is derived (the last settled result belongs to a different key),
 * so state is only ever set from async callbacks — never synchronously
 * inside the effect.
 */
export function useAsyncResource<T>(key: string, fetcher: () => Promise<T>) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${key}#${reloadCount}`;

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setSettled({ key: requestKey, status: "success", data });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setSettled({ key: requestKey, status: "error", error: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
    // `fetcher` is intentionally keyed by `requestKey`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const state: AsyncState<T> =
    settled && settled.key === requestKey
      ? settled.status === "success"
        ? { status: "success", data: settled.data }
        : { status: "error", error: settled.error }
      : { status: "loading" };

  /** Replace the loaded data locally (e.g. after a PATCH) without refetching. */
  const setData = useCallback(
    (updater: (prev: T) => T) => {
      setSettled((prev) =>
        prev && prev.status === "success"
          ? { ...prev, data: updater(prev.data) }
          : prev,
      );
    },
    [],
  );

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  // While a reload is in flight, keep showing the previous data if we have it.
  const previous = settled?.status === "success" ? settled.data : undefined;

  return { state, previous, setData, reload };
}
