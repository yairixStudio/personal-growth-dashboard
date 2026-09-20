/** The grid is generated from this list. Adding a panel means adding an entry
 *  here — not another copy-pasted block of JSX. Titles are translation keys,
 *  resolved at render time so a language switch retitles everything. */
import { Heart, HeartHandshake, Image, List, Quote, Star, Target, Video, type LucideIcon } from 'lucide-react';
import type { StringKey } from './i18n/strings';
import { PANEL_ICONS } from './lib/panelIcons';
import type { ListId, Workspace } from './types';

interface BaseFixedPanel {
  key: string;
  titleKey: StringKey;
  icon: LucideIcon;
}

type FixedPanelDef =
  | (BaseFixedPanel & { kind: 'list'; list: ListId; placeholderKey: StringKey })
  | (BaseFixedPanel & { kind: 'videos' })
  | (BaseFixedPanel & { kind: 'vision' });

/** A panel ready to render: titles/placeholders already resolved to the
 *  current language, whether it's one of the 8 built-ins or a user-added one. */
export interface PanelDef {
  key: string;
  title: string;
  icon: LucideIcon;
  kind: 'list' | 'videos' | 'vision';
  /** Present when `kind === 'list'` — the key into `Workspace.lists`. */
  list?: string;
  /** Present when `kind === 'list'`. */
  placeholder?: string;
  /** True for a panel the user added themselves, via Settings. */
  custom?: boolean;
}

export const FIXED_PANELS: readonly FixedPanelDef[] = [
  { key: 'goals', kind: 'list', list: 'goals', titleKey: 'panel.goals', placeholderKey: 'placeholder.goals', icon: Target },
  { key: 'values', kind: 'list', list: 'values', titleKey: 'panel.values', placeholderKey: 'placeholder.values', icon: Heart },
  { key: 'strengths', kind: 'list', list: 'strengths', titleKey: 'panel.strengths', placeholderKey: 'placeholder.strengths', icon: Star },
  { key: 'gratitude', kind: 'list', list: 'gratitude', titleKey: 'panel.gratitude', placeholderKey: 'placeholder.gratitude', icon: HeartHandshake },
  { key: 'videos', kind: 'videos', titleKey: 'panel.videos', icon: Video },
  { key: 'affirmations', kind: 'list', list: 'affirmations', titleKey: 'panel.affirmations', placeholderKey: 'placeholder.affirmations', icon: List },
  { key: 'vision', kind: 'vision', titleKey: 'panel.vision', icon: Image },
  { key: 'quotes', kind: 'list', list: 'quotes', titleKey: 'panel.quotes', placeholderKey: 'placeholder.quotes', icon: Quote },
] as const;

/** The grid (and focus mode) are generated from this: the 8 built-in panels
 *  plus one per custom panel the user added to this workspace. */
export function getPanels(workspace: Workspace, t: (key: StringKey, vars?: Record<string, string | number>) => string): PanelDef[] {
  const overrides = workspace.panelOverrides;

  const fixed: PanelDef[] = FIXED_PANELS.filter((panel) => !workspace.hiddenFixedPanels.includes(panel.key)).map((panel) => {
    const override = overrides[panel.key];
    return {
      key: panel.key,
      title: override?.name ?? t(panel.titleKey),
      icon: (override?.icon && PANEL_ICONS[override.icon]) || panel.icon,
      kind: panel.kind,
      list: panel.kind === 'list' ? panel.list : undefined,
      placeholder: panel.kind === 'list' ? t(panel.placeholderKey) : undefined,
    };
  });

  const custom: PanelDef[] = workspace.customPanels.map((panel) => {
    const override = overrides[panel.id];
    const defaultIcon = panel.kind === 'videos' ? Video : panel.kind === 'vision' ? Image : List;
    return {
      key: panel.id,
      title: override?.name ?? panel.name,
      icon: (override?.icon && PANEL_ICONS[override.icon]) || defaultIcon,
      kind: panel.kind,
      list: panel.kind === 'list' ? panel.id : undefined,
      placeholder: panel.kind === 'list' ? t('placeholder.custom') : undefined,
      custom: true,
    };
  });

  const all = [...fixed, ...custom];
  // Saved order first, then anything new (a just-added custom panel) at the end.
  const rank = new Map(workspace.panelOrder.map((key, index) => [key, index]));
  return all
    .map((panel, index) => ({ panel, sort: rank.get(panel.key) ?? workspace.panelOrder.length + index }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ panel }) => panel);
}
