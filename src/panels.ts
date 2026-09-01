/** The grid is generated from this list. Adding a panel means adding an entry
 *  here — not another copy-pasted block of JSX. */
import { Heart, HeartHandshake, Image, List, Quote, Star, Target, Video, type LucideIcon } from 'lucide-react';
import type { ListId } from './types';

interface BasePanel {
  key: string;
  title: string;
  icon: LucideIcon;
}

export type PanelDef =
  | (BasePanel & { kind: 'list'; list: ListId; placeholder: string })
  | (BasePanel & { kind: 'videos' })
  | (BasePanel & { kind: 'vision' });

export const PANELS: readonly PanelDef[] = [
  { key: 'goals', kind: 'list', list: 'goals', title: 'Goals', icon: Target, placeholder: 'What are you working toward?' },
  { key: 'values', kind: 'list', list: 'values', title: 'Values', icon: Heart, placeholder: 'What do you want to stay true to?' },
  { key: 'strengths', kind: 'list', list: 'strengths', title: 'Strengths', icon: Star, placeholder: 'What are you good at?' },
  { key: 'gratitude', kind: 'list', list: 'gratitude', title: 'Gratitude', icon: HeartHandshake, placeholder: "What's worth noticing?" },
  { key: 'videos', kind: 'videos', title: 'Inspiring Videos', icon: Video },
  { key: 'affirmations', kind: 'list', list: 'affirmations', title: 'Affirmations', icon: List, placeholder: 'A line worth repeating' },
  { key: 'vision', kind: 'vision', title: 'Vision Board', icon: Image },
  { key: 'quotes', kind: 'list', list: 'quotes', title: 'Inspirational Quotes', icon: Quote, placeholder: 'A quote that stuck with you' },
] as const;

export const PANEL_COUNT = PANELS.length;
