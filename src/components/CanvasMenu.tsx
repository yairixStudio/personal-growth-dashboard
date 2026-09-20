/** The little menu a double-click on empty canvas opens. One entry for now —
 *  "new section" — which turns into a name field in place. */
import { useEffect, useState } from 'react';
import { Image, List, Video } from 'lucide-react';
import type { PanelKind } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface CanvasMenuProps {
  x: number;
  y: number;
  onCreate: (name: string, kind: PanelKind) => void;
  onClose: () => void;
}

/** Tallest state of the menu (label + three options), for edge clamping. */
const MENU_HEIGHT = 150;

const OPTIONS = [
  { value: 'list', icon: List, label: 'canvas.kindList' },
  { value: 'videos', icon: Video, label: 'canvas.kindVideos' },
  { value: 'vision', icon: Image, label: 'canvas.kindVision' },
] as const;

export function CanvasMenu({ x, y, onCreate, onClose }: CanvasMenuProps) {
  const { t } = useI18n();
  const [kind, setKind] = useState<PanelKind | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && kind) onCreate(trimmed, kind);
    else onClose();
  };

  // Keep the menu inside the window when the click was near an edge.
  const left = Math.max(8, Math.min(x, window.innerWidth - 232));
  const top = Math.max(8, Math.min(y, window.innerHeight - MENU_HEIGHT - 8));

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />
      <div
        className="fixed z-50 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        style={{ left, top }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {kind ? (
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && commit()}
            onBlur={commit}
            placeholder={t('settings.customPanelNamePlaceholder')}
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        ) : (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t('canvas.newPanel')}
            </p>
            {OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Icon className="h-4 w-4 text-blue-500" aria-hidden />
                {t(label)}
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
}
