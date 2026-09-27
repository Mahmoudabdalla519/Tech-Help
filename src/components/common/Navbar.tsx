import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { TechHelpLogo } from './TechHelpLogo';
import {
  Globe,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ShieldCheck,
  Building2,
  HardHat,
  MapPin,
  Bell,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Navbar({ currentView, onNavigate, onOpenAuth }: NavbarProps) {
  const { user, profile, logout } = useAuth();
  const { t, lang, toggleLang, formatRole } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getDashboardViewForRole = (role?: string) => {
    switch (role) {
      case 'technician':
        return 'technician';
      case 'company':
        return 'company';
      case 'admin':
        return 'admin';
      case 'customer':
      default:
        return 'customer';
    }
  };

  const dashboardView = getDashboardViewForRole(profile?.role);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />;
      case 'technician':
        return <HardHat className="w-3.5 h-3.5 text-amber-500" />;
      case 'company':
        return <Building2 className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <User className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: TechHelp Brand Wordmark & Location */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 text-left rtl:text-right group focus:outline-none cursor-pointer"
          >
            <TechHelpLogo size="md" />
          </button>

          {/* Location selector */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80">
            <MapPin className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>{lang === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => handleNavClick('home')}
            className={`hover:text-[#0D47A1] transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'home' ? 'text-[#0D47A1] font-bold border-b-2 border-[#0D47A1] pb-0.5' : ''
            }`}
          >
            {t.services}
          </button>
          <a
            href="#how-it-works"
            onClick={() => {
              if (currentView !== 'home') onNavigate('home');
            }}
            className="hover:text-[#0D47A1] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.howItWorks}
          </a>
          <a
            href="#why-techhelp"
            onClick={() => {
              if (currentView !== 'home') onNavigate('home');
            }}
            className="hover:text-[#0D47A1] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.whyTechHelp}
          </a>
          <a
            href="#technicians"
            onClick={() => {
              if (currentView !== 'home') onNavigate('home');
            }}
            className="hover:text-[#0D47A1] transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.verifiedTechnicians}
          </a>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {user && profile ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-slate-100 transition-colors cursor-pointer"
                title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF8A00]" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-5 h-5 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    getRoleIcon(profile.role)
                  )}
                  <span className="max-w-[120px] truncate font-semibold">
                    {profile.full_name || profile.email?.split('@')[0]}
                  </span>
                  <span className="text-[11px] text-slate-500 border-x border-slate-300 px-1 hidden sm:inline">
                    {formatRole(profile.role)}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">
                        {profile.full_name || 'User'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {formatRole(profile.role)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleNavClick(dashboardView)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>{t.dashboard}</span>
                    </button>

                    {/* Portals direct navigation */}
                    <div className="border-t border-slate-100 my-1 pt-1">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400">
                        البوابات / Portals
                      </div>
                      <button
                        onClick={() => handleNavClick('customer')}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{t.customerPortal}</span>
                        <span className="text-[10px] text-slate-400">Customer</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('technician')}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{t.technicianPortal}</span>
                        <span className="text-[10px] text-slate-400">Technician</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('company')}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{t.companyPortal}</span>
                        <span className="text-[10px] text-slate-400">Company</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('admin')}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{t.adminConsole}</span>
                        <span className="text-[10px] text-rose-500 font-semibold">Admin</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        onNavigate('home');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-[#0D47A1] hover:text-[#1565C0] hover:bg-blue-50/80 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.login}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#0D47A1] to-[#1E88E5] hover:opacity-95 rounded-xl transition-all whitespace-nowrap shadow-xs shadow-[#0D47A1]/20 cursor-pointer"
              >
                {t.requestServiceNow}
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => handleNavClick('home')}
            className="w-full text-start py-2 text-sm font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
          >
            {t.services}
          </button>
          <button
            onClick={() => {
              handleNavClick('home');
              setTimeout(() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="w-full text-start py-2 text-sm font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
          >
            {t.howItWorks}
          </button>
          <button
            onClick={() => {
              handleNavClick('home');
              setTimeout(() => {
                document.getElementById('why-techhelp')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="w-full text-start py-2 text-sm font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
          >
            {t.whyTechHelp}
          </button>
          {user && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
              <button
                onClick={() => handleNavClick('customer')}
                className="w-full text-start py-1.5 text-xs font-medium text-slate-600 cursor-pointer"
              >
                {t.customerPortal}
              </button>
              <button
                onClick={() => handleNavClick('technician')}
                className="w-full text-start py-1.5 text-xs font-medium text-slate-600 cursor-pointer"
              >
                {t.technicianPortal}
              </button>
              <button
                onClick={() => handleNavClick('company')}
                className="w-full text-start py-1.5 text-xs font-medium text-slate-600 cursor-pointer"
              >
                {t.companyPortal}
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className="w-full text-start py-1.5 text-xs font-semibold text-rose-600 cursor-pointer"
              >
                {t.adminConsole}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
