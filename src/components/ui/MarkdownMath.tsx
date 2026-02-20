import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Fragment, useMemo } from 'react';

interface MarkdownMathProps {
  children: string;
  className?: string;
}

type ContentPart =
  | { type: 'html'; content: string }
  | { type: 'inlineMath'; content: string }
  | { type: 'blockMath'; content: string };

/**
 * Компонент для рендеринга Markdown с LaTeX формулами
 *
 * Поддерживает:
 * - Markdown: заголовки, жирный, курсив, код, списки
 * - Inline формулы: $E = mc^2$ или \( E = mc^2 \)
 * - Block формулы: $$\int_0^\infty e^{-x^2} dx$$ или \[ \int_0^\infty e^{-x^2} dx \]
 * - Автоматическое определение LaTeX без $
 */
export function MarkdownMath({ children, className }: MarkdownMathProps) {
  const parts = useMemo(() => parseContent(autoWrapLatex(children)), [children]);

  return (
    <div className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.type === 'html' && (
            <span dangerouslySetInnerHTML={{ __html: part.content }} />
          )}
          {part.type === 'inlineMath' && <InlineMath math={part.content} />}
          {part.type === 'blockMath' && (
            <div style={{ margin: '1rem 0', textAlign: 'center' }}>
              <BlockMath math={part.content} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Автоматически оборачивает LaTeX команды в $...$ если они не обёрнуты
 * НЕ применяется если текст уже содержит $ или \( или \[
 */
function autoWrapLatex(text: string): string {
  // Если уже есть разметка формул — не трогаем
  if (text.includes('$') || /\\[(\[]/.test(text)) {
    return text;
  }

  // Ищем и оборачиваем LaTeX конструкции
  let result = text;

  // \begin{...}...\end{...} блоки — оборачиваем как блочные формулы
  result = result.replace(
    /(\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})/g,
    (match) => `$$${match}$$`
  );

  // Выражения с индексами/степенями: C_{ij}, A_{11}, x^2, etc.
  // Ищем паттерны вида "X = выражение" или отдельные выражения с _ или ^
  result = result.replace(
    /([A-Za-z]+(?:_\{[^}]+\}|\^\{[^}]+\}|_[0-9a-z]|\^[0-9a-z])+(?:\s*[=+\-*/]\s*[A-Za-z0-9_{}^\\]+)*)/g,
    (match) => {
      // Не оборачиваем если уже обёрнуто или это часть слова
      if (match.includes('$')) return match;
      return `$${match}$`;
    }
  );

  // Команды с backslash: \frac, \times, \cdot, etc.
  result = result.replace(
    /(\\(?:frac|sqrt|sum|prod|int|times|cdot|div|pm|mp|leq|geq|neq|approx|pi|alpha|beta|gamma|theta|lambda|sigma|omega|infty|partial|vec|hat|bar)\{?[^}\s]*\}?(?:\{[^}]*\})?)/g,
    (match) => {
      if (match.includes('$')) return match;
      return `$${match}$`;
    }
  );

  return result;
}

function parseContent(text: string): ContentPart[] {
  const parts: ContentPart[] = [];

  // Сначала извлекаем формулы, заменяя их на плейсхолдеры
  const formulas: { type: 'inlineMath' | 'blockMath'; content: string }[] = [];

  // Block формулы: $$...$$ и \[...\]
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    formulas.push({ type: 'blockMath', content: formula.trim() });
    return `\x00FORMULA_${formulas.length - 1}\x00`;
  });

  // \[...\] - нужно обработать разные варианты экранирования
  processed = processed.replace(/\\+\[([\s\S]*?)\\+\]/g, (_, formula) => {
    formulas.push({ type: 'blockMath', content: formula.trim() });
    return `\x00FORMULA_${formulas.length - 1}\x00`;
  });

  // Inline формулы: $...$ и \(...\)
  processed = processed.replace(/\$((?:[^$\\]|\\.)+?)\$/g, (_, formula) => {
    formulas.push({ type: 'inlineMath', content: formula });
    return `\x00FORMULA_${formulas.length - 1}\x00`;
  });

  // \(...\) - нужно обработать разные варианты экранирования
  // Иногда приходит как \( ... \), иногда как \\( ... \\)
  // Ищем \( за которым следует контент без \( до \)
  // Обрабатываем итеративно для вложенных формул
  let prevProcessed = '';
  while (prevProcessed !== processed) {
    prevProcessed = processed;
    // Матчим \(...\) где внутри нет \( (чтобы обработать вложенные изнутри наружу)
    processed = processed.replace(/\\+\(((?:(?!\\+\()[\s\S])*?)\\+\)/g, (_, formula) => {
      formulas.push({ type: 'inlineMath', content: formula.trim() });
      return `\x00FORMULA_${formulas.length - 1}\x00`;
    });
  }

  // Применяем markdown
  const html = parseMarkdown(processed);

  // Разбиваем по плейсхолдерам формул
  const regex = /\x00FORMULA_(\d+)\x00/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(html)) !== null) {
    // HTML до формулы
    if (match.index > lastIndex) {
      const htmlContent = html.slice(lastIndex, match.index);
      if (htmlContent.trim()) {
        parts.push({ type: 'html', content: htmlContent });
      }
    }

    // Формула
    const formulaIndex = parseInt(match[1], 10);
    parts.push(formulas[formulaIndex]);

    lastIndex = regex.lastIndex;
  }

  // Оставшийся HTML
  if (lastIndex < html.length) {
    const htmlContent = html.slice(lastIndex);
    if (htmlContent.trim()) {
      parts.push({ type: 'html', content: htmlContent });
    }
  }

  return parts;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default MarkdownMath;
