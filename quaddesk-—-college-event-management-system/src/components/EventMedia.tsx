import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { EventCategory } from '../types/cems';

interface EventMediaProps {
  imageUrl?: string;
  title: string;
  category: EventCategory;
  className?: string;
}

export function EventMedia({ imageUrl, title, category, className = '' }: EventMediaProps) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400 ${className}`}
      >
        <CalendarDays className="w-7 h-7 text-slate-400 dark:text-slate-500 mb-2" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center line-clamp-1">
          {category} · {title}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      <img
        src={imageUrl}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
