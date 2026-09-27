import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200/80 rounded-xl my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        {icon || <Inbox className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">
        {title || t.noData}
      </h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs my-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
        <span className="font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline font-semibold text-rose-900 cursor-pointer"
        >
          إعادة المحاولة / Retry
        </button>
      )}
    </div>
  );
}
