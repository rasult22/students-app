import type { Interest } from '../types';

export const availableInterests: Interest[] = [
  // Sports
  { id: 'football', name: 'Футбол', icon: 'circle-dot', category: 'sports' },
  { id: 'basketball', name: 'Баскетбол', icon: 'circle', category: 'sports' },
  { id: 'tennis', name: 'Теннис', icon: 'target', category: 'sports' },
  { id: 'swimming', name: 'Плавание', icon: 'waves', category: 'sports' },
  { id: 'cycling', name: 'Велоспорт', icon: 'bike', category: 'sports' },
  { id: 'fitness', name: 'Фитнес', icon: 'dumbbell', category: 'sports' },

  // Music
  { id: 'guitar', name: 'Гитара', icon: 'guitar', category: 'music' },
  { id: 'piano', name: 'Пианино', icon: 'piano', category: 'music' },
  { id: 'singing', name: 'Вокал', icon: 'mic', category: 'music' },
  { id: 'dj', name: 'DJ / Электроника', icon: 'headphones', category: 'music' },
  { id: 'classical', name: 'Классическая музыка', icon: 'music', category: 'music' },

  // Art
  { id: 'painting', name: 'Живопись', icon: 'palette', category: 'art' },
  { id: 'photography', name: 'Фотография', icon: 'camera', category: 'art' },
  { id: 'design', name: 'Дизайн', icon: 'pencil', category: 'art' },
  { id: 'sculpture', name: 'Скульптура', icon: 'box', category: 'art' },
  { id: 'cinema', name: 'Кино', icon: 'clapperboard', category: 'art' },

  // Gaming
  { id: 'videogames', name: 'Видеоигры', icon: 'gamepad-2', category: 'gaming' },
  { id: 'boardgames', name: 'Настольные игры', icon: 'dices', category: 'gaming' },
  { id: 'chess', name: 'Шахматы', icon: 'crown', category: 'gaming' },
  { id: 'esports', name: 'Киберспорт', icon: 'trophy', category: 'gaming' },

  // Science
  { id: 'astronomy', name: 'Астрономия', icon: 'telescope', category: 'science' },
  { id: 'physics', name: 'Физика', icon: 'atom', category: 'science' },
  { id: 'chemistry', name: 'Химия', icon: 'flask-conical', category: 'science' },
  { id: 'biology', name: 'Биология', icon: 'dna', category: 'science' },
  { id: 'math', name: 'Математика', icon: 'ruler', category: 'science' },

  // Technology
  { id: 'programming', name: 'Программирование', icon: 'laptop', category: 'technology' },
  { id: 'robotics', name: 'Робототехника', icon: 'bot', category: 'technology' },
  { id: 'ai', name: 'Искусственный интеллект', icon: 'brain', category: 'technology' },
  { id: 'gadgets', name: 'Гаджеты', icon: 'smartphone', category: 'technology' },

  // Nature
  { id: 'hiking', name: 'Походы', icon: 'mountain', category: 'nature' },
  { id: 'gardening', name: 'Садоводство', icon: 'sprout', category: 'nature' },
  { id: 'animals', name: 'Животные', icon: 'paw-print', category: 'nature' },
  { id: 'ecology', name: 'Экология', icon: 'globe', category: 'nature' },

  // Travel
  { id: 'travel', name: 'Путешествия', icon: 'plane', category: 'travel' },
  { id: 'languages', name: 'Иностранные языки', icon: 'languages', category: 'travel' },
  { id: 'cultures', name: 'Культуры мира', icon: 'earth', category: 'travel' },

  // Food
  { id: 'cooking', name: 'Кулинария', icon: 'chef-hat', category: 'food' },
  { id: 'baking', name: 'Выпечка', icon: 'croissant', category: 'food' },
  { id: 'coffee', name: 'Кофе', icon: 'coffee', category: 'food' },

  // Books
  { id: 'fiction', name: 'Художественная литература', icon: 'book-open', category: 'books' },
  { id: 'scifi', name: 'Научная фантастика', icon: 'rocket', category: 'books' },
  { id: 'history', name: 'История', icon: 'scroll', category: 'books' },
  { id: 'philosophy', name: 'Философия', icon: 'message-circle', category: 'books' },
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
