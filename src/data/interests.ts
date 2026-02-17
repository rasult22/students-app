import type { Interest } from '../types';

export const availableInterests: Interest[] = [
  // Sports
  { id: 'football', name: 'Футбол', icon: '⚽', category: 'sports' },
  { id: 'basketball', name: 'Баскетбол', icon: '🏀', category: 'sports' },
  { id: 'tennis', name: 'Теннис', icon: '🎾', category: 'sports' },
  { id: 'swimming', name: 'Плавание', icon: '🏊', category: 'sports' },
  { id: 'cycling', name: 'Велоспорт', icon: '🚴', category: 'sports' },
  { id: 'fitness', name: 'Фитнес', icon: '💪', category: 'sports' },

  // Music
  { id: 'guitar', name: 'Гитара', icon: '🎸', category: 'music' },
  { id: 'piano', name: 'Пианино', icon: '🎹', category: 'music' },
  { id: 'singing', name: 'Вокал', icon: '🎤', category: 'music' },
  { id: 'dj', name: 'DJ / Электроника', icon: '🎧', category: 'music' },
  { id: 'classical', name: 'Классическая музыка', icon: '🎻', category: 'music' },

  // Art
  { id: 'painting', name: 'Живопись', icon: '🎨', category: 'art' },
  { id: 'photography', name: 'Фотография', icon: '📷', category: 'art' },
  { id: 'design', name: 'Дизайн', icon: '✏️', category: 'art' },
  { id: 'sculpture', name: 'Скульптура', icon: '🗿', category: 'art' },
  { id: 'cinema', name: 'Кино', icon: '🎬', category: 'art' },

  // Gaming
  { id: 'videogames', name: 'Видеоигры', icon: '🎮', category: 'gaming' },
  { id: 'boardgames', name: 'Настольные игры', icon: '🎲', category: 'gaming' },
  { id: 'chess', name: 'Шахматы', icon: '♟️', category: 'gaming' },
  { id: 'esports', name: 'Киберспорт', icon: '🏆', category: 'gaming' },

  // Science
  { id: 'astronomy', name: 'Астрономия', icon: '🔭', category: 'science' },
  { id: 'physics', name: 'Физика', icon: '⚛️', category: 'science' },
  { id: 'chemistry', name: 'Химия', icon: '🧪', category: 'science' },
  { id: 'biology', name: 'Биология', icon: '🧬', category: 'science' },
  { id: 'math', name: 'Математика', icon: '📐', category: 'science' },

  // Technology
  { id: 'programming', name: 'Программирование', icon: '💻', category: 'technology' },
  { id: 'robotics', name: 'Робототехника', icon: '🤖', category: 'technology' },
  { id: 'ai', name: 'Искусственный интеллект', icon: '🧠', category: 'technology' },
  { id: 'gadgets', name: 'Гаджеты', icon: '📱', category: 'technology' },

  // Nature
  { id: 'hiking', name: 'Походы', icon: '🥾', category: 'nature' },
  { id: 'gardening', name: 'Садоводство', icon: '🌱', category: 'nature' },
  { id: 'animals', name: 'Животные', icon: '🐾', category: 'nature' },
  { id: 'ecology', name: 'Экология', icon: '🌍', category: 'nature' },

  // Travel
  { id: 'travel', name: 'Путешествия', icon: '✈️', category: 'travel' },
  { id: 'languages', name: 'Иностранные языки', icon: '🗣️', category: 'travel' },
  { id: 'cultures', name: 'Культуры мира', icon: '🌏', category: 'travel' },

  // Food
  { id: 'cooking', name: 'Кулинария', icon: '👨‍🍳', category: 'food' },
  { id: 'baking', name: 'Выпечка', icon: '🥐', category: 'food' },
  { id: 'coffee', name: 'Кофе', icon: '☕', category: 'food' },

  // Books
  { id: 'fiction', name: 'Художественная литература', icon: '📚', category: 'books' },
  { id: 'scifi', name: 'Научная фантастика', icon: '🚀', category: 'books' },
  { id: 'history', name: 'История', icon: '📜', category: 'books' },
  { id: 'philosophy', name: 'Философия', icon: '💭', category: 'books' },
];

export const interestCategories: Record<string, string> = {
  sports: 'Спорт',
  music: 'Музыка',
  art: 'Искусство',
  gaming: 'Игры',
  science: 'Наука',
  technology: 'Технологии',
  nature: 'Природа',
  travel: 'Путешествия',
  food: 'Еда',
  books: 'Книги',
};

export const getInterestsByCategory = (category: string): Interest[] => {
  return availableInterests.filter((i) => i.category === category);
};
