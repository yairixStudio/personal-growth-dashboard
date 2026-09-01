/** The card shell every panel shares: header, add button, and focus-mode state. */
import type { ReactNode } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';

interface PanelProps {
  title: string;
  icon: LucideIcon;
  isDimmed: boolean;
  isSpotlit: boolean;
  onSelect?: () => void;
  onAdd?: () => void;
  addLabel?: string;
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
  isDropTarget = false,
  dropProps,
  children,
}: PanelProps) {
  return (
    <section
      aria-label={title}
      onClick={onSelect}
      {...dropProps}
      className={[
        'rounded-xl bg-white p-5 transition-all duration-500 dark:bg-gray-800',
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
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Icon className="h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" aria-hidden />
          <span className="truncate">{title}</span>
        </h2>
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
      </header>
      {children}
    </section>
  );
}
