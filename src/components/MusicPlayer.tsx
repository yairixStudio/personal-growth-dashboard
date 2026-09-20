/**
 * Binaural brainwave generator — presentational shell. The actual audio graph
 * lives in `useBrainwaves` (owned once, in `App.tsx`), so this component just
 * renders whatever state it's handed. That's what lets playback survive the
 * switch between normal view and focus mode instead of restarting.
 *
 * Opens on hover over the headphones icon, closes on leaving the whole
 * corner area (or Escape) — no click-to-toggle. A touch tap on the icon is
 * the fallback for devices without hover.
 */
import { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { BRAINWAVE_PRESETS, type Brainwaves } from '../state/useBrainwaves';

interface MusicPlayerProps extends Brainwaves {
  /** `minimal` is the focus-mode form: a single faint button that expands. */
  variant?: 'panel' | 'minimal';
}

export function MusicPlayer({
  variant = 'panel',
  preset,
  isPlaying,
  togglePlaying,
  presetId,
  setPresetId,
  volume,
  setVolume,
  withNoise,
  setWithNoise,
  failed,
}: MusicPlayerProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const minimal = variant === 'minimal';

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 end-5 z-40"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Collapsed: a faint dot, plus — while playing — a thin volume slider
          right beside it, both unobtrusive indicators rather than controls
          that demand a click. */}
      <div
        className={`flex items-center gap-2 transition-opacity duration-150 ${
          isOpen ? 'pointer-events-none absolute inset-0 opacity-0' : 'opacity-100'
        }`}
      >
        {isPlaying && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label={t('music.volume')}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-gray-300/50 opacity-60 accent-gray-400 transition-opacity hover:opacity-90 dark:bg-gray-600/50"
          />
        )}
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={t('music.open')}
          title={t('music.open')}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full backdrop-blur transition-all duration-200 hover:bg-white hover:opacity-100 hover:shadow-md dark:hover:bg-gray-800 ${
            isPlaying ? 'text-blue-500 opacity-60' : 'text-gray-400 opacity-25'
          }`}
        >
          <Headphones className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Expanded panel. */}
      <aside
        aria-label={t('music.title')}
        aria-hidden={!isOpen}
        className={`w-72 rounded-xl border p-3 backdrop-blur transition-opacity duration-150 ${
          isOpen ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0'
        } ${
          minimal
            ? 'border-gray-200/60 bg-white/80 shadow-md dark:border-gray-700/60 dark:bg-gray-800/80'
            : 'border-gray-200 bg-white/95 shadow-lg dark:border-gray-700 dark:bg-gray-800/95'
        }`}
      >
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <Headphones className="h-4 w-4 text-blue-500" aria-hidden />
          {t('music.title')}
        </h2>

        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1">
            {BRAINWAVE_PRESETS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setPresetId(entry.id)}
                title={t('music.beat', { description: t(entry.descriptionKey), hz: entry.beatHz })}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  entry.id === presetId
                    ? 'bg-blue-500 font-medium text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t(entry.nameKey)}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t('music.beat', { description: t(preset.descriptionKey), hz: preset.beatHz })}
          </p>

          {failed && <p className="text-center text-xs text-red-500">{t('music.failed')}</p>}

          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label={t('music.volume')}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
            />

            <button
              type="button"
              onClick={togglePlaying}
              aria-label={isPlaying ? t('music.pause') : t('music.play')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600"
            >
              {isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="ms-0.5 h-4 w-4" aria-hidden />}
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={withNoise}
              onChange={(event) => setWithNoise(event.target.checked)}
              className="accent-blue-500"
            />
            {t('music.noise')}
          </label>

          <p className="text-center text-[11px] leading-tight text-gray-400 dark:text-gray-500">
            {t('music.headphones')}
          </p>
        </div>
      </aside>
    </div>
  );
}
