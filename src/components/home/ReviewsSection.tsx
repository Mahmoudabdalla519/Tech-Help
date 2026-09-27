import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Review, Profile } from '../../types/database';
import { useI18n } from '../../lib/i18n';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { Star, MessageSquareQuote } from 'lucide-react';

interface ReviewWithDetails extends Review {
  customer?: Profile;
}

export function ReviewsSection() {
  const { t, lang, formatDate } = useI18n();
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      try {
        const { data: revData, error: revError } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (revError) {
          console.error('Error fetching reviews:', revError);
          setLoading(false);
          return;
        }

        if (revData && revData.length > 0) {
          const customerIds = revData.map(r => r.customer_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', customerIds);

          const pMap = new Map(profiles?.map(p => [p.id, p]));
          const combined = revData.map(r => ({
            ...r,
            customer: pMap.get(r.customer_id),
          }));
          setReviews(combined);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error('Exception fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <section className="py-16 bg-[#F5F6FA] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] mb-2">
            <MessageSquareQuote className="w-4 h-4 text-[#FF8A00]" />
            <span>{lang === 'ar' ? 'تجارب موثوقة' : 'Verified Feedback'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.customerReviews}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            {lang === 'ar'
              ? 'تقييمات حقيقية من عملاء قاموا بطلب الخدمات وإتمامها بنجاح مع فنيينا المعتمدين.'
              : 'Authentic reviews submitted by verified clients after job completion.'}
          </p>
        </div>

        {loading ? (
          <LoadingState message={t.loadingData} rows={2} />
        ) : reviews.length === 0 ? (
          <EmptyState
            title={t.noData}
            description={
              lang === 'ar'
                ? 'لا توجد تقييمات مسجلة في قاعدة البيانات حالياً.'
                : 'No reviews found in the database currently.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(rev => (
              <div
                key={rev.id}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center">
                        {rev.customer?.full_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {rev.customer?.full_name || (lang === 'ar' ? 'عميل TechHelp' : 'TechHelp Customer')}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-[#FF8A00] text-[#FF8A00]'
                              : 'fill-slate-100 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{rev.comment || (lang === 'ar' ? 'خدمة ممتازة وفني محترف وملتزم بالمواعيد.' : 'Great service and professional technician.')}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
