import Store from 'electron-store';

interface StoreData {
  workspaces: {
    [key: string]: {
      goals: string[];
      values: string[];
      affirmations: string[];
      quotes: string[];
      videos: { title: string; url: string; }[];
      strengths: string[];
      gratitude: string[];
    };
  };
  isDarkMode: boolean;
  currentWorkspace: string;
}

const defaultData: StoreData = {
  workspaces: {
    'Main': {
      goals: ['Start a morning routine', 'Read 12 books this year'],
      values: ['Growth', 'Health', 'Family', 'Learning'],
      affirmations: ['I am constantly growing and improving', 'I create positive impact'],
      quotes: [
        '"The only way to do great work is to love what you do" - Steve Jobs',
        '"Success is not final, failure is not fatal" - Winston Churchill'
      ],
      videos: [],
      strengths: ['Creativity', 'Persistence', 'Empathy'],
      gratitude: ['My supportive family', 'Good health', 'Opportunities to learn']
    },
    'Personal Projects': {
      goals: ['Launch my blog', 'Learn a new language'],
      values: ['Creativity', 'Innovation', 'Freedom'],
      affirmations: ['I am capable of achieving my dreams', 'Every day I get better'],
      quotes: [
        '"Done is better than perfect" - Mark Zuckerberg',
        '"Start where you are. Use what you have" - Arthur Ashe'
      ],
      videos: [],
      strengths: ['Problem solving', 'Focus', 'Adaptability'],
      gratitude: ['My mentors', 'Access to education', 'Peaceful environment']
    }
  },
  isDarkMode: false,
  currentWorkspace: 'Main'
};

const electronStore = new Store<StoreData>();

if (!electronStore.has('workspaces')) {
  electronStore.set(defaultData);
}

export const store = {
  get: <K extends keyof StoreData>(key: K): StoreData[K] => {
    const value = electronStore.get(key);
    if (!value || (key === 'workspaces' && Object.keys(value).length === 0)) {
      return defaultData[key];
    }
    return value;
  },
  set: <K extends keyof StoreData>(key: K, value: StoreData[K]): void => {
    electronStore.set(key, value);
  }
}; 