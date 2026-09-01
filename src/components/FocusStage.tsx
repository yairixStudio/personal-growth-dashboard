/**
 * Focus mode as a stage rather than a highlight.
 *
 * The grid is replaced entirely, so the panel in focus sits in the true centre
 * of the screen at a readable size — the point of the mode. Only one panel is
 * mounted at a time, which also keeps a single Droppable of any given id alive.
 */
import { useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react';

interface FocusStageProps {
  index: number;
  total: number;
  label: string;
  isPaused: boolean;
  isFullscreen: boolean;
  delayMs: number;
  onPrev: () => void;
  onNext: () => void;
  onGo: (index: number) => void;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  onExit: () => void;
  onDelayChange: (ms: number) => void;
  children: ReactNode;
}

const control =
  'grid h-10 w-10 place-items-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800';

export function FocusStage({
  index,
  total,
  label,
  isPaused,
  isFullscreen,
  delayMs,
  onPrev,
  onNext,
  onGo,
  onTogglePause,
  onToggleFullscreen,
  onExit,
  onDelayChange,
  children,
}: FocusStageProps) {
  // Arrow keys step through panels; space pauses. Ignored while typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches('input, textarea, [contenteditable="true"]');
      if (typing) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
      } else if (event.key === ' ') {
        event.preventDefault();
        onTogglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onNext, onPrev, onTogglePause]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label} · {index + 1}/{total}
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm backdrop-blur dark:bg-gray-800/80">
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={delayMs}
              onChange={(event) => onDelayChange(Number(event.target.value))}
              aria-label="Seconds per panel"
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
            />
            <span className="min-w-[3ch] text-xs tabular-nums text-gray-600 dark:text-gray-300">
              {(delayMs / 1000).toFixed(delayMs % 1000 === 0 ? 0 : 1)}s
            </span>
          </div>

          <button type="button" onClick={onTogglePause} className={control} aria-label={isPaused ? 'Resume' : 'Pause'} title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}>
            {isPaused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className={control}
            aria-label={isFullscreen ? 'Leave fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Leave fullscreen (F11)' : 'Fullscreen (F11)'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          </button>

          <button type="button" onClick={onExit} className={control} aria-label="Exit focus mode" title="Exit focus mode (Esc)">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* The stage itself — the panel is centred on both axes. */}
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 px-4 pb-2">
        <button type="button" onClick={onPrev} className={`${control} shrink-0`} aria-label="Previous panel" title="Previous (←)">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        {/* Scaled up for reading at a distance — this mode is meant to be projected. */}
        <div className="flex max-h-full w-full max-w-3xl justify-center overflow-y-auto">
          <div className="w-full [&>section]:p-8 [&_h2]:text-3xl [&_h2_svg]:h-8 [&_h2_svg]:w-8 [&_input]:text-lg [&_li_button]:text-xl [&_li_button]:py-1.5 [&_p]:text-lg">
            {children}
          </div>
        </div>

        <button type="button" onClick={onNext} className={`${control} shrink-0`} aria-label="Next panel" title="Next (→)">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pb-5 pt-2">
        {Array.from({ length: total }, (_, dot) => (
          <button
            key={dot}
            type="button"
            onClick={() => onGo(dot)}
            aria-label={`Go to panel ${dot + 1}`}
            aria-current={dot === index}
            className={`h-2 rounded-full transition-all ${
              dot === index ? 'w-6 bg-blue-500' : 'w-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
