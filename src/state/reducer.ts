/** All state transitions in one place. Every case returns a new state; the
 *  persistence layer just watches the result and writes it. */
import type { Language } from '../i18n/strings';
import { newId } from '../lib/id';
import { emptyLists, type AppState, type PanelKind, type VideoItem, type VisionImage, type Workspace } from '../types';
import { createDefaultState } from './migrate';

export type Action =
  | { type: 'replace'; state: AppState }
  | { type: 'workspace/add'; name: string }
  | { type: 'workspace/rename'; id: string; name: string }
  | { type: 'workspace/delete'; id: string }
  | { type: 'workspace/switch'; id: string }
  | { type: 'workspace/reorder'; from: number; to: number }
  | { type: 'panel/addCustom'; name: string; kind?: PanelKind }
  | { type: 'panel/removeCustom'; id: string }
  | { type: 'panel/rename'; id: string; name: string }
  | { type: 'panel/setIcon'; id: string; icon: string }
  | { type: 'panel/reorder'; order: string[] }
  /** Hides a built-in panel from this workspace — reversible, since a fixed
   *  panel has nowhere else to live and keeps its content while hidden. */
  | { type: 'panel/hideFixed'; id: string }
  | { type: 'panel/showFixed'; id: string }
  /** Copies a panel's content (fixed or custom) into a brand-new custom one. */
  | { type: 'panel/duplicate'; id: string; kind: PanelKind; name: string }
  | { type: 'item/add'; list: string; text: string }
  | { type: 'item/update'; list: string; id: string; text: string }
  | { type: 'item/remove'; list: string; id: string }
  | { type: 'item/move'; from: string; to: string; fromIndex: number; toIndex: number }
  // `panel` names a custom media panel; absent means the built-in one.
  | { type: 'video/add'; title: string; url: string; panel?: string }
  | { type: 'video/remove'; id: string; panel?: string }
  | { type: 'vision/add'; images: VisionImage[]; panel?: string }
  | { type: 'vision/remove'; id: string; panel?: string }
  | { type: 'vision/setHero'; id: string; panel?: string }
  | { type: 'vision/setNote'; id: string; note: string; panel?: string }
  | { type: 'settings/darkMode'; value: boolean }
  | { type: 'settings/focusDelay'; value: number }
  | { type: 'settings/language'; value: Language }
  | { type: 'settings/background'; file: string | null }
  | { type: 'settings/overlay'; value: number }
  | { type: 'workspace/fill'; content: Pick<Workspace, 'lists' | 'videos' | 'vision'> };

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

const videosOf = (workspace: Workspace, panel?: string) =>
  panel ? (workspace.customVideos[panel] ?? []) : workspace.videos;
const withVideos = (workspace: Workspace, panel: string | undefined, videos: VideoItem[]): Workspace =>
  panel ? { ...workspace, customVideos: { ...workspace.customVideos, [panel]: videos } } : { ...workspace, videos };
const visionOf = (workspace: Workspace, panel?: string) =>
  panel ? (workspace.customVision[panel] ?? []) : workspace.vision;
const withVision = (workspace: Workspace, panel: string | undefined, vision: VisionImage[]): Workspace =>
  panel ? { ...workspace, customVision: { ...workspace.customVision, [panel]: vision } } : { ...workspace, vision };

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
        customPanels: [],
        videos: [],
        vision: [],
        panelOverrides: {},
        customVideos: {},
        customVision: {},
        panelOrder: [],
        hiddenFixedPanels: [],
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

    case 'panel/addCustom': {
      const name = action.name.trim();
      if (!name) return state;
      const id = newId();
      const kind = action.kind ?? 'list';
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        customPanels: [...workspace.customPanels, { id, name, kind }],
        lists: kind === 'list' ? { ...workspace.lists, [id]: [] } : workspace.lists,
        customVideos: kind === 'videos' ? { ...workspace.customVideos, [id]: [] } : workspace.customVideos,
        customVision: kind === 'vision' ? { ...workspace.customVision, [id]: [] } : workspace.customVision,
      }));
    }

    case 'panel/removeCustom':
      return updateCurrent(state, (workspace) => {
        const { [action.id]: _removed, ...lists } = workspace.lists;
        const { [action.id]: _override, ...panelOverrides } = workspace.panelOverrides;
        const { [action.id]: _videos, ...customVideos } = workspace.customVideos;
        const { [action.id]: _vision, ...customVision } = workspace.customVision;
        return {
          ...workspace,
          customPanels: workspace.customPanels.filter((panel) => panel.id !== action.id),
          lists,
          panelOverrides,
          customVideos,
          customVision,
        };
      });

    case 'panel/rename': {
      const name = action.name.trim();
      return updateCurrent(state, (workspace) => {
        const current = workspace.panelOverrides[action.id] ?? {};
        const override: typeof current = { ...current };
        // Empty input reverts to the panel's own title rather than saving a blank one.
        if (name) override.name = name;
        else delete override.name;
        const panelOverrides = { ...workspace.panelOverrides };
        if (override.name || override.icon) panelOverrides[action.id] = override;
        else delete panelOverrides[action.id];
        return { ...workspace, panelOverrides };
      });
    }

    case 'panel/reorder':
      return updateCurrent(state, (workspace) => ({ ...workspace, panelOrder: action.order }));

    case 'panel/hideFixed':
      return updateCurrent(state, (workspace) =>
        workspace.hiddenFixedPanels.includes(action.id)
          ? workspace
          : { ...workspace, hiddenFixedPanels: [...workspace.hiddenFixedPanels, action.id] },
      );

    case 'panel/showFixed':
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        hiddenFixedPanels: workspace.hiddenFixedPanels.filter((id) => id !== action.id),
      }));

    case 'panel/duplicate': {
      const id = newId();
      const newPanel = { id, name: action.name, kind: action.kind };
      return updateCurrent(state, (workspace) => {
        if (action.kind === 'list') {
          const sourceItems = workspace.lists[action.id] ?? [];
          return {
            ...workspace,
            customPanels: [...workspace.customPanels, newPanel],
            lists: { ...workspace.lists, [id]: sourceItems.map((item) => ({ ...item, id: newId() })) },
          };
        }
        if (action.kind === 'videos') {
          const sourceVideos = workspace.customVideos[action.id] ?? workspace.videos;
          return {
            ...workspace,
            customPanels: [...workspace.customPanels, newPanel],
            customVideos: { ...workspace.customVideos, [id]: sourceVideos.map((video) => ({ ...video, id: newId() })) },
          };
        }
        const sourceVision = workspace.customVision[action.id] ?? workspace.vision;
        return {
          ...workspace,
          customPanels: [...workspace.customPanels, newPanel],
          customVision: { ...workspace.customVision, [id]: sourceVision.map((image) => ({ ...image, id: newId() })) },
        };
      });
    }

    case 'panel/setIcon':
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        panelOverrides: {
          ...workspace.panelOverrides,
          [action.id]: { ...workspace.panelOverrides[action.id], icon: action.icon },
        },
      }));

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
      return updateCurrent(state, (workspace) => withVideos(workspace, action.panel, [...videosOf(workspace, action.panel), video]));
    }

    case 'video/remove':
      return updateCurrent(state, (workspace) =>
        withVideos(workspace, action.panel, videosOf(workspace, action.panel).filter((video) => video.id !== action.id)),
      );

    case 'vision/add':
      if (action.images.length === 0) return state;
      return updateCurrent(state, (workspace) =>
        withVision(workspace, action.panel, [...visionOf(workspace, action.panel), ...action.images]),
      );

    case 'vision/remove':
      return updateCurrent(state, (workspace) =>
        withVision(workspace, action.panel, visionOf(workspace, action.panel).filter((image) => image.id !== action.id)),
      );

    case 'vision/setHero':
      // The first image is the big one on the card; swap the chosen one into that slot.
      return updateCurrent(state, (workspace) => {
        const vision = visionOf(workspace, action.panel).slice();
        const index = vision.findIndex((image) => image.id === action.id);
        if (index <= 0) return workspace;
        [vision[0], vision[index]] = [vision[index], vision[0]];
        return withVision(workspace, action.panel, vision);
      });

    case 'vision/setNote': {
      const note = action.note.trim();
      return updateCurrent(state, (workspace) =>
        withVision(
          workspace,
          action.panel,
          visionOf(workspace, action.panel).map((image) =>
            image.id === action.id ? { ...image, note: note || undefined } : image,
          ),
        ),
      );
    }

    case 'settings/darkMode':
      return { ...state, settings: { ...state.settings, darkMode: action.value } };

    case 'settings/focusDelay':
      return { ...state, settings: { ...state.settings, focusDelayMs: action.value } };

    case 'settings/language':
      return { ...state, settings: { ...state.settings, language: action.value } };

    case 'settings/background':
      return {
        ...state,
        settings: { ...state.settings, background: { ...state.settings.background, file: action.file } },
      };

    case 'settings/overlay':
      return {
        ...state,
        settings: { ...state.settings, background: { ...state.settings.background, overlay: action.value } },
      };

    case 'workspace/fill':
      // Sample content only covers the 6 built-in lists — a user's own custom
      // panels must survive the fill untouched.
      return updateCurrent(state, (workspace) => ({
        ...workspace,
        lists: {
          ...action.content.lists,
          ...Object.fromEntries(workspace.customPanels.map((panel) => [panel.id, workspace.lists[panel.id] ?? []])),
        },
        videos: action.content.videos,
        vision: [...workspace.vision, ...action.content.vision],
      }));

    default:
      return state;
  }
}

export { createDefaultState };
