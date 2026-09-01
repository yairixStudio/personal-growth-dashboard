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

export type Lists = Record<ListId, Item[]>;

export interface Workspace {
  id: string;
  name: string;
  lists: Lists;
  videos: VideoItem[];
  vision: VisionImage[];
}

export interface Settings {
  darkMode: boolean;
  focusDelayMs: number;
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
