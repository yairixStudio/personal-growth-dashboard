/** The grid is generated from this list. Adding a panel means adding an entry
 *  here — not another copy-pasted block of JSX. Titles are translation keys,
 *  resolved at render time so a language switch retitles everything. */
import { Heart, HeartHandshake, Image, List, Quote, Star, Target, Video, type LucideIcon } from 'lucide-react';
import type { StringKey } from './i18n/strings';
import type { ListId } from './types';

interface BasePanel {
  key: string;
  titleKey: StringKey;
  icon: LucideIcon;
}

export type PanelDef =
  | (BasePanel & { kind: 'list'; list: ListId; placeholderKey: StringKey })
  | (BasePanel & { kind: 'videos' })
  | (BasePanel & { kind: 'vision' });

export const PANELS: readonly PanelDef[] = [
  { key: 'goals', kind: 'list', list: 'goals', titleKey: 'panel.goals', placeholderKey: 'placeholder.goals', icon: Target },
  { key: 'values', kind: 'list', list: 'values', titleKey: 'panel.values', placeholderKey: 'placeholder.values', icon: Heart },
  { key: 'strengths', kind: 'list', list: 'strengths', titleKey: 'panel.strengths', placeholderKey: 'placeholder.strengths', icon: Star },
  { key: 'gratitude', kind: 'list', list: 'gratitude', titleKey: 'panel.gratitude', placeholderKey: 'placeholder.gratitude', icon: HeartHandshake },
  { key: 'videos', kind: 'videos', titleKey: 'panel.videos', icon: Video },
  { key: 'affirmations', kind: 'list', list: 'affirmations', titleKey: 'panel.affirmations', placeholderKey: 'placeholder.affirmations', icon: List },
  { key: 'vision', kind: 'vision', titleKey: 'panel.vision', icon: Image },
  { key: 'quotes', kind: 'list', list: 'quotes', titleKey: 'panel.quotes', placeholderKey: 'placeholder.quotes', icon: Quote },
] as const;

export const PANEL_COUNT = PANELS.length;
