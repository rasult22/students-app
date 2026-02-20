import type { MiniGameTemplate, MiniGameType } from '../types';

/**
 * Шаблоны мини-игр, привязанные к популярным интересам.
 * Каждая игра может адаптироваться под любую тему курса.
 */
export const miniGameTemplates: MiniGameTemplate[] = [
  {
    id: 'football-quiz',
    name: 'Пенальти',
    description: 'Забей гол, правильно ответив на вопрос! Каждый верный ответ — удар по воротам.',
    icon: 'circle-dot',
    interestId: 'football',
    mechanics: 'Игрок видит ворота с вратарём. Вопрос появляется как "мяч". 4 варианта ответа — направления удара. Правильный ответ = гол с анимацией. Неправильный = вратарь ловит мяч. Цель: забить 5 голов до 3 промахов.',
    minQuestions: 8,
  },
  {
    id: 'game-quest',
    name: 'Квест героя',
    description: 'Пройди RPG-квест, побеждая врагов знаниями! Каждый правильный ответ — атака.',
    icon: 'gamepad-2',
    interestId: 'videogames',
    mechanics: 'Пиксельный герой встречает врагов (монстров). Каждый враг задаёт вопрос. Правильный ответ = атака и урон врагу. Неправильный = враг атакует героя. У героя 3 жизни (сердечки). Цель: победить 5 врагов.',
    minQuestions: 8,
  },
  {
    id: 'movie-scenes',
    name: 'Режиссёр',
    description: 'Собери киносцену из правильных фактов! Каждый верный ответ добавляет элемент.',
    icon: 'clapperboard',
    interestId: 'cinema',
    mechanics: 'Пустая "сцена" (кадр фильма). Вопросы — это элементы сцены: персонаж, локация, действие, диалог, концовка. Правильные ответы добавляют элементы на сцену. Неправильные — помехи (шум, размытие). Цель: собрать полную сцену из 5 элементов.',
    minQuestions: 7,
  },
  {
    id: 'travel-adventure',
    name: 'Кругосветка',
    description: 'Путешествуй по карте, отвечая на вопросы! Каждый ответ — шаг к цели.',
    icon: 'plane',
    interestId: 'travel',
    mechanics: 'Карта с маршрутом из 5 точек. Самолётик на старте. Вопрос — препятствие на пути. Правильный ответ = перелёт к следующей точке. Неправильный = турбулентность (потеря топлива). 3 единицы топлива. Цель: долететь до финиша.',
    minQuestions: 7,
  },
  {
    id: 'cooking-recipe',
    name: 'Шеф-повар',
    description: 'Приготовь блюдо из правильных ингредиентов! Каждый ответ — ингредиент.',
    icon: 'chef-hat',
    interestId: 'cooking',
    mechanics: 'Пустая кастрюля/сковорода. Вопросы — выбор ингредиентов. Правильный ответ = ингредиент добавляется в блюдо. Неправильный = испорченный ингредиент (ухудшает блюдо). Цель: собрать 5 правильных ингредиентов до 3 испорченных.',
    minQuestions: 8,
  },
];

/**
 * Получить шаблон игры по типу
 */
export function getMiniGameTemplate(type: MiniGameType): MiniGameTemplate | undefined {
  return miniGameTemplates.find(g => g.id === type);
}

/**
 * Получить шаблон игры по ID интереса
 */
export function getMiniGameByInterest(interestId: string): MiniGameTemplate | undefined {
  return miniGameTemplates.find(g => g.interestId === interestId);
}

/**
 * Получить все доступные типы игр
 */
export function getAllMiniGameTypes(): MiniGameType[] {
  return miniGameTemplates.map(g => g.id);
}
