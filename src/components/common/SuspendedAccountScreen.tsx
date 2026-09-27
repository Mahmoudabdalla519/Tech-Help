import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { TechHelpLogo } from './TechHelpLogo';
import { ShieldAlert, LogOut, Phone, IdCard, AlertOctagon, HelpCircle } from 'lucide-react';

export function SuspendedAccountScreen() {
  const { user, profile, logout } = useAuth();
  const { lang } = useI18n();

  const isCustomer = profile?.role === 'customer';
  const isTechnician = profile?.role === 'technician';

  return (
    <div className="min-h-screen bg-[#071833] text-slate-100 flex items-center justify-center p-4 sm:p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-slate-900/95 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center relative overflow-hidden">
        {/* Top glow decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-[#FF8A00] to-[#0D47A1]" />

        {/* Brand logo at the top */}
        <div className="flex justify-center mb-6">
          <TechHelpLogo size="md" inverted showTagline />
        </div>

        {/* Warning Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse">
          <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
          {lang === 'ar' ? 'تم تعطيل الحساب' : 'Account Suspended'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          {lang === 'ar'
            ? 'تم إيقاف صلاحية الدخول لهذا الحساب من قبل إدارة المنصة.'
            : 'Access to this account has been disabled by platform administration.'}
        </p>

        {/* Reason Box - Highlighted */}
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-start mb-6">
          <div className="flex items-center gap-2 mb-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{lang === 'ar' ? 'سبب الإيقاف (reason):' : 'Suspension Reason:'}</span>
          </div>

          <div className="text-sm font-semibold text-rose-100 bg-rose-900/30 p-3 rounded-lg border border-rose-800/50 break-words whitespace-pre-wrap leading-relaxed">
            {profile?.reason?.trim() ? (
              profile.reason
            ) : (
              <span className="text-rose-300/70 italic">
                {lang === 'ar'
                  ? 'تم إيقاف الحساب لمخالفة شروط وسياسات الاستخدام'
                  : 'Suspended due to terms of service violation.'}
              </span>
            )}
          </div>

          {/* Additional details about suspension type */}
          <div className="mt-3 pt-3 border-t border-rose-800/40 text-xs text-rose-200/80 flex flex-col gap-1.5 font-mono">
            {isCustomer && profile?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{lang === 'ar' ? 'محظور برقم الهاتف:' : 'Suspended by phone:'}</span>
                <span className="font-bold text-white tracking-wider" dir="ltr">{profile.phone}</span>
              </div>
            )}
            {isTechnician && profile?.card_id && (
              <div className="flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{lang === 'ar' ? 'محظور بالرقم القومي (card_id):' : 'Suspended by National ID:'}</span>
                <span className="font-bold text-white tracking-wider" dir="ltr">{profile.card_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* User summary details */}
        <div className="bg-slate-900/70 rounded-xl p-3.5 text-xs text-slate-300 mb-6 space-y-1.5 text-start border border-slate-700/60">
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span>
            <span className="font-semibold text-white truncate max-w-[200px]">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'ar' ? 'البريد:' : 'Email:'}</span>
            <span className="font-mono text-slate-300 truncate max-w-[200px]" dir="ltr">{profile?.email || user?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lang === 'ar' ? 'الرتبة:' : 'Role:'}</span>
            <span className="font-semibold text-amber-400">
              {profile?.role === 'customer'
                ? lang === 'ar' ? 'عميل' : 'Customer'
                : profile?.role === 'technician'
                ? lang === 'ar' ? 'فني' : 'Technician'
                : profile?.role === 'company'
                ? lang === 'ar' ? 'شركة' : 'Company'
                : profile?.role}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-6">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>
            {lang === 'ar'
              ? 'إذا كنت تعتقد أن هذا الإجراء تم بالخطأ، يرجى مراجعة إدارة الدعم.'
              : 'If you believe this was done in error, please contact support.'}
          </span>
        </div>

        {/* Action button: Logout */}
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-rose-900/40 cursor-pointer active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
        </button>
      </div>
    </div>
  );
}
