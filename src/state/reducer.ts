/** All state transitions in one place. Every case returns a new state; the
 *  persistence layer just watches the result and writes it. */
import { newId } from '../lib/id';
import { emptyLists, type AppState, type ListId, type VideoItem, type VisionImage, type Workspace } from '../types';
import { createDefaultState } from './migrate';

export type Action =
  | { type: 'replace'; state: AppState }
  | { type: 'workspace/add'; name: string }
  | { type: 'workspace/rename'; id: string; name: string }
  | { type: 'workspace/delete'; id: string }
  | { type: 'workspace/switch'; id: string }
  | { type: 'workspace/reorder'; from: number; to: number }
  | { type: 'item/add'; list: ListId; text: string }
  | { type: 'item/update'; list: ListId; id: string; text: string }
  | { type: 'item/remove'; list: ListId; id: string }
  | { type: 'item/move'; from: ListId; to: ListId; fromIndex: number; toIndex: number }
  | { type: 'video/add'; title: string; url: string }
  | { type: 'video/remove'; id: string }
  | { type: 'vision/add'; images: VisionImage[] }
  | { type: 'vision/remove'; id: string }
  | { type: 'settings/darkMode'; value: boolean }
  | { type: 'settings/focusDelay'; value: number }
  | { type: 'workspace/fill'; content: Pick<Workspace, 'lists'> };

function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return list;
  next.splice(to, 0, moved);
  return next;
}

/** Applies `change` to the active workspace and leaves the others untouched. */
function updateCurrent(state: AppState, change: (workspace: Workspace) => Workspace): AppState {
  return {
    ...state,
    workspaces: state.workspaces.map((workspace) =>
      workspace.id === state.currentWorkspaceId ? change(workspace) : workspace,
    ),
  };
}

function uniqueName(state: AppState, desired: string, exceptId?: string): string {
  const taken = new Set(
    state.workspaces.filter((workspace) => workspace.id !== exceptId).map((workspace) => workspace.name),
  );
  if (!taken.has(desired)) return desired;
  let suffix = 2;
  while (taken.has(`${desired} ${suffix}`)) suffix += 1;
  return `${desired} ${suffix}`;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'replace':
      return action.state;

    case 'workspace/add': {
      const name = action.name.trim();
      if (!name) return state;
      const workspace: Workspace = {
        id: newId(),
        name: uniqueName(state, name),
        lists: emptyLists(),
        videos: [],
        vision: [],
      };
      return {
        ...state,
        workspaces: [...state.workspaces, workspace],
        currentWorkspaceId: workspace.id,
      };
    }

    case 'workspace/rename': {
      const name = action.name.trim();
      if (!name) return state;
      // Rename in place — the array order is the display order.
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === action.id ? { ...workspace, name: uniqueName(state, name, action.id) } : workspace,
        ),
      };
    }

    case 'workspace/delete': {
      if (state.workspaces.length <= 1) return state;
      const index = state.workspaces.findIndex((workspace) => workspace.id === action.id);
      if (index === -1) return state;
      const workspaces = state.workspaces.filter((workspace) => workspace.id !== action.id);
      const currentWorkspaceId =
        state.currentWorkspaceId === action.id
          ? (workspaces[Math.min(index, workspaces.length - 1)]?.id ?? workspaces[0].id)
          : state.currentWorkspaceId;
      return { ...state, workspaces, currentWorkspaceId };
    }

    case 'workspace/switch':
      return state.workspaces.some((workspace) => workspace.id === action.id)
        ? { ...state, currentWorkspaceId: action.id }
        : state;

    case 'workspace/reorder':
      return { ...state, workspaces: move(state.workspaces, action.from, action.to) };

    case 'item/add': {
      const text = action.text.trim();
      if (!text) return state;
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        lists: {
          ...workspace.lists,
          [action.list]: [...workspace.lists[action.list], { id: newId(), text }],
        },
      }));
    }

    case 'item/update': {
      const text = action.text.trim();
      if (!text) return state;
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        lists: {
          ...workspace.lists,
          [action.list]: workspace.lists[action.list].map((item) =>
            item.id === action.id ? { ...item, text } : item,
          ),
        },
      }));
    }

    case 'item/remove':
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        lists: {
          ...workspace.lists,
          [action.list]: workspace.lists[action.list].filter((item) => item.id !== action.id),
        },
      }));

    case 'item/move':
      return updateCurrent(state, (workspace) => {
        if (action.from === action.to) {
          return {
            ...workspace,
            lists: {
              ...workspace.lists,
              [action.from]: move(workspace.lists[action.from], action.fromIndex, action.toIndex),
            },
          };
        }
        const source = workspace.lists[action.from].slice();
        const [moved] = source.splice(action.fromIndex, 1);
        if (!moved) return workspace;
        const target = workspace.lists[action.to].slice();
        target.splice(action.toIndex, 0, moved);
        return {
          ...workspace,
          lists: { ...workspace.lists, [action.from]: source, [action.to]: target },
        };
      });

    case 'video/add': {
      const title = action.title.trim();
      const url = action.url.trim();
      if (!title || !url) return state;
      const video: VideoItem = { id: newId(), title, url };
      return updateCurrent(state, (workspace) => ({ ...workspace, videos: [...workspace.videos, video] }));
    }

    case 'video/remove':
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        videos: workspace.videos.filter((video) => video.id !== action.id),
      }));

    case 'vision/add':
      if (action.images.length === 0) return state;
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        vision: [...workspace.vision, ...action.images],
      }));

    case 'vision/remove':
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        vision: workspace.vision.filter((image) => image.id !== action.id),
      }));

    case 'settings/darkMode':
      return { ...state, settings: { ...state.settings, darkMode: action.value } };

    case 'settings/focusDelay':
      return { ...state, settings: { ...state.settings, focusDelayMs: action.value } };

    case 'workspace/fill':
      return updateCurrent(state, (workspace) => ({ ...workspace, lists: action.content.lists }));

    default:
      return state;
  }
}

export { createDefaultState };
