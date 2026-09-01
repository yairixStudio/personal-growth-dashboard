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
    }
  },
  isDarkMode: false,
  currentWorkspace: 'Main'
};

class MockStore {
  private data: StoreData = defaultData;

  get<K extends keyof StoreData>(key: K): StoreData[K] {
    return this.data[key];
  }

  set<K extends keyof StoreData>(key: K, value: StoreData[K]): void {
    this.data[key] = value;
    // שמירה ב-localStorage בשביל לדמות שמירה
    localStorage.setItem('mock-store', JSON.stringify(this.data));
  }

  has(key: string): boolean {
    return key in this.data;
  }
}

export const store = {
  get: <K extends keyof StoreData>(key: K): StoreData[K] => {
    const stored = localStorage.getItem('mock-store');
    if (stored) {
      const data = JSON.parse(stored);
      return data[key];
    }
    return defaultData[key];
  },
  set: <K extends keyof StoreData>(key: K, value: StoreData[K]): void => {
    const stored = localStorage.getItem('mock-store');
    const data = stored ? JSON.parse(stored) : defaultData;
    data[key] = value;
    localStorage.setItem('mock-store', JSON.stringify(data));
  }
}; 