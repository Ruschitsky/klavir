/**
 * A tiny stand-in for `zustand` used by the offline build, so the packaged app has no
 * dependencies. Same surface the trainer uses: create(), a hook with selectors, getState().
 */
import { useSyncExternalStore } from "react";

type Setter<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

export function create<T>(init: (set: Setter<T>, get: () => T) => T) {
  let state: T;
  const listeners = new Set<() => void>();
  const get = () => state;
  const set: Setter<T> = (partial) => {
    const next = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };
  state = init(set, get);
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore(selector?: (state: T) => unknown) {
    const read = () => (selector ? selector(state) : state);
    return useSyncExternalStore(subscribe, read, read);
  }
  useStore.getState = get;
  return useStore;
}
