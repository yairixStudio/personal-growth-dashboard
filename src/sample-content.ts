/** Placeholder content for the "fill with sample" button. Deliberately generic. */
import { newId } from './lib/id';
import { emptyLists, type Item, type Lists } from './types';

const toItems = (texts: string[]): Item[] => texts.map((text) => ({ id: newId(), text }));

export function sampleLists(): Lists {
  return {
    ...emptyLists(),
    goals: toItems([
      'Start a morning routine',
      'Read 12 books this year',
      'Learn a new skill',
      'Exercise three times a week',
    ]),
    values: toItems(['Growth', 'Health', 'Family', 'Learning', 'Creativity']),
    strengths: toItems(['Creativity', 'Persistence', 'Problem solving', 'Adaptability']),
    gratitude: toItems([
      'Supportive family and friends',
      'Good health',
      'Opportunities to learn and grow',
      'A peaceful place to work',
    ]),
    affirmations: toItems([
      'I am constantly growing and improving',
      'I create positive impact in everything I do',
      'Every challenge is an opportunity to learn',
    ]),
    quotes: toItems([
      '"The only way to do great work is to love what you do" — Steve Jobs',
      '"Success is not final, failure is not fatal" — Winston Churchill',
      '"Start where you are. Use what you have" — Arthur Ashe',
    ]),
  };
}
