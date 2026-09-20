/** Top-right controls: focus mode, fullscreen, sample content, and theme. */
import { Maximize2, Minimize2, Settings, Wand2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { FocusPlay } from './icons/FocusPlay';

interface ToolbarProps {
  isFullscreen: boolean;
  /** The wand only shows up while the workspace has nothing in it — once
   *  there's real content, filling it with samples belongs in Settings. */
  isWorkspaceEmpty: boolean;
  onEnterFocus: () => void;
  onToggleFullscreen: () => void;
  onFillSample: () => void;
  onOpenSettings: () => void;
}

// Idle: bare icon on the page background, no chrome. Hover/focus: the same
// white pill the collapsed music player uses, so the whole app agrees on
// what "revealed chrome" looks like.
const iconButton =
  'grid h-10 w-10 place-items-center rounded-full opacity-50 backdrop-blur transition-all duration-200 hover:bg-white hover:opacity-100 hover:shadow-md focus-visible:opacity-100 focus-visible:bg-white focus-visible:shadow-md dark:hover:bg-gray-800 dark:focus-visible:bg-gray-800';

export function Toolbar({
  isFullscreen,
  isWorkspaceEmpty,
  onEnterFocus,
  onToggleFullscreen,
  onFillSample,
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
        <FocusPlay className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-pressed={isFullscreen}
        title={isFullscreen ? t('toolbar.fullscreenOff') : t('toolbar.fullscreenOn')}
        aria-label={isFullscreen ? t('toolbar.fullscreenOff') : t('toolbar.fullscreenOn')}
        className={`${iconButton} ${
          isFullscreen
            ? 'bg-white text-blue-500 opacity-100 shadow-md ring-2 ring-blue-500/50'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" aria-hidden /> : <Maximize2 className="h-5 w-5" aria-hidden />}
      </button>

      {isWorkspaceEmpty && (
        <button
          type="button"
          onClick={onFillSample}
          title={t('toolbar.sample')}
          aria-label={t('toolbar.sample')}
          className={`${iconButton} text-purple-500 dark:text-purple-400`}
        >
          <Wand2 className="h-5 w-5" aria-hidden />
        </button>
      )}

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
