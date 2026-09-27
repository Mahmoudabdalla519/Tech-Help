import React from 'react';
import { Home, ClipboardList, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';

interface BottomNavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onRequestService: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function BottomNavigation({
  currentView,
  onNavigate,
  onRequestService,
  onOpenAuth,
}: BottomNavigationProps) {
  const { user, profile } = useAuth();
  const { lang } = useI18n();

  const getDashboardView = () => {
    if (!profile) return 'customer';
    return profile.role;
  };

  const handleAccountClick = () => {
    if (!user) {
      onOpenAuth('login');
    } else {
      onNavigate(getDashboardView());
    }
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. الرئيسية */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 transition-colors cursor-pointer ${
            currentView === 'home' ? 'text-[#0D47A1] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
        </button>

        {/* 2. طلباتي */}
        <button
          type="button"
          onClick={() => {
            if (!user) onOpenAuth('login');
            else onNavigate(getDashboardView());
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 transition-colors cursor-pointer ${
            currentView !== 'home' ? 'text-[#0D47A1] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-5 h-5 stroke-2" />
          <span className="text-[10px]">{lang === 'ar' ? 'طلباتي' : 'Orders'}</span>
        </button>

        {/* 3. Floating Action Center: (+) طلب خدمة */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            type="button"
            onClick={onRequestService}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0D47A1] to-[#1E88E5] text-white flex items-center justify-center shadow-lg shadow-[#0D47A1]/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white"
            title={lang === 'ar' ? 'طلب خدمة جديدة' : 'Request Service'}
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
          <span className="text-[10px] font-bold text-[#0D47A1] mt-0.5 whitespace-nowrap">
            {lang === 'ar' ? 'اطلب فني' : 'Request'}
          </span>
        </div>

        {/* 4. المحادثات */}
        <button
          type="button"
          onClick={() => {
            if (!user) onOpenAuth('login');
            else onNavigate(getDashboardView());
          }}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 stroke-2" />
          <span className="text-[10px]">{lang === 'ar' ? 'رسائلي' : 'Messages'}</span>
        </button>

        {/* 5. الحساب */}
        <button
          type="button"
          onClick={handleAccountClick}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 transition-colors cursor-pointer ${
            currentView === getDashboardView() && user
              ? 'text-[#0D47A1] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {user && profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Account"
              className="w-5 h-5 rounded-full object-cover border border-slate-300"
            />
          ) : (
            <User className="w-5 h-5 stroke-2" />
          )}
          <span className="text-[10px]">{lang === 'ar' ? 'حسابي' : 'Account'}</span>
        </button>
      </div>
    </nav>
  );
}
