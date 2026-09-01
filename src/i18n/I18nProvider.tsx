/** Language, direction and the `t` lookup, shared by every component. */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DIRECTION, STRINGS, type Language, type StringKey } from './strings';

type Params = Record<string, string | number>;

interface I18nValue {
  lang: Language;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  t: (key: StringKey, params?: Params) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const table = STRINGS[lang];
    return {
      lang,
      dir: DIRECTION[lang],
      isRtl: DIRECTION[lang] === 'rtl',
      t: (key, params) => {
        const template = table[key] ?? key;
        if (!params) return template;
        return template.replace(/\{(\w+)\}/g, (match, name: string) =>
          name in params ? String(params[name]) : match,
        );
      },
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
