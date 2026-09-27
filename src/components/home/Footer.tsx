import React from 'react';
import { useI18n } from '../../lib/i18n';
import { TechHelpLogo } from '../common/TechHelpLogo';

export function Footer() {
  const { t, lang } = useI18n();

  return (
    <footer className="bg-[#051329] text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <TechHelpLogo size="md" inverted showTagline />
            <p className="text-slate-400 text-xs leading-relaxed">
              {t.tagline}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  {t.services}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  {t.howItWorks}
                </a>
              </li>
              <li>
                <a href="#why-techhelp" className="hover:text-white transition-colors">
                  {t.whyTechHelp}
                </a>
              </li>
              <li>
                <a href="#technicians" className="hover:text-white transition-colors">
                  {t.verifiedTechnicians}
                </a>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {lang === 'ar' ? 'بوابات النظام' : 'System Portals'}
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-slate-400">{t.customerPortal}</span>
              </li>
              <li>
                <span className="text-slate-400">{t.technicianPortal}</span>
              </li>
              <li>
                <span className="text-slate-400">{t.companyPortal}</span>
              </li>
              <li>
                <span className="text-slate-400">{t.adminConsole}</span>
              </li>
            </ul>
          </div>

          {/* Security & System Info */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {lang === 'ar' ? 'الأمان والسياسة' : 'Security & Policy'}
            </h4>
            <p className="text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? 'حماية متقدمة للبيانات وسياسات أمان مشددة على مستوى الصفوف RLS في Supabase لضمان سرية معلوماتك وبيانات هويتك.'
                : 'Secured end-to-end with row level security policies. All operations protected.'}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {t.allRightsReserved}.</p>
          <div className="flex items-center gap-4">
            <span>Supabase Connected</span>
            <span>•</span>
            <span>بوابة مصرية متكاملة</span>
            <span>•</span>
            <span>RTL / LTR Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
