import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Search, MapPin } from 'lucide-react';

interface HeroSectionProps {
  onRequestClick: () => void;
  onLoginClick: () => void;
}

export function HeroSection({ onRequestClick, onLoginClick }: HeroSectionProps) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [techsCount, setTechsCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const { count: sCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        if (sCount !== null) setServicesCount(sCount);

        const { count: tCount } = await supabase
          .from('technician_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true);
        if (tCount !== null) setTechsCount(tCount);
      } catch (err) {
        console.error('Error fetching hero counts:', err);
      }
    }
    loadStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const servicesEl = document.getElementById('services');
    if (servicesEl) {
      servicesEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      onRequestClick();
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#061A3A] via-[#0D47A1] to-[#1565C0] text-white pt-10 pb-16 lg:py-16">
      {/* Background radial gradient with TechHelp Orange and Cyan accents */}
      <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-[#FF8A00]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -z-10 w-80 h-80 bg-[#1E88E5]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-5 text-start">
            {/* Tagline kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
              <span>
                {lang === 'ar'
                  ? 'اعثر على الفني المناسب، في أي وقت، وأي مكان'
                  : 'Find the Right Technician, Anytime, Anywhere'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.2] text-balance">
              {lang === 'ar' ? (
                <>
                  محتاج فني صيانة محترف؟{' '}
                  <span className="text-[#FF8A00]">TechHelp</span> في خدمتك
                </>
              ) : (
                <>
                  Connect with Certified Technicians on{' '}
                  <span className="text-[#FF8A00]">TechHelp</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-blue-100/90 max-w-xl leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-1.5 sm:p-2 rounded-2xl shadow-xl flex items-center gap-2 max-w-xl border border-white/20 text-slate-800"
            >
              <div className="flex items-center gap-2 px-2.5 flex-1 min-w-0">
                <Search className="w-5 h-5 text-[#0D47A1] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ar' ? 'ماذا تحتاج لصيانته اليوم؟ (تكييف، كهرباء، سباكة...)' : 'What do you need repaired?'}
                  className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 border-x border-slate-200 shrink-0 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#FF8A00]" />
                <span>{lang === 'ar' ? 'القاهرة' : 'Cairo'}</span>
              </div>
              <button
                type="submit"
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FFA726] hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shrink-0 shadow-md shadow-[#FF8A00]/30 cursor-pointer"
              >
                {lang === 'ar' ? 'بحث سريع' : 'Search'}
              </button>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onRequestClick}
                className="px-6 py-3 text-sm font-black text-slate-950 bg-gradient-to-r from-[#FF8A00] to-[#FFA726] hover:opacity-95 rounded-xl transition-all shadow-lg shadow-[#FF8A00]/30 flex items-center gap-2 hover:gap-3 cursor-pointer"
              >
                <span>{t.requestServiceNow}</span>
                {lang === 'ar' ? (
                  <ArrowLeft className="w-4 h-4 transition-all" />
                ) : (
                  <ArrowRight className="w-4 h-4 transition-all" />
                )}
              </button>

              {!user && (
                <button
                  onClick={onLoginClick}
                  className="px-5 py-3 text-sm font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/25 backdrop-blur-sm transition-colors cursor-pointer"
                >
                  {t.login}
                </button>
              )}
            </div>

            {/* Trust bullet markers */}
            <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-blue-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A00]" />
                <span>{lang === 'ar' ? 'فنيون معتمدون ومفحوصو الهوية' : 'Vetted Certified Technicians'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A00]" />
                <span>{lang === 'ar' ? 'تتبع فوري ومحادثة مباشرة' : 'Live Status & Direct Chat'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8A00]" />
                <span>{lang === 'ar' ? 'ضمان الخدمة وحل النزاعات' : 'Service Guarantee & Safe Pay'}</span>
              </div>
            </div>

            {/* Real Stats Row if loaded from Supabase */}
            {(servicesCount !== null || techsCount !== null) && (
              <div className="flex items-center gap-6 pt-1 text-xs text-blue-200">
                {servicesCount !== null && (
                  <div>
                    <span className="font-extrabold text-white text-base tabular-nums mr-1 ml-1">
                      {servicesCount}
                    </span>
                    <span>{lang === 'ar' ? 'خدمة معتمدة' : 'Active Services'}</span>
                  </div>
                )}
                {techsCount !== null && (
                  <div>
                    <span className="font-extrabold text-[#FF8A00] text-base tabular-nums mr-1 ml-1">
                      {techsCount}
                    </span>
                    <span>{lang === 'ar' ? 'فني موثق' : 'Verified Pros'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hero Visual Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900/50 backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"
                alt="TechHelp Professional Technician"
                referrerPolicy="no-referrer"
                className="w-full h-[320px] sm:h-[400px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061A3A] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs shadow-lg text-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-900">
                      {lang === 'ar' ? 'فنيون جاهزون بالقرب منك الآن' : 'Technicians available near you'}
                    </span>
                  </div>
                  <span className="font-black text-[#0D47A1]">Tech<span className="text-[#FF8A00]">Help</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
