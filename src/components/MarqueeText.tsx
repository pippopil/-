import React, { useState } from 'react';

interface MarqueeTextProps {
  text: string;
  subtext?: string;
  className?: string;
  textClassName?: string;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  maxLengthThreshold?: number;
  speedSec?: number;
  allowExpand?: boolean;
}

/**
 * Компонент бегущей строки (Marquee / Ticker) для длинных названий солода и стилей пива.
 * Автоматически скроллит текст, если он длинный, и позволяет тапнуть для просмотра целиком.
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  subtext,
  className = '',
  textClassName = '',
  prefix,
  icon,
  maxLengthThreshold = 22,
  speedSec = 16,
  allowExpand = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = (text?.length || 0) > maxLengthThreshold;

  if (isExpanded) {
    return (
      <div
        onClick={() => allowExpand && setIsExpanded(false)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer select-none transition-all ${className}`}
        title="Нажмите, чтобы свернуть"
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {prefix && <span className="shrink-0 opacity-80">{prefix}</span>}
        <span className="whitespace-normal break-words leading-tight">
          {text}
          {subtext && <span className="ml-1 opacity-70 font-normal">({subtext})</span>}
        </span>
      </div>
    );
  }

  if (!isLong) {
    return (
      <div className={`inline-flex items-center gap-1 min-w-0 max-w-full text-xs font-semibold ${className}`}>
        {icon && <span className="shrink-0">{icon}</span>}
        {prefix && <span className="shrink-0 opacity-80">{prefix}</span>}
        <span className={`truncate ${textClassName}`} title={text}>
          {text}
          {subtext && <span className="ml-1 opacity-70 font-normal">({subtext})</span>}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => allowExpand && setIsExpanded(!isExpanded)}
      className={`marquee-container inline-flex items-center max-w-full select-none cursor-pointer group ${className}`}
      title={`${text}${subtext ? ` (${subtext})` : ''} — нажмите для полного просмотра`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <div
        className="marquee-track flex items-center gap-8 py-0.5"
        style={{ animationDuration: `${speedSec}s` }}
      >
        <span className={`inline-flex items-center gap-1 shrink-0 ${textClassName}`}>
          {icon && <span className="shrink-0">{icon}</span>}
          {prefix && <span className="shrink-0 opacity-80">{prefix}</span>}
          <span className="font-semibold">{text}</span>
          {subtext && <span className="opacity-70 font-normal">({subtext})</span>}
        </span>
        <span className="text-stone-400 dark:text-stone-600 shrink-0 select-none">•</span>
        <span className={`inline-flex items-center gap-1 shrink-0 ${textClassName}`}>
          {icon && <span className="shrink-0">{icon}</span>}
          {prefix && <span className="shrink-0 opacity-80">{prefix}</span>}
          <span className="font-semibold">{text}</span>
          {subtext && <span className="opacity-70 font-normal">({subtext})</span>}
        </span>
      </div>
    </div>
  );
};
