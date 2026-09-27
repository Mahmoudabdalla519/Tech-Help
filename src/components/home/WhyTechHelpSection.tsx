import React from 'react';
import { useI18n } from '../../lib/i18n';
import { ShieldCheck, Clock, BadgeCheck, MessageSquare, Award } from 'lucide-react';

export function WhyTechHelpSection() {
  const { t, lang } = useI18n();

  const reasons = [
    {
      icon: <BadgeCheck className="w-5 h-5 text-[#FF8A00]" />,
      title: lang === 'ar' ? 'فنيون معتمدون وموثقون بالرقم القومي' : 'Verified Certified Technicians',
      desc: lang === 'ar'
        ? 'كل فني يخضع للتحقق الجنائي والهوية الشخصية والمهنية قبل تفعيل حسابه واستقبال أي طلب.'
        : 'Every pro undergoes identity and background verification before offering services on TechHelp.',
    },
    {
      icon: <Clock className="w-5 h-5 text-[#0D47A1]" />,
      title: lang === 'ar' ? 'دقة في المواعيد وسرعة استجابة' : 'Punctual & Fast Response',
      desc: lang === 'ar'
        ? 'قبول فوري من الفنيين المتوفرين في نطاقك الجغرافي حسب التوقيت والميزانية المناسبة لك.'
        : 'Get prompt acceptance from available specialists nearby matching your schedule.',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-[#FF8A00]" />,
      title: lang === 'ar' ? 'محادثة وتتبع مباشر للحالة' : 'Real-time Chat & Status Tracking',
      desc: lang === 'ar'
        ? 'تواصل كتابي مباشر وفوري مع الفني مع إمكانية مشاركة الملاحظات وتحديث الحالات خطوة بخطوة.'
        : 'Direct messaging and real-time status updates from request creation to completion.',
    },
    {
      icon: <Award className="w-5 h-5 text-[#0D47A1]" />,
      title: lang === 'ar' ? 'ضمان الخدمة وحل النزاعات' : 'Service Warranty & Resolution',
      desc: lang === 'ar'
        ? 'نظام متكامل لتقديم الشكاوى ومتابعتها بإشراف إدارة المنصة لضمان حق العميل وجودة التنفيذ.'
        : 'Dedicated dispute and complaint resolution ensuring complete peace of mind for both sides.',
    },
  ];

  return (
    <section id="why-techhelp" className="py-16 bg-[#F5F6FA] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Image side */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                alt="TechHelp Service Guarantee"
                referrerPolicy="no-referrer"
                className="w-full h-[320px] sm:h-[380px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 text-xs shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D47A1] to-[#1E88E5] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {lang === 'ar' ? 'ضمان الجودة والأمان' : 'Quality & Safety Warranty'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar'
                        ? 'تقييمات حقيقية ورقابة مستمرة على الأداء'
                        : 'Authentic reviews and performance monitoring'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text & Points */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-start">
            <div>
              <span className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider">
                {lang === 'ar' ? 'معايير موثوقة' : 'Proven Standards'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {t.whyTechHelp}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {lang === 'ar'
                  ? 'تم تصميم منصة TechHelp لإنهاء مشقة البحث عن فنيين موثوقين، مع توفير الحماية والشفافية التامة لكل من العميل والفني.'
                  : 'Engineered to eliminate the hassle of finding reliable specialists with utmost transparency and accountability.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#0D47A1]/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2.5">
                    {reason.icon}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    {reason.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {reason.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
