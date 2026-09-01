/** Top-right controls: focus mode, fullscreen, sample content, and theme. */
import { Focus, Maximize2, Minimize2, Moon, Settings, Sun, Wand2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface ToolbarProps {
  isFullscreen: boolean;
  darkMode: boolean;
  onEnterFocus: () => void;
  onToggleFullscreen: () => void;
  onFillSample: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
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
  onOpenSettings,
}: ToolbarProps) {
  const { t } = useI18n();
  return (
    <div className="fixed end-5 top-4 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={onEnterFocus}
        title={t('toolbar.focus')}
        aria-label={t('toolbar.focusLabel')}
        className={`${iconButton} text-gray-500 dark:text-gray-400`}
      >
        <Focus className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={isFullscreen}
        title={isFullscreen ? t('toolbar.fullscreenOff') : t('toolbar.fullscreenOn')}
        aria-label={isFullscreen ? t('toolbar.fullscreenOff') : t('toolbar.fullscreenOn')}
        className={`${iconButton} ${isFullscreen ? 'text-blue-500 ring-2 ring-blue-500/50' : 'text-gray-500 dark:text-gray-400'}`}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" aria-hidden /> : <Maximize2 className="h-5 w-5" aria-hidden />}
      </button>

      <button
        type="button"
        onClick={onFillSample}
        title={t('toolbar.sample')}
        aria-label={t('toolbar.sample')}
        className={`${iconButton} text-purple-500 dark:text-purple-400`}
      >
        <Wand2 className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onToggleTheme}
        title={darkMode ? t('toolbar.toLight') : t('toolbar.toDark')}
        aria-label={darkMode ? t('toolbar.toLight') : t('toolbar.toDark')}
        className={iconButton}
      >
        {darkMode ? <Sun className="h-5 w-5 text-amber-400" aria-hidden /> : <Moon className="h-5 w-5 text-blue-500" aria-hidden />}
      </button>

      <button
        type="button"
        onClick={onOpenSettings}
        title={t('toolbar.settings')}
        aria-label={t('toolbar.settings')}
        className={`${iconButton} text-gray-500 dark:text-gray-400`}
      >
        <Settings className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
