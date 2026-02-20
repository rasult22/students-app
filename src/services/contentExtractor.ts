import { analyzeImages } from './openai/client';

// CORS proxy для обхода ограничений браузера
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Извлекает текст из PDF файла с помощью GPT-4 Vision
 * Конвертирует страницы PDF в изображения и отправляет на анализ
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  // Динамический импорт pdfjs для конвертации PDF в изображения
  const pdfjsLib = await import('pdfjs-dist');

  // Устанавливаем worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = Math.min(pdf.numPages, 20); // Лимит 20 страниц
  const extractedTexts: string[] = [];

  // Обрабатываем страницы батчами по 4 (лимит Vision API)
  const batchSize = 4;

  for (let startPage = 1; startPage <= totalPages; startPage += batchSize) {
    const endPage = Math.min(startPage + batchSize - 1, totalPages);
    const pageImages: string[] = [];

    // Рендерим страницы в изображения
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      onProgress?.(pageNum, totalPages);

      const page = await pdf.getPage(pageNum);
      const scale = 2; // Для лучшего качества OCR
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (page.render as any)({
        canvasContext: context,
        viewport,
      }).promise;

      // Конвертируем в base64 PNG
      const base64 = canvas.toDataURL('image/png');
      pageImages.push(base64);
    }

    // Отправляем батч изображений в Vision API
    const prompt = `Извлеки весь текст с этих страниц документа.
Сохрани структуру: заголовки, параграфы, списки, формулы.
Формулы записывай в формате LaTeX (например: $E = mc^2$).
Отвечай только извлечённым текстом, без пояснений.`;

    const batchText = await analyzeImages(pageImages, prompt, { maxTokens: 4000 });
    extractedTexts.push(batchText);
  }

  return extractedTexts.join('\n\n---\n\n');
}

/**
 * Извлекает текст из веб-страницы по URL
 */
export async function extractTextFromURL(url: string): Promise<string> {
  // Валидация URL
  try {
    new URL(url);
  } catch {
    throw new Error('Некорректный URL');
  }

  // Используем CORS proxy
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу: ${response.status}`);
  }

  const html = await response.text();

  // Парсим HTML и извлекаем текст
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Удаляем ненужные элементы
  const selectorsToRemove = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    'iframe',
    'noscript',
    '.advertisement',
    '.ads',
    '.sidebar',
    '.comments',
  ];

  selectorsToRemove.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Извлекаем основной контент
  // Пробуем найти main или article, иначе берём body
  const mainContent = doc.querySelector('main') ||
                      doc.querySelector('article') ||
                      doc.querySelector('.content') ||
                      doc.querySelector('#content') ||
                      doc.body;

  if (!mainContent) {
    throw new Error('Не удалось извлечь контент со страницы');
  }

  // Получаем текст с сохранением базовой структуры
  const text = extractTextWithStructure(mainContent);

  return normalizeText(text);
}

/**
 * Извлекает текст с сохранением структуры (заголовки, параграфы)
 */
function extractTextWithStructure(element: Element): string {
  const lines: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        lines.push(text);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      // Добавляем разделители для блочных элементов
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        lines.push('');
        const level = parseInt(tagName[1]);
        const prefix = '#'.repeat(level) + ' ';
        lines.push(prefix + el.textContent?.trim());
        lines.push('');
      } else if (['p', 'div', 'section', 'article'].includes(tagName)) {
        lines.push('');
        el.childNodes.forEach(walk);
        lines.push('');
      } else if (tagName === 'li') {
        lines.push('• ' + el.textContent?.trim());
      } else if (tagName === 'br') {
        lines.push('');
      } else {
        el.childNodes.forEach(walk);
      }
    }
  };

  walk(element);

  return lines.join('\n');
}

/**
 * Нормализует текст: удаляет лишние пробелы и пустые строки
 */
export function normalizeText(text: string): string {
  return text
    // Заменяем множественные пробелы на один
    .replace(/[ \t]+/g, ' ')
    // Заменяем множественные переносы строк на двойной
    .replace(/\n{3,}/g, '\n\n')
    // Удаляем пробелы в начале и конце строк
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Удаляем пробелы в начале и конце текста
    .trim();
}

/**
 * Определяет тип материала по содержимому
 */
export function detectContentType(text: string): 'academic' | 'article' | 'notes' | 'unknown' {
  const lowerText = text.toLowerCase();

  // Признаки академического текста
  const academicPatterns = [
    /глава\s+\d/i,
    /параграф\s+\d/i,
    /теорема\s+\d/i,
    /определение\s+\d/i,
    /доказательство/i,
    /следствие/i,
    /лемма/i,
  ];

  // Признаки статьи
  const articlePatterns = [
    /введение/i,
    /заключение/i,
    /автор:/i,
    /источник:/i,
  ];

  const academicScore = academicPatterns.filter((p) => p.test(lowerText)).length;
  const articleScore = articlePatterns.filter((p) => p.test(lowerText)).length;

  if (academicScore >= 2) return 'academic';
  if (articleScore >= 2) return 'article';
  if (text.length < 1000) return 'notes';

  return 'unknown';
}
