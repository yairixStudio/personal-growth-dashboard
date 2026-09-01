/**
 * Focus mode as a stage rather than a highlight.
 *
 * The grid is replaced entirely, so the panel in focus sits in the true centre
 * of the screen at a readable size — the point of the mode. Only one panel is
 * mounted at a time, which also keeps a single Droppable of any given id alive.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface FocusStageProps {
  index: number;
  total: number;
  label: string;
  /** Which way the last move went, so the panel slides in from the right side. */
  direction: 1 | -1;
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
  direction,
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
  const { t, isRtl } = useI18n();
  const [remaining, setRemaining] = useState(delayMs);
  const startedAt = useRef(Date.now());

  // Arrow keys step through panels; space pauses. Ignored while typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        (isRtl ? onPrev : onNext)();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        (isRtl ? onNext : onPrev)();
      } else if (event.key === ' ') {
        event.preventDefault();
        onTogglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRtl, onNext, onPrev, onTogglePause]);

  // A cheap ticker purely for the countdown text; the bar itself is pure CSS.
  useEffect(() => {
    startedAt.current = Date.now();
    setRemaining(delayMs);
    if (isPaused) return;
    const tick = window.setInterval(() => {
      setRemaining(Math.max(0, delayMs - (Date.now() - startedAt.current)));
    }, 100);
    return () => window.clearInterval(tick);
  }, [index, delayMs, isPaused]);

  const seconds = Math.max(1, Math.ceil(remaining / 1000));

  // "Next" enters from the right in LTR and from the left in RTL.
  const slide = (direction === 1) !== isRtl ? 'forward' : 'back';

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
      {/* Hairline progress: the only always-visible hint of how long is left. */}
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden" aria-hidden>
        {!isPaused && (
          <div
            key={`${index}-${delayMs}`}
            className="h-full w-full bg-blue-500/40"
            style={{
              transformOrigin: isRtl ? 'right center' : 'left center',
              animation: `focus-countdown ${delayMs}ms linear forwards`,
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <span className="flex items-baseline gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <span>
            {label} · {index + 1}/{total}
          </span>
          {!isPaused && (
            <span className="text-xs tabular-nums text-gray-400 opacity-60 dark:text-gray-500">
              {t('focus.remaining', { n: seconds })}
            </span>
          )}
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
              aria-label={t('focus.delay')}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
            />
            <span className="min-w-[3ch] text-xs tabular-nums text-gray-600 dark:text-gray-300">
              {(delayMs / 1000).toFixed(delayMs % 1000 === 0 ? 0 : 1)}s
            </span>
          </div>

          <button
            type="button"
            onClick={onTogglePause}
            className={control}
            aria-label={isPaused ? t('focus.resume') : t('focus.pause')}
            title={isPaused ? t('focus.resume') : t('focus.pause')}
          >
            {isPaused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className={control}
            aria-label={isFullscreen ? t('toolbar.fullscreenOff') : t('toolbar.fullscreenOn')}
            title={isFullscreen ? t('toolbar.fullscreenOff') : t('toolbar.fullscreenOn')}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          </button>

          <button type="button" onClick={onExit} className={control} aria-label={t('focus.exit')} title={t('focus.exit')}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* The stage itself — the panel is centred on both axes. */}
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 px-4 pb-2">
        <button type="button" onClick={onPrev} className={`${control} shrink-0`} aria-label={t('focus.prev')} title={t('focus.prev')}>
          {isRtl ? <ChevronRight className="h-5 w-5" aria-hidden /> : <ChevronLeft className="h-5 w-5" aria-hidden />}
        </button>

        <div className="flex max-h-full w-full max-w-3xl justify-center overflow-y-auto overflow-x-hidden">
          {/* Scaled up for reading at a distance — this mode is meant to be projected. */}
          <div
            key={index}
            className="w-full [&>section]:p-8 [&_h2]:text-3xl [&_h2_svg]:h-8 [&_h2_svg]:w-8 [&_input]:text-lg [&_li_button]:text-xl [&_li_button]:py-1.5 [&_p]:text-lg"
            style={{ animation: `focus-slide-${slide} 260ms cubic-bezier(0.22, 1, 0.36, 1)` }}
          >
            {children}
          </div>
        </div>

        <button type="button" onClick={onNext} className={`${control} shrink-0`} aria-label={t('focus.next')} title={t('focus.next')}>
          {isRtl ? <ChevronLeft className="h-5 w-5" aria-hidden /> : <ChevronRight className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pb-5 pt-2">
        {Array.from({ length: total }, (_, dot) => (
          <button
            key={dot}
            type="button"
            onClick={() => onGo(dot)}
            aria-label={t('focus.goTo', { n: dot + 1 })}
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
