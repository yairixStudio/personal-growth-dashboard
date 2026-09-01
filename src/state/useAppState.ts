/** Loads state from the main process once, then persists every change. */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { AppState, Workspace } from '../types';
import { migrate } from './migrate';
import { createDefaultState, reducer, type Action } from './reducer';

const SAVE_DEBOUNCE_MS = 400;

export interface AppStateHandle {
  state: AppState;
  workspace: Workspace;
  dispatch: (action: Action) => void;
  loaded: boolean;
}

export function useAppState(): AppStateHandle {
  const [state, dispatch] = useReducer(reducer, null, createDefaultState);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void window.desktop
      .loadState()
      .then((raw) => {
        if (cancelled) return;
        dispatch({ type: 'replace', state: migrate(raw) });
      })
      .catch((error: unknown) => {
        console.error('Could not load saved state; starting fresh.', error);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced write-behind. Skipped until the initial load has resolved, so a
  // slow load can never be overwritten by the default state.
  useEffect(() => {
    if (!loaded) return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void window.desktop.saveState(state).catch((error: unknown) => {
        console.error('Could not save state.', error);
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [state, loaded]);

  // A pending debounce must not be lost when the window goes away.
  useEffect(() => {
    const flush = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
        void window.desktop.saveState(state);
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.darkMode);
  }, [state.settings.darkMode]);

  const workspace =
    state.workspaces.find((entry) => entry.id === state.currentWorkspaceId) ?? state.workspaces[0];

  const dispatchAction = useCallback((action: Action) => dispatch(action), []);

  return { state, workspace, dispatch: dispatchAction, loaded };
}
