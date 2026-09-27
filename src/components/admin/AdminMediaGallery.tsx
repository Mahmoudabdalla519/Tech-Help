import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { Profile, ServiceRequest, RequestImage } from '../../types/database';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import {
  Image as ImageIcon,
  Search,
  Filter,
  Maximize2,
  Download,
  ExternalLink,
  User,
  IdCard,
  Wrench,
  Calendar,
  X,
  RefreshCw,
  Phone,
  CheckCircle,
} from 'lucide-react';

export interface AdminMediaItem {
  id: string;
  url: string;
  type: 'request_image' | 'id_front' | 'id_back' | 'avatar';
  title: string;
  subtitle?: string;
  createdAt: string;
  userId?: string;
  userProfile?: Profile;
  requestId?: string;
  requestTitle?: string;
  cardId?: string;
}

interface AdminMediaGalleryProps {
  onOpenAccount: (profile: Profile) => void;
  onOpenRequest: (requestId: string) => void;
}

export function AdminMediaGallery({
  onOpenAccount,
  onOpenRequest,
}: AdminMediaGalleryProps) {
  const { lang, formatDate, formatRole } = useI18n();

  const [loading, setLoading] = useState(true);
  const [mediaList, setMediaList] = useState<AdminMediaItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'request_image' | 'id' | 'avatar'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox zoom
  const [activeZoomMedia, setActiveZoomMedia] = useState<AdminMediaItem | null>(null);

  const loadAllPlatformMedia = async () => {
    setLoading(true);
    try {
      const items: AdminMediaItem[] = [];

      // 1. Fetch profiles to get avatars and ID cards
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const profilesMap = new Map<string, Profile>();
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap.set(p.id, p);

          // Avatar
          const avUrl = p.avatar_url || (p as any)?.['profile photo'];
          if (avUrl) {
            items.push({
              id: `avatar-${p.id}`,
              url: avUrl,
              type: 'avatar',
              title: lang === 'ar' ? 'صورة شخصية' : 'Profile Avatar',
              subtitle: p.full_name || p.email || 'User',
              createdAt: p.created_at,
              userId: p.id,
              userProfile: p,
            });
          }

          // ID Card Front
          const frontUrl = p.front_card || (p as any)?.['front card'];
          if (frontUrl) {
            items.push({
              id: `front-${p.id}`,
              url: frontUrl,
              type: 'id_front',
              title: lang === 'ar' ? 'بطاقة الرقم القومي (وجه أمامي)' : 'National ID (Front)',
              subtitle: p.full_name || 'Technician',
              createdAt: p.created_at,
              userId: p.id,
              userProfile: p,
              cardId: p.card_id || (p as any)?.['card id'],
            });
          }

          // ID Card Back
          const backUrl = p.back_card || (p as any)?.['back card'];
          if (backUrl) {
            items.push({
              id: `back-${p.id}`,
              url: backUrl,
              type: 'id_back',
              title: lang === 'ar' ? 'بطاقة الرقم القومي (وجه خلفي)' : 'National ID (Back)',
              subtitle: p.full_name || 'Technician',
              createdAt: p.created_at,
              userId: p.id,
              userProfile: p,
              cardId: p.card_id || (p as any)?.['card id'],
            });
          }
        });
      }

      // 2. Fetch requests and their images
      const { data: requestsData } = await supabase
        .from('service_requests')
        .select(`
          id,
          customer_id,
          technician_id,
          description,
          created_at,
          service:services(name_ar, name_en)
        `);

      const requestsMap = new Map<string, any>();
      if (requestsData) {
        requestsData.forEach(r => requestsMap.set(r.id, r));
      }

      // 3. Fetch all request_images
      const { data: requestImagesData } = await supabase
        .from('request_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestImagesData) {
        requestImagesData.forEach((img: RequestImage) => {
          const req = requestsMap.get(img.request_id);
          const customer = req ? profilesMap.get(req.customer_id) : undefined;
          const svcName = req?.service
            ? lang === 'ar'
              ? req.service.name_ar
              : req.service.name_en
            : lang === 'ar'
            ? 'طلب فحص وصيانة'
            : 'Inspection';

          items.push({
            id: `req-img-${img.id}`,
            url: img.file_url,
            type: 'request_image',
            title: svcName,
            subtitle: req?.description
              ? req.description.slice(0, 70) + (req.description.length > 70 ? '...' : '')
              : undefined,
            createdAt: img.created_at || req?.created_at || new Date().toISOString(),
            userId: req?.customer_id,
            userProfile: customer,
            requestId: img.request_id,
            requestTitle: svcName,
          });
        });
      }

      // Sort all media by created_at descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setMediaList(items);
    } catch (err) {
      console.error('Error fetching admin media gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPlatformMedia();
  }, []);

  // Filter & Search
  const filteredMedia = mediaList.filter(item => {
    // Type filter
    if (filterType === 'request_image' && item.type !== 'request_image') return false;
    if (filterType === 'id' && item.type !== 'id_front' && item.type !== 'id_back') return false;
    if (filterType === 'avatar' && item.type !== 'avatar') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const userName = item.userProfile?.full_name?.toLowerCase() || '';
      const userPhone = item.userProfile?.phone?.toLowerCase() || '';
      const userEmail = item.userProfile?.email?.toLowerCase() || '';
      const title = item.title.toLowerCase();
      const sub = item.subtitle?.toLowerCase() || '';
      const card = item.cardId?.toLowerCase() || '';

      const match =
        userName.includes(q) ||
        userPhone.includes(q) ||
        userEmail.includes(q) ||
        title.includes(q) ||
        sub.includes(q) ||
        card.includes(q);

      if (!match) return false;
    }

    return true;
  });

  const countAll = mediaList.length;
  const countRequests = mediaList.filter(m => m.type === 'request_image').length;
  const countIds = mediaList.filter(m => m.type === 'id_front' || m.type === 'id_back').length;
  const countAvatars = mediaList.filter(m => m.type === 'avatar').length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Overview Stats */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {lang === 'ar' ? 'معرض كافة الصور والوسائط في المنصة' : 'All Platform Media & Photos Explorer'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ar'
                ? 'وصول إداري مباشر لكافة الصور المرفوعة من قبل العملاء والفنيين (صور الفحص، بطاقات الهوية، والصور الشخصية).'
                : 'Direct administrator access to all images uploaded by customers and specialists.'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadAllPlatformMedia}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'ar' ? 'تحديث المعرض' : 'Refresh'}</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div
            onClick={() => setFilterType('all')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="block text-[11px] opacity-80">{lang === 'ar' ? 'إجمالي الصور' : 'Total Media'}</span>
            <span className="text-lg font-extrabold">{countAll}</span>
          </div>

          <div
            onClick={() => setFilterType('request_image')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterType === 'request_image'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/60 text-blue-900 border-blue-200 hover:bg-blue-100/60'
            }`}
          >
            <span className="block text-[11px] opacity-80">{lang === 'ar' ? 'صور فحص الأعطال' : 'Inspection Photos'}</span>
            <span className="text-lg font-extrabold">{countRequests}</span>
          </div>

          <div
            onClick={() => setFilterType('id')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterType === 'id'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100/60'
            }`}
          >
            <span className="block text-[11px] opacity-80">{lang === 'ar' ? 'بطاقات الرقم القومي' : 'National ID Cards'}</span>
            <span className="text-lg font-extrabold">{countIds}</span>
          </div>

          <div
            onClick={() => setFilterType('avatar')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterType === 'avatar'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50/60 text-purple-900 border-purple-200 hover:bg-purple-100/60'
            }`}
          >
            <span className="block text-[11px] opacity-80">{lang === 'ar' ? 'الصور الشخصية' : 'User Avatars'}</span>
            <span className="text-lg font-extrabold">{countAvatars}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 rtl:right-3 ltr:left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'بحث باسم صاحب الحساب، رقم الهاتف، الرقم القومي، أو وصف الطلب...'
                  : 'Search by user name, phone, national ID, or request...'
              }
              className="w-full text-xs pl-3 pr-9 rtl:pr-9 ltr:pl-9 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 rtl:left-3 ltr:right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {lang === 'ar' ? `عرض ${filteredMedia.length} صورة من أصل ${countAll}` : `Showing ${filteredMedia.length} of ${countAll} photos`}
          </div>
        </div>
      </div>

      {/* Grid of Media */}
      {loading ? (
        <LoadingState rows={4} />
      ) : filteredMedia.length === 0 ? (
        <EmptyState
          title={lang === 'ar' ? 'لا توجد صور مطابقة' : 'No photos found'}
          description={
            lang === 'ar'
              ? 'جرّب تغيير عبارة البحث أو اختيار تصنيف مختلف من الأعلى.'
              : 'Try changing your search keywords or filter category.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredMedia.map(item => {
            const isId = item.type === 'id_front' || item.type === 'id_back';
            const isReq = item.type === 'request_image';
            const isAvatar = item.type === 'avatar';

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
              >
                {/* Image Container with zoom trigger */}
                <div
                  onClick={() => setActiveZoomMedia(item)}
                  className="relative h-44 bg-slate-100 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <span className="p-2.5 rounded-full bg-white/20 backdrop-blur-xs hover:bg-white/30 transition-colors shadow-sm">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Category Badge */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${
                      isId
                        ? 'bg-amber-600 text-white'
                        : isReq
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {isId
                      ? item.type === 'id_front'
                        ? lang === 'ar'
                          ? 'بطاقة (وجه أمامي)'
                          : 'ID Front'
                        : lang === 'ar'
                        ? 'بطاقة (وجه خلفي)'
                        : 'ID Back'
                      : isReq
                      ? lang === 'ar'
                        ? 'فحص عطل'
                        : 'Inspection'
                      : lang === 'ar'
                      ? 'صورة شخصية'
                      : 'Avatar'}
                  </span>
                </div>

                {/* Content description & uploader */}
                <div className="p-3 bg-white flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1" title={item.title}>
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.subtitle}>
                        {item.subtitle}
                      </p>
                    )}
                    {item.cardId && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-800 font-mono font-bold mt-1 bg-amber-50 px-1.5 py-0.5 rounded w-max">
                        <IdCard className="w-3 h-3" />
                        <span>{item.cardId}</span>
                      </div>
                    )}
                  </div>

                  {/* Uploader Card */}
                  {item.userProfile && (
                    <div
                      onClick={() => onOpenAccount(item.userProfile!)}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer flex items-center justify-between gap-1.5"
                      title={lang === 'ar' ? 'عرض كامل بيانات الحساب' : 'View Full Account'}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.userProfile.avatar_url ? (
                          <img
                            src={item.userProfile.avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                            {(item.userProfile.full_name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-slate-800 truncate">
                          {item.userProfile.full_name || 'مستخدم'}
                        </span>
                      </div>
                      <span className="text-[9px] text-amber-800 font-bold underline shrink-0">
                        {lang === 'ar' ? 'الحساب' : 'Profile'}
                      </span>
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <span className="truncate">{formatDate(item.createdAt)}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.requestId && (
                        <button
                          type="button"
                          onClick={() => onOpenRequest(item.requestId!)}
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                          title={lang === 'ar' ? 'عرض تفاصيل الطلب' : 'Open Request'}
                        >
                          <span>{lang === 'ar' ? 'الطلب' : 'Req'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <a
                        href={item.url}
                        download={`media-${item.id}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-900 p-1"
                        title={lang === 'ar' ? 'تحميل الصورة' : 'Download'}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeZoomMedia && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveZoomMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between py-2 text-white text-xs font-semibold mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{activeZoomMedia.title}</span>
                {activeZoomMedia.subtitle && (
                  <span className="text-slate-400 font-mono">({activeZoomMedia.subtitle})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeZoomMedia.url}
                  download={`full-${activeZoomMedia.id}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تحميل الصورة' : 'Download'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveZoomMedia(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="rounded-2xl overflow-hidden border border-white/20 bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={activeZoomMedia.url}
                alt={activeZoomMedia.title}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl"
              />
            </div>

            {/* Bottom info bar */}
            <div className="w-full flex items-center justify-between pt-2 text-slate-300 text-xs">
              <div className="flex items-center gap-3">
                {activeZoomMedia.userProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      const prof = activeZoomMedia.userProfile;
                      setActiveZoomMedia(null);
                      if (prof) onOpenAccount(prof);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ar' ? 'عرض كامل معلومات حساب: ' : 'View Full Account: '}
                      {activeZoomMedia.userProfile.full_name}
                    </span>
                  </button>
                )}
                {activeZoomMedia.cardId && (
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300">
                    {lang === 'ar' ? 'الرقم القومي: ' : 'ID: '}
                    {activeZoomMedia.cardId}
                  </span>
                )}
              </div>

              {activeZoomMedia.requestId && (
                <button
                  type="button"
                  onClick={() => {
                    const rId = activeZoomMedia.requestId;
                    setActiveZoomMedia(null);
                    if (rId) onOpenRequest(rId);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'الانتقال لطلب الصيانة' : 'Open Request'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
