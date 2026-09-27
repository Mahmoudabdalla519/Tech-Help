import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TechnicianProfile, Profile } from '../../types/database';
import { useI18n } from '../../lib/i18n';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ShieldCheck, Star, HardHat, CheckCircle2, MapPin, Award, PhoneCall } from 'lucide-react';

interface TechWithProfile extends TechnicianProfile {
  profile?: Profile;
}

export function VerifiedTechniciansSection() {
  const { t, lang } = useI18n();
  const [technicians, setTechnicians] = useState<TechWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTechnicians() {
      setLoading(true);
      try {
        const { data: techData, error: techError } = await supabase
          .from('technician_profiles')
          .select('*')
          .eq('is_verified', true)
          .limit(6);

        if (techError) {
          console.error('Error fetching technician_profiles:', techError);
          setLoading(false);
          return;
        }

        if (techData && techData.length > 0) {
          const userIds = techData.map(t => t.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
          const combined = techData.map(t => ({
            ...t,
            profile: profilesMap.get(t.user_id),
          }));
          setTechnicians(combined);
        } else {
          setTechnicians([]);
        }
      } catch (err) {
        console.error('Exception fetching technicians:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTechnicians();
  }, []);

  return (
    <section id="technicians" className="py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] mb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
              <span>{lang === 'ar' ? 'فنيون بالقرب منك' : 'Nearby Technicians'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.verifiedTechnicians}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
              {lang === 'ar'
                ? 'فنيونا المعتمدون المؤهلون لتقديم خدمات احترافية مع توثيق كامل للبطاقات والخبرة.'
                : 'Our vetted technical specialists ready to deliver dependable service.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0D47A1]">
            <MapPin className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>{lang === 'ar' ? 'القاهرة الكبرى، مصر' : 'Cairo, Egypt'}</span>
          </div>
        </div>

        {loading ? (
          <LoadingState message={t.loadingData} rows={3} />
        ) : technicians.length === 0 ? (
          <EmptyState
            title={t.noData}
            description={
              lang === 'ar'
                ? 'لا يوجد فنيون موثقون حالياً في قاعدة البيانات.'
                : 'No verified technicians found in the database currently.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {technicians.map(tech => (
              <div
                key={tech.user_id}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0D47A1]/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar with online badge */}
                      <div className="relative">
                        <div className="w-13 h-13 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border-2 border-slate-200 overflow-hidden">
                          {tech.profile?.avatar_url ? (
                            <img
                              src={tech.profile.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <HardHat className="w-6 h-6 text-[#0D47A1]" />
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="متاح الآن" />
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <span>{tech.profile?.full_name || (lang === 'ar' ? 'فني معتمد' : 'Certified Pro')}</span>
                          <CheckCircle2 className="w-4 h-4 text-[#0D47A1] shrink-0 fill-blue-50" />
                        </h4>
                        <p className="text-xs text-[#0D47A1] font-semibold mt-0.5">
                          {tech.headline || (lang === 'ar' ? 'أخصائي صيانة فنية' : 'Technical Specialist')}
                        </p>
                      </div>
                    </div>

                    {/* Rating badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-900">
                      <Star className="w-3.5 h-3.5 fill-[#FF8A00] text-[#FF8A00]" />
                      <span className="tabular-nums font-black">{Number(tech.rating || 4.9).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Level & Trust badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-950">
                      <Award className="w-3 h-3 text-[#FF8A00]" />
                      <span>{lang === 'ar' ? 'فئة ذهبية' : 'Gold Tier'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {lang === 'ar' ? 'أكثر من 100 طلب منجز' : '100+ Jobs Completed'}
                    </span>
                  </div>

                  {tech.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {tech.bio}
                    </p>
                  )}
                </div>

                <div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-3.5">
                    <div className="flex items-center gap-1">
                      <span>{t.experienceYears}:</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {tech.years_experience || 5} {lang === 'ar' ? 'سنوات' : 'yrs'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <span>{lang === 'ar' ? 'يبدأ من' : 'Starts at'}:</span>
                      <span className="font-black tabular-nums">{tech.hourly_rate || 150} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>

                  <a
                    href="#services"
                    className="w-full py-2 bg-slate-100 hover:bg-[#0D47A1] hover:text-white text-[#0D47A1] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{lang === 'ar' ? 'اطلب الخدمة الآن' : 'Request Service'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment and Guarantee Trust Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-start">
          <div className="p-4 rounded-xl bg-[#F5F6FA] border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0D47A1] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900">{lang === 'ar' ? 'ضمان الصيانة والأمان' : 'Service Guarantee'}</h5>
              <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'حماية حقوق العميل والفني' : 'Quality or your money back'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F6FA] border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#FF8A00] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900">{lang === 'ar' ? 'فحص البطاقة القومية' : 'Verified Technicians'}</h5>
              <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'توثيق جنائي وبطاقات أصلية' : 'ID and credentials inspected'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F6FA] border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900">{lang === 'ar' ? 'تقييمات حقيقية 100%' : 'Real Reviews'}</h5>
              <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'من عملاء أكملوا طلباتهم' : '100% authentic customer feedback'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F6FA] border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900">{lang === 'ar' ? 'دعم فني ووساطة سريعة' : '24/7 Support'}</h5>
              <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'فريق خدمة عملاء للمتابعة' : 'Dedicated team ready anytime'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
