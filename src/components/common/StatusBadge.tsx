import React from 'react';
import { RequestStatus } from '../../types/database';
import { useI18n } from '../../lib/i18n';

interface StatusBadgeProps {
  status: RequestStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { formatStatus } = useI18n();

  const getStyle = (s: string) => {
    switch (s) {
      case 'pending':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'accepted':
        return 'text-sky-800 bg-sky-50 border-sky-200';
      case 'in_progress':
        return 'text-indigo-800 bg-indigo-50 border-indigo-200';
      case 'completed':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'cancelled':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      case 'rejected':
        return 'text-rose-800 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getDotColor = (s: string) => {
    switch (s) {
      case 'pending':
        return 'bg-amber-500';
      case 'accepted':
        return 'bg-sky-500';
      case 'in_progress':
        return 'bg-indigo-500';
      case 'completed':
        return 'bg-emerald-500';
      case 'cancelled':
        return 'bg-slate-400';
      case 'rejected':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${getStyle(
        status
      )}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(status)}`} aria-hidden="true" />
      <span>{formatStatus(status as RequestStatus)}</span>
    </span>
  );
}
