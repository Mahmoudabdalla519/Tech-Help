import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import {
  Profile,
  TechnicianProfile,
  Company,
  ServiceRequest,
  RequestImage,
  Review,
  Complaint,
} from '../../types/database';
import { Modal } from '../common/Modal';
import { LoadingState } from '../common/LoadingState';
import { StatusBadge } from '../common/StatusBadge';
import {
  User,
  IdCard,
  Image as ImageIcon,
  HardHat,
  Building2,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Star,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  Maximize2,
  X,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  initialProfile?: Profile | null;
  onProfileUpdated?: (updated: Profile) => void;
  onOpenRequest?: (requestId: string) => void;
}

interface LinkedPhoto {
  id: string;
  url: string;
  category: 'avatar' | 'id_front' | 'id_back' | 'request';
  title: string;
  subtitle?: string;
  requestId?: string;
  createdAt?: string;
}

export function AccountDetailsModal({
  isOpen,
  onClose,
  userId,
  initialProfile,
  onProfileUpdated,
  onOpenRequest,
}: AccountDetailsModalProps) {
  const { lang, formatDate, formatRole } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'photos' | 'requests' | 'reviews'>('photos');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [techProfile, setTechProfile] = useState<TechnicianProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<Company | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allPhotos, setAllPhotos] = useState<LinkedPhoto[]>([]);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<'all' | 'avatar' | 'id' | 'request'>('all');

  // Zoom lightbox state
  const [zoomPhoto, setZoomPhoto] = useState<LinkedPhoto | null>(null);

  // Suspension state
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Load all account data and photos
  const loadFullAccountData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Fetch fresh profile
      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const currentProfile = pData || initialProfile;
      if (currentProfile) {
        setProfile(currentProfile);
      }

      const role = currentProfile?.role;
      let fetchedTech: TechnicianProfile | null = null;
      let fetchedCompany: Company | null = null;

      // 2. If technician, load technician profile
      if (role === 'technician') {
        const { data: tData } = await supabase
          .from('technician_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (tData) {
          fetchedTech = tData;
          setTechProfile(tData);
        }
      }

      // 3. If company, load company profile
      if (role === 'company') {
        const { data: cData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (cData) {
          fetchedCompany = cData;
          setCompanyProfile(cData);
        }
      }

      // 4. Fetch linked requests
      let userRequestsQuery = supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .order('created_at', { ascending: false });

      if (role === 'customer') {
        userRequestsQuery = userRequestsQuery.eq('customer_id', userId);
      } else if (role === 'technician') {
        userRequestsQuery = userRequestsQuery.eq('technician_id', userId);
      } else if (role === 'company') {
        userRequestsQuery = userRequestsQuery.eq('company_id', userId);
      } else {
        userRequestsQuery = userRequestsQuery.eq('customer_id', userId);
      }

      const { data: rData } = await userRequestsQuery;
      const loadedRequests: ServiceRequest[] = rData || [];
      setRequests(loadedRequests);

      // 5. Fetch all request images for this account's requests
      const photosList: LinkedPhoto[] = [];

      // Add avatar if exists
      const avatarUrl =
        currentProfile?.avatar_url || (currentProfile as any)?.['profile photo'];
      if (avatarUrl) {
        photosList.push({
          id: 'avatar-' + userId,
          url: avatarUrl,
          category: 'avatar',
          title: lang === 'ar' ? 'الصورة الشخصية للحساب' : 'Profile Avatar',
          subtitle: currentProfile?.full_name || 'Avatar',
          createdAt: currentProfile?.created_at,
        });
      }

      // Add Front ID Card if exists
      const frontCard =
        currentProfile?.front_card || (currentProfile as any)?.['front card'];
      if (frontCard) {
        photosList.push({
          id: 'id-front-' + userId,
          url: frontCard,
          category: 'id_front',
          title: lang === 'ar' ? 'الوجه الأمامي لبطاقة الرقم القومي' : 'National ID Front',
          subtitle: currentProfile?.card_id
            ? `${lang === 'ar' ? 'رقم قومي: ' : 'ID: '}${currentProfile.card_id}`
            : undefined,
          createdAt: currentProfile?.created_at,
        });
      }

      // Add Back ID Card if exists
      const backCard =
        currentProfile?.back_card || (currentProfile as any)?.['back card'];
      if (backCard) {
        photosList.push({
          id: 'id-back-' + userId,
          url: backCard,
          category: 'id_back',
          title: lang === 'ar' ? 'الوجه الخلفي لبطاقة الرقم القومي' : 'National ID Back',
          subtitle: currentProfile?.card_id
            ? `${lang === 'ar' ? 'رقم قومي: ' : 'ID: '}${currentProfile.card_id}`
            : undefined,
          createdAt: currentProfile?.created_at,
        });
      }

      // If user has requests, fetch photos from request_images
      if (loadedRequests.length > 0) {
        const reqIds = loadedRequests.map(r => r.id);
        const { data: reqImagesData } = await supabase
          .from('request_images')
          .select('*')
          .in('request_id', reqIds)
          .order('created_at', { ascending: false });

        if (reqImagesData && reqImagesData.length > 0) {
          const reqMap = new Map(loadedRequests.map(r => [r.id, r]));
          reqImagesData.forEach((img: RequestImage) => {
            const req = reqMap.get(img.request_id);
            const svcName = req?.service
              ? lang === 'ar'
                ? req.service.name_ar
                : req.service.name_en
              : lang === 'ar'
              ? 'طلب صيانة'
              : 'Maintenance Request';

            photosList.push({
              id: img.id,
              url: img.file_url,
              category: 'request',
              title: `${lang === 'ar' ? 'صورة فحص: ' : 'Inspection: '}${svcName}`,
              subtitle: req?.description
                ? req.description.slice(0, 60) + (req.description.length > 60 ? '...' : '')
                : undefined,
              requestId: img.request_id,
              createdAt: img.created_at,
            });
          });
        }
      }

      setAllPhotos(photosList);

      // 6. Fetch reviews
      let reviewsQuery = supabase.from('reviews').select('*');
      if (role === 'technician') {
        reviewsQuery = reviewsQuery.eq('technician_id', userId);
      } else {
        reviewsQuery = reviewsQuery.eq('customer_id', userId);
      }
      const { data: revData } = await reviewsQuery;
      setReviews(revData || []);

      // 7. Fetch complaints
      let compQuery = supabase.from('complaints').select('*');
      if (role === 'technician') {
        compQuery = compQuery.eq('technician_id', userId);
      } else {
        compQuery = compQuery.eq('complainant_id', userId);
      }
      const { data: compData } = await compQuery;
      setComplaints(compData || []);
    } catch (err) {
      console.error('Error fetching full account data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadFullAccountData();
    }
  }, [isOpen, userId]);

  // Handle status toggle (Suspend / Activate)
  const handleToggleActiveStatus = async () => {
    if (!profile) return;
    setIsSuspending(true);
    try {
      const nextActive = !profile.is_active;
      const reasonToSave = nextActive ? null : suspensionReason.trim() || 'إيقاف إداري بواسطة المشرف';

      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: nextActive,
          reason: reasonToSave,
        })
        .eq('id', profile.id);

      if (error) {
        showError(error.message);
      } else {
        const updated: Profile = {
          ...profile,
          is_active: nextActive,
          reason: reasonToSave,
        };
        setProfile(updated);
        setShowSuspendInput(false);
        setSuspensionReason('');
        showSuccess(
          nextActive
            ? lang === 'ar'
              ? 'تم تنشيط الحساب بنجاح'
              : 'Account activated'
            : lang === 'ar'
            ? 'تم إيقاف الحساب وحفظ السبب'
            : 'Account suspended'
        );
        onProfileUpdated?.(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuspending(false);
    }
  };

  // Toggle Technician Verification
  const handleToggleVerification = async () => {
    if (!profile || profile.role !== 'technician') return;
    try {
      const nextVer = !techProfile?.is_verified;
      const { error } = await supabase
        .from('technician_profiles')
        .update({ is_verified: nextVer })
        .eq('user_id', profile.id);

      if (error) {
        showError(error.message);
      } else {
        setTechProfile(prev => (prev ? { ...prev, is_verified: nextVer } : null));
        showSuccess(
          nextVer
            ? lang === 'ar'
              ? 'تم توثيق الفني بنجاح'
              : 'Technician verified'
            : lang === 'ar'
            ? 'تم إلغاء توثيق الفني'
            : 'Technician unverified'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showSuccess(lang === 'ar' ? 'تم نسخ المعرف إلى الحافظة' : 'Copied to clipboard');
  };

  if (!isOpen) return null;

  const techType =
    profile?.technician_type ||
    (profile as any)?.['technician type'] ||
    techProfile?.headline ||
    null;

  const filteredPhotos = allPhotos.filter(p => {
    if (selectedPhotoCategory === 'all') return true;
    if (selectedPhotoCategory === 'avatar') return p.category === 'avatar';
    if (selectedPhotoCategory === 'id') return p.category === 'id_front' || p.category === 'id_back';
    if (selectedPhotoCategory === 'request') return p.category === 'request';
    return true;
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="4xl"
        title={
          lang === 'ar'
            ? `كافة معلومات الحساب والصور: ${profile?.full_name || 'المستخدم'}`
            : `Full Account Details & Photos: ${profile?.full_name || 'User'}`
        }
      >
        <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1">
          {loading ? (
            <LoadingState rows={4} />
          ) : !profile ? (
            <div className="py-12 text-center text-slate-500">
              {lang === 'ar' ? 'تعذر العثور على بيانات الحساب' : 'Account data not found'}
            </div>
          ) : (
            <>
              {/* Header Hero Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar with click to enlarge */}
                    <div
                      onClick={() => {
                        const av = allPhotos.find(p => p.category === 'avatar');
                        if (av) setZoomPhoto(av);
                      }}
                      className="relative group cursor-pointer"
                      title={lang === 'ar' ? 'اضغط لتكبير الصورة الشخصية' : 'Click to enlarge avatar'}
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || 'User'}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-2xl group-hover:scale-105 transition-transform">
                          {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Name, Role & Status */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                          {profile.full_name || (lang === 'ar' ? 'بدون اسم' : 'Unnamed User')}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                          {formatRole(profile.role)}
                        </span>
                        {profile.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{lang === 'ar' ? 'حساب نشط' : 'Active'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>{lang === 'ar' ? 'حساب معطل / محظور' : 'Suspended'}</span>
                          </span>
                        )}
                        {techProfile?.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>{lang === 'ar' ? 'فني موثق' : 'Verified'}</span>
                          </span>
                        )}
                      </div>

                      {/* Technician Type Badge if applicable */}
                      {profile.role === 'technician' && techType && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg w-max border border-amber-500/20">
                          <Wrench className="w-3.5 h-3.5 text-amber-400" />
                          <span>{lang === 'ar' ? 'التخصص الفني: ' : 'Trade: '}</span>
                          <span className="font-bold underline decoration-amber-400/50">{techType}</span>
                        </div>
                      )}

                      {/* Contact Info Pills */}
                      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{profile.email || '—'}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{profile.phone || '—'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(profile.id)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          title="Click to copy User ID"
                        >
                          {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>ID: {profile.id.slice(0, 8)}...</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions in Hero */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {profile.role === 'technician' && (
                      <button
                        type="button"
                        onClick={handleToggleVerification}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          techProfile?.is_verified
                            ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {techProfile?.is_verified
                            ? lang === 'ar'
                              ? 'إلغاء التوثيق'
                              : 'Revoke Verification'
                            : lang === 'ar'
                            ? 'توثيق الفني الآن'
                            : 'Verify Technician'}
                        </span>
                      </button>
                    )}

                    {profile.is_active ? (
                      <button
                        type="button"
                        onClick={() => setShowSuspendInput(!showSuspendInput)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تعطيل الحساب' : 'Suspend'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSuspending}
                        onClick={handleToggleActiveStatus}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSuspending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{lang === 'ar' ? 'إعادة تنشيط الحساب' : 'Reactivate'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Suspension Banner if Suspended */}
                {!profile.is_active && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{lang === 'ar' ? 'سبب التعطيل الحالي: ' : 'Suspension Reason: '}</span>
                      <span>{profile.reason || (lang === 'ar' ? 'بدون سبب مسجل' : 'No reason recorded')}</span>
                    </div>
                  </div>
                )}

                {/* Inline Suspend Input if toggled */}
                {showSuspendInput && profile.is_active && (
                  <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-rose-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-200">
                      <span>{lang === 'ar' ? 'تأكيد تعطيل الحساب وتحديد السبب' : 'Specify Suspension Reason'}</span>
                      <button
                        type="button"
                        onClick={() => setShowSuspendInput(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={suspensionReason}
                      onChange={e => setSuspensionReason(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'اكتب سبب الإيقاف والحظر بدقة (سيظهر للمستخدم)...'
                          : 'Enter suspension reason (visible to user)...'
                      }
                      className="w-full p-2 text-xs rounded-lg bg-slate-900/90 text-white border border-slate-700 focus:border-rose-400 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSuspendInput(false)}
                        className="px-3 py-1 rounded text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        disabled={isSuspending}
                        onClick={handleToggleActiveStatus}
                        className="px-3 py-1 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1"
                      >
                        {isSuspending && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>{lang === 'ar' ? 'تأكيد الحظر' : 'Confirm Suspension'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold pb-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('photos')}
                  className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeSubTab === 'photos'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'كافة صور الحساب' : 'All Account Photos'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeSubTab === 'photos' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {allPhotos.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('info')}
                  className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeSubTab === 'info'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'معلومات الحساب التفصيلية' : 'Full Profile Info'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('requests')}
                  className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeSubTab === 'requests'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'الطلبات والمهام' : 'Requests & Jobs'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeSubTab === 'requests' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {requests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('reviews')}
                  className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeSubTab === 'reviews'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'التقييمات والشكاوى' : 'Reviews & Disputes'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeSubTab === 'reviews' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {reviews.length + complaints.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: ALL PHOTOS (اوسل لي كل السور) */}
              {activeSubTab === 'photos' && (
                <div className="space-y-4">
                  {/* Photo Filter Pills */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoCategory('all')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          selectedPhotoCategory === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lang === 'ar' ? 'جميع الصور' : 'All Photos'} ({allPhotos.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoCategory('id')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          selectedPhotoCategory === 'id'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        {lang === 'ar' ? 'بطاقة الرقم القومي' : 'ID Cards'} (
                        {allPhotos.filter(p => p.category === 'id_front' || p.category === 'id_back').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoCategory('request')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          selectedPhotoCategory === 'request'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        {lang === 'ar' ? 'صور الطلبات والفحص' : 'Request Inspections'} (
                        {allPhotos.filter(p => p.category === 'request').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoCategory('avatar')}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                          selectedPhotoCategory === 'avatar'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                        }`}
                      >
                        {lang === 'ar' ? 'الصورة الشخصية' : 'Avatar'} (
                        {allPhotos.filter(p => p.category === 'avatar').length})
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      {lang === 'ar'
                        ? 'اضغط على أي صورة لتكبيرها وفحصها بجودة عالية'
                        : 'Click any photo to zoom in full resolution'}
                    </div>
                  </div>

                  {/* Photos Grid */}
                  {filteredPhotos.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">
                        {lang === 'ar' ? 'لا توجد صور مرفوعة في هذا التصنيف' : 'No photos uploaded in this category'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {lang === 'ar'
                          ? 'عندما يقوم المستخدم برفع صور لفحص الأعطال أو بطاقة الرقم القومي ستظهر هنا مباشرة.'
                          : 'Photos uploaded for inspections or verification will appear here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {filteredPhotos.map(photo => {
                        const isId = photo.category === 'id_front' || photo.category === 'id_back';
                        const isReq = photo.category === 'request';
                        const isAvatar = photo.category === 'avatar';

                        return (
                          <div
                            key={photo.id}
                            className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                          >
                            {/* Image container */}
                            <div
                              onClick={() => setZoomPhoto(photo)}
                              className="relative h-40 bg-slate-100 cursor-pointer overflow-hidden flex items-center justify-center"
                            >
                              <img
                                src={photo.url}
                                alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                                <span className="p-2 rounded-full bg-white/20 backdrop-blur-xs hover:bg-white/30 transition-colors">
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
                                  ? lang === 'ar'
                                    ? photo.category === 'id_front'
                                      ? 'بطاقة (وجه أمامي)'
                                      : 'بطاقة (وجه خلفي)'
                                    : 'ID Card'
                                  : isReq
                                  ? lang === 'ar'
                                    ? 'فحص عطل'
                                    : 'Inspection'
                                  : lang === 'ar'
                                  ? 'شخصية'
                                  : 'Avatar'}
                              </span>
                            </div>

                            {/* Details footer */}
                            <div className="p-2.5 bg-white flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1" title={photo.title}>
                                  {photo.title}
                                </h4>
                                {photo.subtitle && (
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-mono">
                                    {photo.subtitle}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400">
                                <span>{photo.createdAt ? formatDate(photo.createdAt) : '—'}</span>
                                <div className="flex items-center gap-1">
                                  {photo.requestId && onOpenRequest && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenRequest(photo.requestId!)}
                                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                                      title={lang === 'ar' ? 'عرض تفاصيل الطلب' : 'View Request'}
                                    >
                                      <span>{lang === 'ar' ? 'الطلب' : 'Req'}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  <a
                                    href={photo.url}
                                    download={`photo-${photo.id}.jpg`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-500 hover:text-slate-800 p-1"
                                    title={lang === 'ar' ? 'تحميل الصورة' : 'Download'}
                                  >
                                    <Download className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FULL ACCOUNT INFO */}
              {activeSubTab === 'info' && (
                <div className="space-y-4">
                  {/* Grid of account data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic details box */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                        <User className="w-4 h-4 text-slate-700" />
                        <span>{lang === 'ar' ? 'البيانات الشخصية والاتصال' : 'Personal & Contact Details'}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</span>
                          <span className="font-bold text-slate-900">{profile.full_name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                          <span className="font-mono text-slate-800">{profile.email || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                          <span className="font-mono font-bold text-slate-900">{profile.phone || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'نوع الحساب:' : 'Role:'}</span>
                          <span className="font-bold text-slate-800">{formatRole(profile.role)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'تاريخ التسجيل:' : 'Registered At:'}</span>
                          <span className="text-slate-700">{formatDate(profile.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'حالة الحساب:' : 'Account Status:'}</span>
                          <span className={`font-bold ${profile.is_active ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {profile.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Suspended')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Verification & National ID box */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                        <IdCard className="w-4 h-4 text-amber-600" />
                        <span>{lang === 'ar' ? 'بيانات الهوية والتحقق' : 'Identification & Verification'}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">{lang === 'ar' ? 'الرقم القومي (card_id):' : 'National ID:'}</span>
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {profile.card_id || (profile as any)?.['card id'] || (lang === 'ar' ? 'غير مسجل' : 'Not recorded')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'صورة وجه البطاقة:' : 'ID Front Photo:'}</span>
                          <span className="font-semibold text-slate-800">
                            {profile.front_card || (profile as any)?.['front card']
                              ? lang === 'ar'
                                ? '✓ مرفوعة ومسجلة'
                                : 'Uploaded'
                              : lang === 'ar'
                              ? '✗ غير مرفوعة'
                              : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'صورة ظهر البطاقة:' : 'ID Back Photo:'}</span>
                          <span className="font-semibold text-slate-800">
                            {profile.back_card || (profile as any)?.['back card']
                              ? lang === 'ar'
                                ? '✓ مرفوعة ومسجلة'
                                : 'Uploaded'
                              : lang === 'ar'
                              ? '✗ غير مرفوعة'
                              : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ar' ? 'توثيق الحساب:' : 'Verification:'}</span>
                          <span className="font-bold text-slate-800">
                            {techProfile?.is_verified ? (
                              <span className="text-emerald-700">✓ {lang === 'ar' ? 'موثق رسمياً' : 'Verified'}</span>
                            ) : (
                              <span className="text-slate-500">{lang === 'ar' ? 'غير موثق' : 'Unverified'}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technician Specific Box */}
                  {profile.role === 'technician' && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 border-b border-amber-200/80 pb-2">
                        <HardHat className="w-4 h-4 text-amber-700" />
                        <span>{lang === 'ar' ? 'بيانات ملف الفني وخبراته (Technician Profile)' : 'Technician Trade & Experience'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'المهنة / التخصص (technician type)' : 'Specialty Type'}</span>
                          <span className="font-bold text-amber-950 text-sm">{techType || '—'}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'سنوات الخبرة' : 'Experience Years'}</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {techProfile?.years_experience || 0} {lang === 'ar' ? 'سنوات' : 'yrs'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'متوسط التقييم' : 'Rating'}</span>
                          <span className="font-bold text-amber-700 text-sm">
                            ★ {techProfile?.rating ? Number(techProfile.rating).toFixed(1) : '—'} ({techProfile?.reviews_count || 0})
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'المهام المكتملة' : 'Completed Jobs'}</span>
                          <span className="font-bold text-emerald-800 text-sm">{techProfile?.completed_jobs || 0}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'الحالة الحالية' : 'Availability'}</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {techProfile?.is_available ? (
                              <span className="text-emerald-700">{lang === 'ar' ? 'متاح لاستقبال طلبات' : 'Available'}</span>
                            ) : (
                              <span className="text-slate-500">{lang === 'ar' ? 'مشغول حالياً' : 'Busy'}</span>
                            )}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'سعر المعاينة / الساعة' : 'Hourly / Base Rate'}</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {techProfile?.hourly_rate ? `${techProfile.hourly_rate} ج.م` : '—'}
                          </span>
                        </div>
                      </div>

                      {techProfile?.bio && (
                        <div className="p-3 bg-white rounded-lg border border-amber-200/60 text-xs">
                          <span className="block font-bold text-slate-800 mb-1">{lang === 'ar' ? 'النبذة التعريفية (Bio):' : 'Bio:'}</span>
                          <p className="text-slate-600 leading-relaxed">{techProfile.bio}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Company Specific Box */}
                  {profile.role === 'company' && companyProfile && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-950 border-b border-blue-200/80 pb-2">
                        <Building2 className="w-4 h-4 text-blue-700" />
                        <span>{lang === 'ar' ? 'بيانات الشركة والسجل التجاري' : 'Company & Commercial Registration'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-white rounded-lg border border-blue-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'اسم الشركة' : 'Company Name'}</span>
                          <span className="font-bold text-slate-900 text-sm">{companyProfile.company_name}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-blue-200/60">
                          <span className="block text-[11px] text-slate-500">{lang === 'ar' ? 'رقم السجل التجاري' : 'Commercial Register'}</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">{companyProfile.commercial_register || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REQUESTS & JOBS */}
              {activeSubTab === 'requests' && (
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                      {lang === 'ar' ? 'لا توجد طلبات صيانة مسجلة لهذا الحساب حتى الآن' : 'No service requests recorded yet'}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {requests.map(req => (
                        <div
                          key={req.id}
                          className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {req.service ? (lang === 'ar' ? req.service.name_ar : req.service.name_en) : 'طلب صيانة'}
                              </span>
                              <StatusBadge status={req.status} />
                            </div>
                            <p className="text-slate-600 line-clamp-1">{req.description || 'بدون وصف'}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span>{formatDate(req.created_at)}</span>
                              {req.budget && <span className="font-semibold text-slate-700">{req.budget} ج.م</span>}
                              {req.address_text && <span className="truncate max-w-xs">{req.address_text}</span>}
                            </div>
                          </div>

                          {onOpenRequest && (
                            <button
                              type="button"
                              onClick={() => onOpenRequest(req.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{lang === 'ar' ? 'تفاصيل الطلب' : 'View'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: REVIEWS & COMPLAINTS */}
              {activeSubTab === 'reviews' && (
                <div className="space-y-4">
                  {/* Reviews Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{lang === 'ar' ? 'التقييمات والآراء' : 'Reviews & Ratings'} ({reviews.length})</span>
                    </h3>
                    {reviews.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {lang === 'ar' ? 'لا توجد تقييمات مسجلة' : 'No reviews recorded'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {reviews.map(rev => (
                          <div key={rev.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-700">★ {rev.rating} / 5</span>
                              <span className="text-[10px] text-slate-400">{formatDate(rev.created_at)}</span>
                            </div>
                            {rev.comment && <p className="text-slate-700">{rev.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Complaints Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>{lang === 'ar' ? 'الشكاوى والنزاعات المسجلة' : 'Complaints & Disputes'} ({complaints.length})</span>
                    </h3>
                    {complaints.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {lang === 'ar' ? 'لا توجد شكاوى مسجلة على هذا الحساب' : 'No complaints recorded'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {complaints.map(comp => (
                          <div key={comp.id} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-900">{comp.subject}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                                {comp.status}
                              </span>
                            </div>
                            <p className="text-slate-700">{comp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </Modal>

      {/* High-Resolution Zoom Lightbox */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between py-2 text-white text-xs font-semibold mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{zoomPhoto.title}</span>
                {zoomPhoto.subtitle && <span className="text-slate-400 font-mono">({zoomPhoto.subtitle})</span>}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={zoomPhoto.url}
                  download={`full-${zoomPhoto.id}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تحميل الصورة' : 'Download'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setZoomPhoto(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="rounded-2xl overflow-hidden border border-white/20 bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={zoomPhoto.url}
                alt={zoomPhoto.title}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl"
              />
            </div>

            {/* Bottom info */}
            <div className="w-full flex items-center justify-between pt-2 text-slate-400 text-[11px]">
              <span>{zoomPhoto.createdAt ? formatDate(zoomPhoto.createdAt) : ''}</span>
              {zoomPhoto.requestId && onOpenRequest && (
                <button
                  type="button"
                  onClick={() => {
                    setZoomPhoto(null);
                    onOpenRequest(zoomPhoto.requestId!);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'الانتقال لطلب الصيانة المرتبط' : 'Open Linked Request'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
