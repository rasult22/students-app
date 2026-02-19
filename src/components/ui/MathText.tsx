import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Fragment } from 'react';

interface MathTextProps {
  children: string;
  className?: string;
}

/**
 * Компонент для рендеринга текста с LaTeX формулами
 *
 * Поддерживает:
 * - Inline формулы: $E = mc^2$
 * - Block формулы: $$\int_0^\infty e^{-x^2} dx$$
 * - Автоматическое определение LaTeX команд без $
 */
export function MathText({ children, className }: MathTextProps) {
  const processedText = autoWrapLatex(children);
  const parts = parseLatex(processedText);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.type === 'text' && part.content}
          {part.type === 'inline' && <InlineMath math={part.content} />}
          {part.type === 'block' && <BlockMath math={part.content} />}
        </Fragment>
      ))}
    </span>
  );
}

type LatexPart =
  | { type: 'text'; content: string }
  | { type: 'inline'; content: string }
  | { type: 'block'; content: string };

/**
 * Автоматически оборачивает LaTeX команды в $...$ если они не обёрнуты
 */
function autoWrapLatex(text: string): string {
  // Если уже есть $ — не трогаем
  if (text.includes('$')) {
    return text;
  }

  // Паттерны LaTeX которые нужно обернуть
  const latexPatterns = [
    // \begin{...}...\end{...} блоки (матрицы, уравнения и т.д.)
    /(\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})/g,
    // Команды с аргументами: \frac{}{}, \sqrt{}, etc.
    /(\\(?:frac|sqrt|sum|prod|int|lim|log|ln|sin|cos|tan|vec|hat|bar|dot|ddot|overline|underline)\{[^}]*\}(?:\{[^}]*\})?)/g,
    // Индексы и степени: A_{ij}, x^2, C_{11}
    /([A-Za-z]+[_^]\{[^}]+\}(?:[_^]\{[^}]+\})?)/g,
    // Простые команды: \times, \cdot, \pi, \alpha, etc.
    /(\\(?:times|cdot|div|pm|mp|leq|geq|neq|approx|equiv|pi|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|sigma|omega|infty|partial|nabla|forall|exists|in|notin|subset|supset|cup|cap|wedge|vee|rightarrow|leftarrow|Rightarrow|Leftarrow))/g,
  ];

  let result = text;

  // Проверяем наличие LaTeX паттернов
  for (const pattern of latexPatterns) {
    if (pattern.test(text)) {
      // Если весь текст похож на формулу — оборачиваем целиком
      if (text.trim().startsWith('\\') || /^[A-Za-z_{}^0-9\\=+\-*/<>()[\]\s]+$/.test(text.trim())) {
        return `$${text}$`;
      }
      // Иначе оборачиваем найденные паттерны
      result = result.replace(pattern, (match) => `$${match}$`);
    }
  }

  // Специальный случай: простые выражения типа "C_{ij} = A_{ij} + B_{ij}"
  if (/[A-Za-z]+_\{/.test(result) && !result.includes('$')) {
    return `$${result}$`;
  }

  return result;
}

function parseLatex(text: string): LatexPart[] {
  const parts: LatexPart[] = [];

  // Regex для block ($$...$$) и inline ($...$) формул
  const regex = /\$\$([\s\S]*?)\$\$|\$((?:[^$\\]|\\.)+?)\$/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Добавляем текст до формулы
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      // Block формула ($$...$$)
      parts.push({
        type: 'block',
        content: match[1].trim(),
      });
    } else if (match[2] !== undefined) {
      // Inline формула ($...$)
      parts.push({
        type: 'inline',
        content: match[2],
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}

export default MathText;
