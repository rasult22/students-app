import { generateJSON } from '../openai';
import { STRUCTURE_SYSTEM_PROMPT, buildStructureUserPrompt } from '../prompts';
import type { StructurePromptOptions } from '../prompts/structurePrompt';
import type { Subject, Section, Topic } from '../../types';

interface StructureGenerationResult {
  subject: {
    name: string;
    description: string;
    icon: string;
    color: string;
    estimatedHours: number;
    sections: Array<{
      name: string;
      description: string;
      order: number;
      topics: Array<{
        name: string;
        description: string;
        order: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        estimatedMinutes: number;
      }>;
    }>;
  };
}

export interface GenerateSubjectOptions extends StructurePromptOptions {
  /** Callback для отслеживания прогресса */
  onProgress?: (step: string) => void;
}

/**
 * Генерирует структуру курса из текстового материала
 */
export async function generateSubjectStructure(
  rawContent: string,
  options?: GenerateSubjectOptions
): Promise<Subject> {
  const { onProgress, ...promptOptions } = options || {};

  onProgress?.('Анализ материала...');
  const userPrompt = buildStructureUserPrompt(rawContent, promptOptions);

  onProgress?.('Генерация структуры курса...');
  const result = await generateJSON<StructureGenerationResult>(
    STRUCTURE_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.6, maxTokens: 4000 }
  );

  onProgress?.('Формирование курса...');

  // Генерируем уникальные ID
  const subjectId = generateSlug(result.subject.name);

  const sections: Section[] = result.subject.sections.map((section, sectionIndex) => {
    const sectionId = `${subjectId}-section-${sectionIndex + 1}`;

    const topics: Topic[] = section.topics.map((topic, topicIndex) => ({
      id: `${sectionId}-topic-${topicIndex + 1}`,
      sectionId,
      name: topic.name,
      description: topic.description,
      order: topic.order || topicIndex + 1,
      difficulty: topic.difficulty || 'intermediate',
      estimatedMinutes: topic.estimatedMinutes || 30,
    }));

    return {
      id: sectionId,
      subjectId,
      name: section.name,
      description: section.description,
      order: section.order || sectionIndex + 1,
      topics,
    };
  });

  const subject: Subject = {
    id: subjectId,
    name: result.subject.name,
    description: result.subject.description,
    icon: result.subject.icon || 'book',
    color: result.subject.color || '#60a5fa',
    estimatedHours: result.subject.estimatedHours || 40,
    sections,
  };

  return subject;
}

/**
 * Генерирует URL-friendly slug из строки
 */
function generateSlug(text: string): string {
  // Транслитерация русских букв
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}
