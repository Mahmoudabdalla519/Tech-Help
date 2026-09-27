import React from 'react';
import { useI18n } from '../../lib/i18n';
import { Search, CalendarClock, HardHat, Star } from 'lucide-react';

export function HowItWorksSection() {
  const { t, lang } = useI18n();

  const steps = [
    {
      num: '01',
      icon: <Search className="w-5 h-5 text-[#0D47A1]" />,
      title: t.step1Title,
      desc: t.step1Desc,
    },
    {
      num: '02',
      icon: <CalendarClock className="w-5 h-5 text-[#FF8A00]" />,
      title: t.step2Title,
      desc: t.step2Desc,
    },
    {
      num: '03',
      icon: <HardHat className="w-5 h-5 text-[#0D47A1]" />,
      title: t.step3Title,
      desc: t.step3Desc,
    },
    {
      num: '04',
      icon: <Star className="w-5 h-5 text-[#FF8A00]" />,
      title: t.step4Title,
      desc: t.step4Desc,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider">
            {lang === 'ar' ? 'خطوات سهلة وسريعة' : 'How It Works'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {t.howItWorks}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            {lang === 'ar'
              ? 'أربع خطوات بسيطة فقط لإنجاز كافة أعمال الصيانة والإصلاح بكل راحة بال وأمان.'
              : 'Only four steps to get all maintenance and technical repairs done with peace of mind.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(step => (
            <div
              key={step.num}
              className="relative p-6 rounded-2xl border border-slate-200/90 bg-[#F5F6FA] hover:bg-white hover:border-[#0D47A1]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs font-black text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-md">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
