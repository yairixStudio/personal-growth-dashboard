/** Small popover grid for swapping a panel's icon. A full-screen backdrop
 *  behind the grid is what catches an outside click to close it. */
import { PANEL_ICONS, PANEL_ICON_KEYS } from '../lib/panelIcons';

interface IconPickerProps {
  onPick: (key: string) => void;
  onClose: () => void;
}

export function IconPicker({ onPick, onClose }: IconPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute start-0 top-full z-50 mt-1 grid w-56 grid-cols-6 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        onClick={(event) => event.stopPropagation()}
      >
        {PANEL_ICON_KEYS.map((key) => {
          const Icon = PANEL_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:text-gray-400 dark:hover:bg-blue-900/40"
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          );
        })}
      </div>
    </>
  );
}
