import type { Language } from './i18n/strings';

/** Domain model. Every collection item carries a stable id — see `migrate.ts`
 *  for why the v1 shape (plain strings, keyed objects) could not keep one. */

export interface Item {
  id: string;
  text: string;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
}

export interface VisionImage {
  id: string;
  /** File name inside the app's vision-board directory, served via `media://`. */
  file: string;
  name: string;
  /** A short note shown on the back of the card when it's flipped — the
   *  meaning behind the image, not a caption of what it shows. */
  note?: string;
}

export const LIST_IDS = [
  'goals',
  'values',
  'strengths',
  'gratitude',
  'affirmations',
  'quotes',
] as const;

export type ListId = (typeof LIST_IDS)[number];

/** Keyed by `ListId` for the 6 built-in lists, plus one entry per
 *  `CustomPanel.id` for user-added panels — the key set is open. */
export type Lists = Record<string, Item[]>;

export type PanelKind = 'list' | 'videos' | 'vision';

/** A user-added panel. A `list` one points at a `Lists` entry; `videos` and
 *  `vision` ones keep their media in `customVideos` / `customVision` by id. */
export interface CustomPanel {
  id: string;
  name: string;
  kind: PanelKind;
}

/** A user's rename/re-icon of one panel, fixed or custom, keyed by panel id.
 *  Only ever overrides — an absent field falls back to the panel's built-in
 *  title (still resolved through i18n) or default icon, so an un-touched
 *  panel keeps following a language switch. `icon` is a key into
 *  `PANEL_ICONS`, never a component, so it stays plain JSON. */
export interface PanelOverride {
  name?: string;
  icon?: string;
}

export interface Workspace {
  id: string;
  name: string;
  lists: Lists;
  customPanels: CustomPanel[];
  videos: VideoItem[];
  vision: VisionImage[];
  panelOverrides: Record<string, PanelOverride>;
  customVideos: Record<string, VideoItem[]>;
  customVision: Record<string, VisionImage[]>;
  /** Display order of panel keys; keys not listed follow in default order. */
  panelOrder: string[];
  /** Built-in panel keys the user removed from this workspace. Reversible —
   *  unlike a custom panel, a fixed one has nowhere else to live, so deleting
   *  it just hides it rather than losing its (still-stored) content. */
  hiddenFixedPanels: string[];
}

export interface Background {
  /** File name inside the app's backgrounds directory, or null for none. */
  file: string | null;
  /** Opacity of the scrim laid over the image, 0–1. Dark in dark mode, light in light. */
  overlay: number;
}

export interface Settings {
  darkMode: boolean;
  focusDelayMs: number;
  language: Language;
  background: Background;
}

export interface AppState {
  version: 2;
  /** Ordered — renaming a workspace must not move it. */
  workspaces: Workspace[];
  currentWorkspaceId: string;
  settings: Settings;
}

export function emptyLists(): Lists {
  return {
    goals: [],
    values: [],
    strengths: [],
    gratitude: [],
    affirmations: [],
    quotes: [],
  };
}
