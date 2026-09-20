/** The card shell every panel shares: header, add button, and focus-mode state. */
import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import { FocusPlay } from './icons/FocusPlay';
import { IconPicker } from './IconPicker';

interface PanelProps {
  title: string;
  icon: LucideIcon;
  isDimmed: boolean;
  isSpotlit: boolean;
  onSelect?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  /** Jump straight into focus mode, paused on this panel. */
  onFocusHere?: () => void;
  focusLabel?: string;
  /** Present for every panel — lets the title double as an inline-edit field. */
  onRename?: (name: string) => void;
  /** Present for every panel — lets the icon double as an icon-picker trigger. */
  onIconChange?: (iconKey: string) => void;
  /** Right-click on empty space within the panel (not on an item, button,
   *  image or other interactive element) — opens the duplicate/delete menu. */
  onRequestMenu?: (x: number, y: number) => void;
  /** Set while something from the OS is hovering over this panel. */
  isDropTarget?: boolean;
  dropProps?: Record<string, unknown>;
  children: ReactNode;
}

export function Panel({
  title,
  icon: Icon,
  isDimmed,
  isSpotlit,
  onSelect,
  onAdd,
  addLabel,
  onFocusHere,
  focusLabel,
  onRename,
  onIconChange,
  onRequestMenu,
  isDropTarget = false,
  dropProps,
  children,
}: PanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isPickingIcon, setIsPickingIcon] = useState(false);

  const commitRename = (value: string) => {
    setIsEditingTitle(false);
    onRename?.(value.trim());
  };

  // Only on genuinely empty space — an item, button, image or other
  // interactive element between the click and the section swallows it.
  const handleContextMenu = (event: ReactMouseEvent) => {
    if (!onRequestMenu) return;
    const blocked = (event.target as HTMLElement).closest(
      'button, input, textarea, a, img, [draggable="true"], li, figure, [role="button"]',
    );
    if (blocked) return;
    event.preventDefault();
    onRequestMenu(event.clientX, event.clientY);
  };

  return (
    <section
      aria-label={title}
      onClick={onSelect}
      onContextMenu={handleContextMenu}
      {...dropProps}
      className={[
        'group/panel rounded-xl bg-white p-5 transition-all duration-500 dark:bg-gray-800',
        isDropTarget
          ? 'shadow-[0_0_0_2px_rgb(59_130_246_/_0.7)] ring-4 ring-blue-500/15'
          : isSpotlit
            ? 'shadow-[0_0_0_2px_rgb(59_130_246_/_0.4),0_10px_30px_-10px_rgb(59_130_246_/_0.5)]'
            : 'shadow-sm',
        isDimmed ? 'pointer-events-none opacity-30 blur-[1px]' : 'opacity-100',
        onSelect ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="relative flex min-w-0 items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {onIconChange ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsPickingIcon((value) => !value);
              }}
              className="shrink-0 rounded p-0.5 text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/40"
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          ) : (
            <Icon className="h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" aria-hidden />
          )}

          {isPickingIcon && onIconChange && (
            <IconPicker
              onPick={(key) => {
                onIconChange(key);
                setIsPickingIcon(false);
              }}
              onClose={() => setIsPickingIcon(false)}
            />
          )}

          {isEditingTitle && onRename ? (
            <input
              type="text"
              defaultValue={title}
              autoFocus
              onClick={(event) => event.stopPropagation()}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => commitRename(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitRename(event.currentTarget.value);
                if (event.key === 'Escape') setIsEditingTitle(false);
              }}
              className="min-w-0 flex-1 rounded bg-transparent px-1 -mx-1 outline-none ring-2 ring-blue-500/40"
            />
          ) : (
            <span
              className={onRename ? 'truncate rounded px-1 -mx-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700' : 'truncate'}
              onClick={
                onRename
                  ? (event) => {
                      event.stopPropagation();
                      setIsEditingTitle(true);
                    }
                  : undefined
              }
            >
              {title}
            </span>
          )}
        </h2>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/panel:opacity-100 group-focus-within/panel:opacity-100">
          {onFocusHere && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onFocusHere();
              }}
              aria-label={focusLabel ?? title}
              title={focusLabel ?? title}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <FocusPlay className="h-4 w-4" aria-hidden />
            </button>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
              aria-label={addLabel ?? title}
              title={addLabel ?? title}
              className="rounded-full p-1.5 text-blue-500 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/40"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
