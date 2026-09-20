/**
 * Turns whatever came back from the store into a valid `AppState`.
 *
 * v1 stored `workspaces` as an object keyed by name, with every list a plain
 * `string[]`. That shape is why renaming a workspace moved it to the end and
 * why drag-and-drop had to key items by array index. v2 gives workspaces an
 * explicit order and every item an id.
 */
import { detectLanguage, isLanguage } from '../i18n/strings';
import { newId } from '../lib/id';
import {
  emptyLists,
  LIST_IDS,
  type AppState,
  type CustomPanel,
  type Item,
  type PanelOverride,
  type VideoItem,
  type VisionImage,
  type Workspace,
} from '../types';

const DEFAULT_FOCUS_DELAY_MS = 4000;
const DEFAULT_OVERLAY = 0.72;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toItems(value: unknown): Item[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): Item | null => {
      if (typeof entry === 'string') {
        const text = entry.trim();
        return text ? { id: newId(), text } : null;
      }
      if (isRecord(entry)) {
        const text = asText(entry.text);
        return text ? { id: asText(entry.id) || newId(), text } : null;
      }
      return null;
    })
    .filter((item): item is Item => item !== null);
}

function toVideos(value: unknown): VideoItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry) => ({
      id: asText(entry.id) || newId(),
      title: asText(entry.title),
      url: asText(entry.url),
    }))
    .filter((video) => video.title && video.url);
}

function toVision(value: unknown): VisionImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry) => ({
      id: asText(entry.id) || newId(),
      file: asText(entry.file),
      name: asText(entry.name),
      note: typeof entry.note === 'string' && entry.note.trim() ? entry.note.trim() : undefined,
    }))
    .filter((image) => image.file);
}

function toCustomPanels(value: unknown): CustomPanel[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry) => ({
      id: asText(entry.id) || newId(),
      name: asText(entry.name),
      kind: (entry.kind === 'videos' || entry.kind === 'vision' ? entry.kind : 'list') as CustomPanel['kind'],
    }))
    .filter((panel) => panel.name);
}

function toPanelOverrides(value: unknown): Record<string, PanelOverride> {
  if (!isRecord(value)) return {};
  const result: Record<string, PanelOverride> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const override: PanelOverride = {};
    if (typeof entry.name === 'string' && entry.name.trim()) override.name = entry.name.trim();
    if (typeof entry.icon === 'string' && entry.icon) override.icon = entry.icon;
    if (override.name || override.icon) result[key] = override;
  }
  return result;
}

function toWorkspace(name: string, raw: unknown, id?: string): Workspace {
  const source = isRecord(raw) ? raw : {};
  const lists = emptyLists();
  for (const listId of LIST_IDS) {
    lists[listId] = toItems(source[listId]);
  }
  const customPanels = toCustomPanels(source.customPanels);
  const customVideos: Workspace['customVideos'] = {};
  const customVision: Workspace['customVision'] = {};
  const rawVideos = isRecord(source.customVideos) ? source.customVideos : {};
  const rawVision = isRecord(source.customVision) ? source.customVision : {};
  for (const panel of customPanels) {
    if (panel.kind === 'list') lists[panel.id] = toItems(source[panel.id]);
    if (panel.kind === 'videos') customVideos[panel.id] = toVideos(rawVideos[panel.id]);
    if (panel.kind === 'vision') customVision[panel.id] = toVision(rawVision[panel.id]);
  }
  return {
    id: id || newId(),
    name: name || 'Untitled',
    lists,
    customPanels,
    videos: toVideos(source.videos),
    vision: toVision(source.vision),
    panelOverrides: toPanelOverrides(source.panelOverrides),
    customVideos,
    customVision,
    panelOrder: Array.isArray(source.panelOrder) ? source.panelOrder.filter((k): k is string => typeof k === 'string') : [],
    hiddenFixedPanels: Array.isArray(source.hiddenFixedPanels)
      ? source.hiddenFixedPanels.filter((k): k is string => typeof k === 'string')
      : [],
  };
}

export function createDefaultState(): AppState {
  const workspace = toWorkspace('Main', {});
  return {
    version: 2,
    workspaces: [workspace],
    currentWorkspaceId: workspace.id,
    settings: {
      darkMode: false,
      focusDelayMs: DEFAULT_FOCUS_DELAY_MS,
      language: detectLanguage(navigator.language),
    background: { file: null, overlay: DEFAULT_OVERLAY },
    },
  };
}

function migrateSettings(raw: Record<string, unknown>, legacyDarkMode: unknown): AppState['settings'] {
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const darkMode =
    typeof settings.darkMode === 'boolean'
      ? settings.darkMode
      : typeof legacyDarkMode === 'boolean'
        ? legacyDarkMode
        : false;
  const delay = Number(settings.focusDelayMs);
  return {
    darkMode,
    focusDelayMs: Number.isFinite(delay) && delay >= 1000 && delay <= 20000 ? delay : DEFAULT_FOCUS_DELAY_MS,
    // No stored language means this is a first run or a v1 file: follow the OS.
    language: isLanguage(settings.language) ? settings.language : detectLanguage(navigator.language),
    background: migrateBackground(settings.background),
  };
}

function migrateBackground(raw: unknown): AppState['settings']['background'] {
  if (!isRecord(raw)) return { file: null, overlay: DEFAULT_OVERLAY };
  const overlay = Number(raw.overlay);
  return {
    file: typeof raw.file === 'string' && raw.file ? raw.file : null,
    overlay: Number.isFinite(overlay) && overlay >= 0 && overlay <= 1 ? overlay : DEFAULT_OVERLAY,
  };
}

export function migrate(raw: unknown): AppState {
  if (!isRecord(raw)) return createDefaultState();

  let workspaces: Workspace[] = [];

  if (Array.isArray(raw.workspaces)) {
    // v2 — already ordered.
    workspaces = raw.workspaces.filter(isRecord).map((entry) => {
      const built = toWorkspace(
        asText(entry.name),
        isRecord(entry.lists)
          ? {
              ...entry.lists,
              videos: entry.videos,
              vision: entry.vision,
              customPanels: entry.customPanels,
              panelOverrides: entry.panelOverrides,
              customVideos: entry.customVideos,
              customVision: entry.customVision,
              panelOrder: entry.panelOrder,
              hiddenFixedPanels: entry.hiddenFixedPanels,
            }
          : entry,
        asText(entry.id) || undefined,
      );
      return built;
    });
  } else if (isRecord(raw.workspaces)) {
    // v1 — object keyed by name. Object key order is the only order we have.
    workspaces = Object.entries(raw.workspaces).map(([name, value]) => toWorkspace(name, value));
  }

  if (workspaces.length === 0) return createDefaultState();

  const settings = migrateSettings(raw, raw.isDarkMode);

  // v1 pointed at the current workspace by name; v2 by id.
  const byId = workspaces.find((workspace) => workspace.id === asText(raw.currentWorkspaceId));
  const byName = workspaces.find((workspace) => workspace.name === asText(raw.currentWorkspace));
  const current = byId ?? byName ?? workspaces[0];

  return {
    version: 2,
    workspaces,
    currentWorkspaceId: current.id,
    settings,
  };
}
