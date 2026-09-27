import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Service } from '../../types/database';
import { useI18n } from '../../lib/i18n';
import { LoadingState } from '../common/LoadingState';
import { EmptyState, ErrorBanner } from '../common/EmptyState';
import {
  Wrench,
  Zap,
  Droplet,
  AirVent,
  Tv,
  Hammer,
  Laptop,
  Flame,
  Car,
  Camera,
  PaintBucket,
  Cpu,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const { lang, t } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (sbError) {
        console.error('Error loading services from Supabase:', sbError);
        setError(lang === 'ar' ? 'تعذر تحميل الخدمات من قاعدة البيانات' : 'Failed to load services from database');
      } else {
        setServices(data || []);
      }
    } catch (err: any) {
      console.error('Exception fetching services:', err);
      setError(err?.message || 'Error fetching services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [lang]);

  // Dynamic Lucide icon helper based on icon string or fallback matching TechHelp visual identity
  const renderIcon = (iconName: string | null, nameAr?: string) => {
    const key = `${iconName || ''} ${nameAr || ''}`.toLowerCase();
    if (key.includes('electric') || key.includes('zap') || key.includes('كهرب')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/80 group-hover:scale-105 transition-transform">
          <Zap className="w-6 h-6 fill-amber-400 stroke-amber-600" />
        </div>
      );
    }
    if (key.includes('plumb') || key.includes('drop') || key.includes('سباك') || key.includes('مياه')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/80 group-hover:scale-105 transition-transform">
          <Droplet className="w-6 h-6 fill-sky-400 stroke-sky-600" />
        </div>
      );
    }
    if (key.includes('air') || key.includes('hvac') || key.includes('تكييف')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100/80 group-hover:scale-105 transition-transform">
          <AirVent className="w-6 h-6 stroke-cyan-600" />
        </div>
      );
    }
    if (key.includes('car') || key.includes('سيار')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 group-hover:scale-105 transition-transform">
          <Car className="w-6 h-6 stroke-rose-600" />
        </div>
      );
    }
    if (key.includes('camera') || key.includes('كامير')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform">
          <Camera className="w-6 h-6 stroke-slate-700" />
        </div>
      );
    }
    if (key.includes('plc') || key.includes('auto') || key.includes('تحكم')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0D47A1] flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
          <Cpu className="w-6 h-6 stroke-[#0D47A1]" />
        </div>
      );
    }
    if (key.includes('carpenter') || key.includes('hammer') || key.includes('نجار') || key.includes('أثاث')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80 group-hover:scale-105 transition-transform">
          <Hammer className="w-6 h-6 stroke-amber-700" />
        </div>
      );
    }
    if (key.includes('paint') || key.includes('دهان')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform">
          <PaintBucket className="w-6 h-6 stroke-emerald-600" />
        </div>
      );
    }
    if (key.includes('tv') || key.includes('screen') || key.includes('شاش') || key.includes('دش') || key.includes('تلفزيون')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 group-hover:scale-105 transition-transform">
          <Tv className="w-6 h-6 stroke-indigo-600" />
        </div>
      );
    }
    if (key.includes('tech') || key.includes('comp') || key.includes('حاسوب') || key.includes('كمبيوتر')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100/80 group-hover:scale-105 transition-transform">
          <Laptop className="w-6 h-6 stroke-violet-600" />
        </div>
      );
    }
    if (key.includes('gas') || key.includes('flame') || key.includes('غاز') || key.includes('سخان')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF8A00] flex items-center justify-center border border-orange-100/80 group-hover:scale-105 transition-transform">
          <Flame className="w-6 h-6 stroke-[#FF8A00]" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0D47A1] flex items-center justify-center border border-blue-100/80 group-hover:scale-105 transition-transform">
        <Wrench className="w-6 h-6 stroke-[#0D47A1]" />
      </div>
    );
  };

  return (
    <section id="services" className="py-16 bg-[#F5F6FA] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>{lang === 'ar' ? 'الخدمات المتاحة' : 'Core Services'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.services}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              {lang === 'ar'
                ? 'اختر الخدمة الفنية التي تحتاج إليها للتواصل الفوري مع أفضل الفنيين القريبين منك.'
                : 'Choose the technical service you need to connect with top nearby specialists.'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#0D47A1]">
            <span>{lang === 'ar' ? 'الأكثر طلباً' : 'Most requested'}</span>
            <span className="w-2 h-2 rounded-full bg-[#FF8A00]" />
          </div>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchServices} />}

        {loading ? (
          <LoadingState message={t.loadingData} rows={4} />
        ) : services.length === 0 ? (
          <EmptyState
            title={t.noData}
            description={
              lang === 'ar'
                ? 'لا توجد خدمات نشطة متوفرة في قاعدة البيانات حالياً.'
                : 'No active services available in the database at the moment.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {services.map(service => {
              const name = lang === 'ar' ? service.name_ar : service.name_en;
              const subName = lang === 'ar' ? service.name_en : service.name_ar;
              return (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className="group relative bg-white border border-slate-200/90 hover:border-[#0D47A1] hover:shadow-lg rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between min-h-[140px]"
                >
                  <div className="flex flex-col items-center">
                    {renderIcon(service.icon || service.name_en, service.name_ar)}
                    <h3 className="mt-3 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0D47A1] transition-colors line-clamp-1">
                      {name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 font-medium">
                      {subName}
                    </p>
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-[#0D47A1] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>{lang === 'ar' ? 'طلب' : 'Request'}</span>
                    {lang === 'ar' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Verification banner */}
        <div className="mt-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0D47A1] to-[#1E88E5] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-[#0D47A1]/20">
          <div className="flex items-center gap-3.5 text-center sm:text-start">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base">
                {lang === 'ar'
                  ? 'جميع الفنيين على منصة TechHelp مفحوصو الهوية وموثقون'
                  : 'All technicians on TechHelp are verified for guaranteed service quality'}
              </h4>
              <p className="text-xs text-blue-100 mt-0.5">
                {lang === 'ar'
                  ? 'فحص شامل للهوية القومية ورقم الهاتف والخبرات المهنية لضمان أمانك الكامل'
                  : 'Rigorous identity verification and satisfaction warranty'}
              </p>
            </div>
          </div>
          <a
            href="#why-techhelp"
            className="px-4 py-2 bg-white text-[#0D47A1] hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs shrink-0 transition-colors whitespace-nowrap cursor-pointer"
          >
            {lang === 'ar' ? 'تعرف على ضماننا' : 'Learn More'}
          </a>
        </div>
      </div>
    </section>
  );
}
