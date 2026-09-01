/** Top-right controls: focus mode, sample content, and theme. */
import { Focus, Moon, Pause, Play, Sun, Wand2 } from 'lucide-react';

interface ToolbarProps {
  isFocusMode: boolean;
  isPaused: boolean;
  focusDelayMs: number;
  darkMode: boolean;
  onToggleFocus: () => void;
  onTogglePause: () => void;
  onFocusDelayChange: (ms: number) => void;
  onFillSample: () => void;
  onToggleTheme: () => void;
}

const iconButton =
  'grid h-10 w-10 place-items-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700';

export function Toolbar({
  isFocusMode,
  isPaused,
  focusDelayMs,
  darkMode,
  onToggleFocus,
  onTogglePause,
  onFocusDelayChange,
  onFillSample,
  onToggleTheme,
}: ToolbarProps) {
  return (
    <div className="fixed right-5 top-4 z-50 flex items-center gap-2">
      {isFocusMode && (
        <>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-md dark:bg-gray-800">
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={focusDelayMs}
              onChange={(event) => onFocusDelayChange(Number(event.target.value))}
              aria-label="Seconds per panel"
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
            />
            <span className="min-w-[3ch] text-xs tabular-nums text-gray-600 dark:text-gray-300">
              {(focusDelayMs / 1000).toFixed(focusDelayMs % 1000 === 0 ? 0 : 1)}s
            </span>
          </div>

          <button
            type="button"
            onClick={onTogglePause}
            className={`${iconButton} ${isPaused ? 'text-green-500' : 'text-amber-500'}`}
            aria-label={isPaused ? 'Resume cycling' : 'Pause cycling'}
            title={isPaused ? 'Resume cycling' : 'Pause cycling'}
          >
            {isPaused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onToggleFocus}
        aria-pressed={isFocusMode}
        title="Focus mode — spotlight one panel at a time (Esc to exit)"
        className={`${iconButton} ${isFocusMode ? 'text-blue-500 ring-2 ring-blue-500/50' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <Focus className="h-5 w-5" aria-hidden />
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
