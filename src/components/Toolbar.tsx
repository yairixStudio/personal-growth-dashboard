/** Top-right controls: focus mode, fullscreen, sample content, and theme. */
import { Focus, Maximize2, Minimize2, Moon, Sun, Wand2 } from 'lucide-react';

interface ToolbarProps {
  isFullscreen: boolean;
  darkMode: boolean;
  onEnterFocus: () => void;
  onToggleFullscreen: () => void;
  onFillSample: () => void;
  onToggleTheme: () => void;
}

const iconButton =
  'grid h-10 w-10 place-items-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700';

export function Toolbar({
  isFullscreen,
  darkMode,
  onEnterFocus,
  onToggleFullscreen,
  onFillSample,
  onToggleTheme,
}: ToolbarProps) {
  return (
    <div className="fixed right-5 top-4 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={onEnterFocus}
        title="Focus mode — one panel at a time, centred on screen (F5 to start, Esc to exit)"
        aria-label="Enter focus mode"
        className={`${iconButton} text-gray-500 dark:text-gray-400`}
      >
        <Focus className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={isFullscreen}
        title={isFullscreen ? 'Leave fullscreen (F11)' : 'Fullscreen (F11)'}
        aria-label={isFullscreen ? 'Leave fullscreen' : 'Enter fullscreen'}
        className={`${iconButton} ${isFullscreen ? 'text-blue-500 ring-2 ring-blue-500/50' : 'text-gray-500 dark:text-gray-400'}`}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" aria-hidden /> : <Maximize2 className="h-5 w-5" aria-hidden />}
      </button>

      <button
        type="button"
        onClick={onFillSample}
        title="Fill this workspace with sample content"
        aria-label="Fill this workspace with sample content"
        className={`${iconButton} text-purple-500 dark:text-purple-400`}
      >
        <Wand2 className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onToggleTheme}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className={iconButton}
      >
        {darkMode ? <Sun className="h-5 w-5 text-amber-400" aria-hidden /> : <Moon className="h-5 w-5 text-blue-500" aria-hidden />}
      </button>
    </div>
  );
}
