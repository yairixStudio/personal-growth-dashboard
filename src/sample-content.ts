/** Placeholder content for the "fill with sample" button. Deliberately generic,
 *  and written per language rather than machine-translated at runtime. */
import type { Language } from './i18n/strings';
import { newId } from './lib/id';
import { emptyLists, type Item, type Lists } from './types';

const toItems = (texts: string[]): Item[] => texts.map((text) => ({ id: newId(), text }));

const SAMPLES: Record<Language, Record<'goals' | 'values' | 'strengths' | 'gratitude' | 'affirmations' | 'quotes', string[]>> = {
  en: {
    goals: ['Start a morning routine', 'Read 12 books this year', 'Learn a new skill', 'Exercise three times a week'],
    values: ['Growth', 'Health', 'Family', 'Learning', 'Creativity'],
    strengths: ['Creativity', 'Persistence', 'Problem solving', 'Adaptability'],
    gratitude: ['Supportive family and friends', 'Good health', 'Opportunities to learn and grow', 'A peaceful place to work'],
    affirmations: [
      'I am constantly growing and improving',
      'I create positive impact in everything I do',
      'Every challenge is an opportunity to learn',
    ],
    quotes: [
      '"The only way to do great work is to love what you do" — Steve Jobs',
      '"Success is not final, failure is not fatal" — Winston Churchill',
      '"Start where you are. Use what you have" — Arthur Ashe',
    ],
  },
  he: {
    goals: ['להתחיל שגרת בוקר', 'לקרוא 12 ספרים השנה', 'ללמוד מיומנות חדשה', 'להתאמן שלוש פעמים בשבוע'],
    values: ['צמיחה', 'בריאות', 'משפחה', 'למידה', 'יצירתיות'],
    strengths: ['יצירתיות', 'התמדה', 'פתרון בעיות', 'גמישות'],
    gratitude: ['משפחה וחברים תומכים', 'בריאות טובה', 'הזדמנויות ללמוד ולצמוח', 'מקום שקט לעבוד בו'],
    affirmations: ['אני צומח ומשתפר כל הזמן', 'אני יוצר השפעה חיובית בכל מה שאני עושה', 'כל אתגר הוא הזדמנות ללמוד'],
    quotes: [
      '"הדרך היחידה לעשות עבודה נהדרת היא לאהוב את מה שאתה עושה" — סטיב ג׳ובס',
      '"הצלחה אינה סופית, כישלון אינו קטלני" — וינסטון צ׳רצ׳יל',
      '"התחל מהמקום שבו אתה נמצא. השתמש במה שיש לך" — ארתור אש',
    ],
  },
};

export function sampleLists(lang: Language): Lists {
  const source = SAMPLES[lang] ?? SAMPLES.en;
  return {
    ...emptyLists(),
    goals: toItems(source.goals),
    values: toItems(source.values),
    strengths: toItems(source.strengths),
    gratitude: toItems(source.gratitude),
    affirmations: toItems(source.affirmations),
    quotes: toItems(source.quotes),
  };
}
