/** Right-click menu for a section: duplicate it, or remove it from this
 *  workspace. Same look and edge-clamping as `CanvasMenu`. */
import { useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface SectionMenuProps {
  x: number;
  y: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const MENU_HEIGHT = 92;

export function SectionMenu({ x, y, onDuplicate, onDelete, onClose }: SectionMenuProps) {
  const { t } = useI18n();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const left = Math.max(8, Math.min(x, window.innerWidth - 232));
  const top = Math.max(8, Math.min(y, window.innerHeight - MENU_HEIGHT - 8));

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} onContextMenu={(event) => event.preventDefault()} />
      <div
        className="fixed z-50 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        style={{ left, top }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Copy className="h-4 w-4 text-blue-500" aria-hidden />
          {t('canvas.duplicateSection')}
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {t('canvas.deleteSection')}
        </button>
      </div>
    </>
  );
}
