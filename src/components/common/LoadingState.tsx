import React from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message, rows = 3 }: LoadingStateProps) {
  const { t } = useI18n();
  return (
    <div className="w-full py-10 flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 text-slate-600 mb-6">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-sm font-medium">{message || t.loadingData}</span>
      </div>
      <div className="w-full max-w-2xl space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-slate-200/60 rounded-lg animate-pulse w-full"
          />
        ))}
      </div>
    </div>
  );
}
