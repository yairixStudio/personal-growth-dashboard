/**
 * Focus mode as a stage rather than a highlight.
 *
 * The grid is replaced entirely, so the panel in focus sits in the true centre
 * of the screen at a readable size — the point of the mode. Only one panel is
 * mounted at a time, which also keeps a single Droppable of any given id alive.
 */
import { useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface FocusStageProps {
  index: number;
  total: number;
  label: string;
  /** Which way the last move went, so the panel slides in from that side. */
  direction: 1 | -1;
  isPaused: boolean;
  isFullscreen: boolean;
  /** Let the panel use the whole stage instead of the centred card column. */
  bleed: boolean;
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
  'grid h-10 w-10 place-items-center rounded-full bg-white/70 text-gray-500 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-gray-800 dark:bg-gray-800/70 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100';

export function FocusStage({
  index,
  total,
  label,
  direction,
  isPaused,
  isFullscreen,
  bleed,
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

  // "Next" enters from the right in LTR and from the left in RTL.
  const slide = (direction === 1) !== isRtl ? 'forward' : 'back';

  /** A thin edge strip: barely there until the pointer is near it. */
  const edgeButton = (side: 'start' | 'end', onClick: () => void, label: string, forward: boolean) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`group absolute inset-y-0 z-20 flex w-20 items-center justify-center focus:outline-none ${
        side === 'start' ? 'start-0' : 'end-0'
      }`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full text-gray-400 opacity-25 transition-all duration-200 group-hover:bg-white group-hover:text-gray-700 group-hover:opacity-100 group-hover:shadow-lg group-focus-visible:opacity-100 dark:group-hover:bg-gray-800 dark:group-hover:text-gray-100">
        {forward !== isRtl ? <ChevronRight className="h-6 w-6" aria-hidden /> : <ChevronLeft className="h-6 w-6" aria-hidden />}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label} · {index + 1}/{total}
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-sm backdrop-blur dark:bg-gray-800/70">
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
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2">
        {edgeButton('start', onPrev, t('focus.prev'), false)}

        <div
          className={`flex max-h-full justify-center overflow-y-auto overflow-x-hidden px-16 ${
            bleed ? 'w-full' : 'w-full max-w-3xl'
          }`}
        >
          {/* Scaled up for reading at a distance — this mode is meant to be projected. */}
          <div
            key={index}
            className={
              bleed
                ? 'w-full'
                : 'w-full [&>section]:p-8 [&_h2]:text-3xl [&_h2_svg]:h-8 [&_h2_svg]:w-8 [&_input]:text-lg [&_li_button]:text-xl [&_li_button]:py-1.5 [&_p]:text-lg'
            }
            style={{ animation: `focus-slide-${slide} 260ms cubic-bezier(0.22, 1, 0.36, 1)` }}
          >
            {children}
          </div>
        </div>

        {edgeButton('end', onNext, t('focus.next'), true)}
      </div>

      {/* Progress lives in the dots: the active one fills over the interval. */}
      <div className="flex items-center justify-center gap-2 pb-5 pt-2">
        {Array.from({ length: total }, (_, dot) => {
          const active = dot === index;
          return (
            <button
              key={dot}
              type="button"
              onClick={() => onGo(dot)}
              aria-label={t('focus.goTo', { n: dot + 1 })}
              aria-current={active}
              className="group py-1.5"
            >
              <span
                className={`block h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                  active
                    ? 'w-10 bg-gray-300/80 dark:bg-gray-600/80'
                    : 'w-1.5 bg-gray-300 group-hover:bg-gray-400 dark:bg-gray-600 dark:group-hover:bg-gray-500'
                }`}
              >
                {active &&
                  (isPaused ? (
                    <span className="block h-full w-full rounded-full bg-blue-500/70" />
                  ) : (
                    <span
                      key={`${index}-${delayMs}`}
                      className="block h-full rounded-full bg-blue-500"
                      style={{ animation: `dot-fill ${delayMs}ms linear forwards` }}
                    />
                  ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
