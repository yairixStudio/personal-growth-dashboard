/** Language, appearance, background and focus-mode timing. */
import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Plus, Printer, Trash2, Wand2, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../i18n/strings';
import type { CustomPanel, Settings } from '../types';
import { backgroundUrl } from './BackgroundLayer';

interface SettingsDialogProps {
  settings: Settings;
  customPanels: CustomPanel[];
  /** Built-in sections removed from this workspace via the canvas's right-click
   *  menu — listed here so deleting one stays reversible. */
  hiddenFixedPanels: { key: string; title: string }[];
  onLanguageChange: (value: Language) => void;
  onDarkModeChange: (value: boolean) => void;
  onFocusDelayChange: (ms: number) => void;
  onBackgroundChange: (file: string | null) => void;
  onOverlayChange: (value: number) => void;
  onAddCustomPanel: (name: string) => void;
  onRemoveCustomPanel: (id: string) => void;
  onRestoreFixedPanel: (id: string) => void;
  onFillSample: () => void;
  onPrint: () => void;
  onClose: () => void;
}

const TABS = ['general', 'display', 'panels'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL_KEYS = {
  general: 'settings.tabGeneral',
  display: 'settings.tabDisplay',
  panels: 'settings.tabPanels',
} as const;

export function SettingsDialog({
  settings,
  customPanels,
  hiddenFixedPanels,
  onLanguageChange,
  onDarkModeChange,
  onFocusDelayChange,
  onBackgroundChange,
  onOverlayChange,
  onAddCustomPanel,
  onRemoveCustomPanel,
  onRestoreFixedPanel,
  onFillSample,
  onPrint,
  onClose,
}: SettingsDialogProps) {
  const { t } = useI18n();
  const [draftName, setDraftName] = useState('');
  const [tab, setTab] = useState<Tab>('general');

  const commitAddPanel = () => {
    const name = draftName.trim();
    if (name) onAddCustomPanel(name);
    setDraftName('');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const chooseBackground = useCallback(async () => {
    try {
      const file = await window.desktop.chooseBackground();
      if (file) onBackgroundChange(file);
    } catch (error) {
      console.error('Could not set the background.', error);
    }
  }, [onBackgroundChange]);

  const clearBackground = useCallback(() => {
    const previous = settings.background.file;
    onBackgroundChange(null);
    if (previous) void window.desktop.removeBackground(previous);
  }, [onBackgroundChange, settings.background.file]);

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
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-800"
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

        <div role="tablist" className="mb-5 flex gap-1 border-b border-gray-100 dark:border-gray-700">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t(TAB_LABEL_KEYS[id])}
            </button>
          ))}
        </div>

        {tab === 'general' && (
        <>
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
          <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.print')}</h3>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('settings.printHint')}</p>
          <button type="button" onClick={onPrint} className={`flex items-center gap-1.5 ${choice(false)}`}>
            <Printer className="h-4 w-4" aria-hidden />
            {t('settings.printButton')}
          </button>
        </section>
        </>
        )}

        {tab === 'display' && (
        <>
        <section className="mb-5">
          <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.background')}</h3>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('settings.backgroundHint')}</p>

          {settings.background.file ? (
            <div className="flex items-center gap-3">
              <img
                src={backgroundUrl(settings.background.file)}
                alt=""
                className="h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600"
              />
              <div className="flex flex-1 flex-wrap gap-2">
                <button type="button" onClick={() => void chooseBackground()} className={choice(false)}>
                  {t('settings.backgroundReplace')}
                </button>
                <button
                  type="button"
                  onClick={clearBackground}
                  className="rounded-lg border border-transparent px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/40"
                >
                  <Trash2 className="me-1 inline h-4 w-4" aria-hidden />
                  {t('settings.backgroundRemove')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void chooseBackground()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-600 dark:text-gray-400"
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              {t('settings.backgroundChoose')}
            </button>
          )}

          {settings.background.file && (
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                {settings.darkMode ? t('settings.overlayDark') : t('settings.overlayLight')}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={settings.background.overlay}
                  onChange={(event) => onOverlayChange(Number(event.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
                />
                <span className="min-w-[4ch] text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {Math.round(settings.background.overlay * 100)}%
                </span>
              </div>
            </label>
          )}
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
        </>
        )}

        {tab === 'panels' && (
        <>
        <section className="mb-5">
          <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.customPanels')}</h3>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('settings.customPanelsHint')}</p>

          {customPanels.length > 0 && (
            <ul className="mb-2 space-y-1">
              {customPanels.map((panel) => (
                <li
                  key={panel.id}
                  className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                >
                  <span className="min-w-0 flex-1 truncate">{panel.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveCustomPanel(panel.id)}
                    aria-label={t('settings.customPanelDelete', { name: panel.name })}
                    className="rounded p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-900/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-1.5">
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitAddPanel();
              }}
              placeholder={t('settings.customPanelNamePlaceholder')}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={commitAddPanel}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 text-sm text-white transition-colors hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('settings.customPanelAdd')}
            </button>
          </div>
        </section>

        {hiddenFixedPanels.length > 0 && (
          <section className="mb-5">
            <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.hiddenPanels')}</h3>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('settings.hiddenPanelsHint')}</p>
            <ul className="space-y-1">
              {hiddenFixedPanels.map((panel) => (
                <li
                  key={panel.key}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
                >
                  <span className="min-w-0 flex-1 truncate">{panel.title}</span>
                  <button
                    type="button"
                    onClick={() => onRestoreFixedPanel(panel.key)}
                    className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300"
                  >
                    {t('settings.restore')}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('settings.data')}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('settings.dataHint')}</p>
          <button
            type="button"
            onClick={onFillSample}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-purple-600 transition-colors hover:bg-purple-50 dark:border-gray-600 dark:text-purple-300 dark:hover:bg-purple-900/30"
          >
            <Wand2 className="h-4 w-4" aria-hidden />
            {t('toolbar.sample')}
          </button>
        </section>
        </>
        )}

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
