/** Language, appearance and focus-mode timing. */
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../i18n/strings';
import type { Settings } from '../types';

interface SettingsDialogProps {
  settings: Settings;
  onLanguageChange: (value: Language) => void;
  onDarkModeChange: (value: boolean) => void;
  onFocusDelayChange: (ms: number) => void;
  onClose: () => void;
}

export function SettingsDialog({
  settings,
  onLanguageChange,
  onDarkModeChange,
  onFocusDelayChange,
  onClose,
}: SettingsDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const choice = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm transition-colors ${
      active
        ? 'border-blue-500 bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-800"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 id="settings-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('settings.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <section className="mb-5">
          <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.language')}</h3>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('settings.languageHint')}</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                lang={language}
                onClick={() => onLanguageChange(language)}
                aria-pressed={settings.language === language}
                className={choice(settings.language === language)}
              >
                {LANGUAGE_NAMES[language]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.appearance')}</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onDarkModeChange(false)} aria-pressed={!settings.darkMode} className={choice(!settings.darkMode)}>
              {t('settings.light')}
            </button>
            <button type="button" onClick={() => onDarkModeChange(true)} aria-pressed={settings.darkMode} className={choice(settings.darkMode)}>
              {t('settings.dark')}
            </button>
          </div>
        </section>

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.focus')}</h3>
          <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="min-w-0 flex-1">{t('settings.focusDelay')}</span>
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={settings.focusDelayMs}
              onChange={(event) => onFocusDelayChange(Number(event.target.value))}
              className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
            />
            <span className="min-w-[3ch] text-xs tabular-nums">
              {(settings.focusDelayMs / 1000).toFixed(settings.focusDelayMs % 1000 === 0 ? 0 : 1)}
            </span>
          </label>
        </section>

        <section className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.data')}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('settings.dataHint')}</p>
        </section>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
