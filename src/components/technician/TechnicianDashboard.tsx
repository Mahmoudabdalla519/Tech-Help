import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import {
  ServiceRequest,
  TechnicianProfile,
  RequestStatus,
} from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { RequestDetailModal } from '../customer/RequestDetailModal';
import {
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  HardHat,
  Star,
  Eye,
  Loader2,
  Navigation,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  IdCard,
  Zap,
  Image as ImageIcon,
  Maximize2,
  X,
  Filter,
} from 'lucide-react';
import {
  matchesTechnicianProfession,
  detectSpecialtyCategory,
} from '../../lib/specialtyMatcher';

export function TechnicianDashboard() {
  const { user, profile, isAccountActive, updateProfileState } = useAuth();
  const { t, lang, formatDate, formatStatus } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'available' | 'my_jobs' | 'profile' | 'location'>('available');
  const [techProfile, setTechProfile] = useState<TechnicianProfile | null>(null);
  const [, setLoadingProfile] = useState(true);

  // Available requests (pending, technician_id is null)
  const [availableRequests, setAvailableRequests] = useState<ServiceRequest[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);

  // Filter requests strictly for this technician's specialty (e.g. Electricity only for electricity)
  const [onlyMySpecialty, setOnlyMySpecialty] = useState<boolean>(true);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // My assigned requests (technician_id = user.id)
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(true);
  const [myJobsStatusFilter, setMyJobsStatusFilter] = useState<'all' | 'accepted' | 'in_progress' | 'completed'>('all');

  // Modals & detail view
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  // Profile fields for editing
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [skills, setSkills] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Location fields
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const fetchTechProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('technician_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching technician profile:', error);
      } else if (data) {
        setTechProfile(data);
        setHeadline(data.headline || '');
        setBio(data.bio || '');
        setYearsExperience(data.years_experience || 0);
        setHourlyRate(data.hourly_rate || 0);
        setSkills(
          Array.isArray(data.skills)
            ? data.skills.join(', ')
            : typeof data.skills === 'string'
            ? data.skills
            : ''
        );
        setIsAvailable(data.is_available !== false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchAvailableRequests = async () => {
    setLoadingAvailable(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .eq('status', 'pending')
        .is('technician_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching available requests:', error);
      } else {
        const rawReqs = (data as ServiceRequest[]) || [];
        if (rawReqs.length > 0) {
          try {
            const reqIds = rawReqs.map(r => r.id);
            const { data: imgRows } = await supabase
              .from('request_images')
              .select('*')
              .in('request_id', reqIds)
              .order('created_at', { ascending: true });

            const imgMap: Record<string, string[]> = {};
            imgRows?.forEach(row => {
              if (!imgMap[row.request_id]) imgMap[row.request_id] = [];
              imgMap[row.request_id].push(row.file_url);
            });

            rawReqs.forEach(r => {
              r.images = imgMap[r.id] || [];
            });
          } catch (imgErr) {
            console.warn('Could not load request images:', imgErr);
          }
        }
        setAvailableRequests(rawReqs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchMyJobs = async () => {
    if (!user) return;
    setLoadingMyRequests(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .eq('technician_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assigned requests:', error);
      } else {
        const rawReqs = (data as ServiceRequest[]) || [];
        if (rawReqs.length > 0) {
          try {
            const reqIds = rawReqs.map(r => r.id);
            const { data: imgRows } = await supabase
              .from('request_images')
              .select('*')
              .in('request_id', reqIds)
              .order('created_at', { ascending: true });

            const imgMap: Record<string, string[]> = {};
            imgRows?.forEach(row => {
              if (!imgMap[row.request_id]) imgMap[row.request_id] = [];
              imgMap[row.request_id].push(row.file_url);
            });

            rawReqs.forEach(r => {
              r.images = imgMap[r.id] || [];
            });
          } catch (imgErr) {
            console.warn('Could not load assigned request images:', imgErr);
          }
        }
        setMyRequests(rawReqs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const fetchCurrentLocation = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('technician_locations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTechProfile();
      fetchAvailableRequests();
      fetchMyJobs();
      fetchCurrentLocation();
    }
  }, [user]);

  // Request Acceptance
  const handleAcceptRequest = async (req: ServiceRequest) => {
    if (!user) return;
    setIsProcessingAction(req.id);
    try {
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({
          technician_id: user.id,
          status: 'accepted',
        })
        .eq('id', req.id);

      if (updateError) {
        console.error('Accept request error:', updateError);
        showError(lang === 'ar' ? `خطأ أثناء قبول الطلب: ${updateError.message}` : updateError.message);
        return;
      }

      // Add status history entry
      try {
        await supabase.from('request_status_history').insert({
          request_id: req.id,
          old_status: 'pending',
          new_status: 'accepted',
          changed_by: user.id,
          note: 'قبول الطلب من الفني',
        });
      } catch (histErr) {
        console.warn('Status history notice:', histErr);
      }

      showSuccess(t.requestAcceptedSuccess);
      await fetchAvailableRequests();
      await fetchMyJobs();
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Status transitions for assigned requests
  const handleUpdateStatus = async (
    reqId: string,
    newStatus: RequestStatus,
    currentStatus: string
  ) => {
    if (!user) return;
    setIsProcessingAction(reqId);
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', reqId);

      if (error) {
        console.error('Status update error:', error);
        showError(error.message);
        return;
      }

      try {
        await supabase.from('request_status_history').insert({
          request_id: reqId,
          old_status: currentStatus,
          new_status: newStatus,
          changed_by: user.id,
          note: `تحديث الحالة إلى ${formatStatus(newStatus)}`,
        });
      } catch (histErr) {
        console.warn('History insertion notice:', histErr);
      }

      showSuccess(t.statusUpdatedSuccess);
      await fetchMyJobs();
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleSaveTechProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from('technician_profiles')
        .update({
          headline: headline.trim(),
          bio: bio.trim(),
          years_experience: Number(yearsExperience) || 0,
          hourly_rate: Number(hourlyRate) || 0,
          skills: skillsArray,
          is_available: isAvailable,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving tech profile:', error);
        showError(error.message);
      } else {
        // Also sync technician_type into profiles table
        if (headline.trim()) {
          try {
            await updateProfileState({
              technician_type: headline.trim(),
              'technician type': headline.trim(),
            });
          } catch (syncErr) {
            console.warn('Could not sync technician_type to profiles:', syncErr);
          }
        }
        showSuccess(t.saveSuccess);
        await fetchTechProfile();
        await fetchAvailableRequests();
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!user || latitude === null || longitude === null) {
      showError(lang === 'ar' ? 'يرجى إدخال أو تحديد الإحداثيات' : 'Please provide coordinates');
      return;
    }
    setIsUpdatingLocation(true);
    try {
      const { error } = await supabase
        .from('technician_locations')
        .upsert({
          user_id: user.id,
          latitude: latitude,
          longitude: longitude,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Location update error:', error);
        showError(error.message);
      } else {
        showSuccess(t.locationUpdatedSuccess);
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showError(lang === 'ar' ? 'المتصفح لا يدعم جلب الموقع' : 'Browser does not support geolocation');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
        showSuccess(
          lang === 'ar'
            ? `تم جلب إحداثيات GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
            : `GPS detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      err => {
        console.error('GPS error:', err);
        setIsLocating(false);
        showError(lang === 'ar' ? 'تعذر جلب موقع GPS' : 'Failed to retrieve GPS');
      },
      { timeout: 10000 }
    );
  };

  if (!isAccountActive) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-900 mb-2">
          {lang === 'ar' ? 'الحساب غير مفعّل' : 'Account Inactive'}
        </h3>
        <p className="text-xs text-rose-700 leading-relaxed">
          {t.accountInactiveNotice}
        </p>
      </div>
    );
  }

  const filteredMyJobs = myRequests.filter(req => {
    if (myJobsStatusFilter === 'all') return true;
    return req.status === myJobsStatusFilter;
  });

  const technicianType =
    profile?.technician_type ||
    profile?.['technician type'] ||
    techProfile?.headline ||
    '';

  const specialtyCategory = detectSpecialtyCategory(technicianType);

  const displayedAvailableRequests = availableRequests.filter(req => {
    if (!onlyMySpecialty) return true;
    return matchesTechnicianProfession(technicianType, req.service);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Pro Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <HardHat className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {t.technicianPortal}
              </h1>
              {techProfile?.is_verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.verified}</span>
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  techProfile?.is_available
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    techProfile?.is_available ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>{techProfile?.is_available ? t.available : t.busy}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile?.full_name} •{' '}
              <span className="font-semibold text-slate-800">
                {technicianType || techProfile?.headline || (lang === 'ar' ? 'أخصائي معتمد' : 'Certified Specialist')}
              </span>
            </p>
          </div>
        </div>

        {/* Rating and jobs summary metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center min-w-[90px]">
            <span className="text-slate-400 block text-[10px] mb-0.5">{t.rating}</span>
            <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">
                {techProfile?.rating ? Number(techProfile.rating).toFixed(1) : '5.0'}
              </span>
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center min-w-[90px]">
            <span className="text-slate-400 block text-[10px] mb-0.5">{lang === 'ar' ? 'المهام المنجزة' : 'Jobs Done'}</span>
            <span className="font-bold text-slate-900 text-sm tabular-nums">
              {techProfile?.completed_jobs || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 my-6 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('available')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'available'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{lang === 'ar' ? 'الطلبات المتاحة للقبول' : 'Available Requests'}</span>
          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold text-[10px] tabular-nums">
            {displayedAvailableRequests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('my_jobs')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'my_jobs'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>{lang === 'ar' ? 'مهامي المقبولة والجارية' : 'My Assigned Jobs'}</span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold text-[10px] tabular-nums">
            {myRequests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الملف المهني والمهارات' : 'Professional Profile'}</span>
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'location'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>{t.location}</span>
        </button>
      </div>

      {/* TAB 1: AVAILABLE REQUESTS */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {/* Specialty Routing Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-2xl border border-amber-300/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                <Zap className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    {lang === 'ar' ? 'توجيه طلبات تخصصك فقط:' : 'Direct routing for your specialty:'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold text-xs">
                    {technicianType || (lang === 'ar' ? 'غير محدد' : 'Unspecified')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {onlyMySpecialty
                      ? (lang === 'ar' ? 'مفعل (طلبات تخصصك فقط)' : 'Filtered to your specialty')
                      : (lang === 'ar' ? 'عرض كافة الخدمات' : 'All services')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {lang === 'ar'
                    ? 'يتم توجيه وحصر طلبات الصيانة التي تطابق مهنتك فقط (طلبات الكهرباء لفني الكهرباء فقط) لضمان الدقة وتفادي المهام الخارجة عن تخصصك.'
                    : 'Only requests matching your trade are routed and visible to your account.'}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer shrink-0 bg-white py-2 px-3 rounded-xl border border-amber-200 hover:border-amber-400 transition-colors shadow-2xs">
              <input
                type="checkbox"
                checked={onlyMySpecialty}
                onChange={e => setOnlyMySpecialty(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>{lang === 'ar' ? 'حصر طلبات تخصصي فقط' : 'Only my specialty'}</span>
            </label>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {lang === 'ar'
                ? `يتم عرض ${displayedAvailableRequests.length} طلب صيانة متاح للقبول.`
                : `Showing ${displayedAvailableRequests.length} available maintenance request(s).`}
            </span>
            <button
              onClick={fetchAvailableRequests}
              className="text-amber-700 hover:underline font-semibold cursor-pointer"
            >
              {lang === 'ar' ? 'تحديث القائمة' : 'Refresh'}
            </button>
          </div>

          {loadingAvailable ? (
            <LoadingState message={t.loadingData} rows={3} />
          ) : displayedAvailableRequests.length === 0 ? (
            <EmptyState
              title={
                onlyMySpecialty && technicianType
                  ? (lang === 'ar' ? `لا توجد طلبات معلقة لتخصص (${technicianType}) حالياً` : `No requests for (${technicianType})`)
                  : t.noData
              }
              description={
                onlyMySpecialty && technicianType
                  ? (lang === 'ar'
                      ? `تم ضبط لوحتك لعرض طلبات ${technicianType} فقط. ستظهر الطلبات الجديدة هنا فور قيام أي عميل بطلب خدمة تخص مجالك.`
                      : `Your board is set to display ${technicianType} orders only. New requests will appear here as soon as customers submit them.`)
                  : (lang === 'ar' ? 'لا توجد طلبات معلقة بانتظار فني حالياً.' : 'No available pending requests at the moment.')
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {displayedAvailableRequests.map(req => {
                const sName =
                  lang === 'ar' ? req.service?.name_ar : req.service?.name_en || 'Service';
                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {sName}
                        </span>
                        <StatusBadge status={req.status} />
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          • {formatDate(req.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                        {req.description}
                      </p>

                      {/* Problem Photos preview for the technician */}
                      {req.images && req.images.length > 0 && (
                        <div className="pt-1.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{req.images.length} {lang === 'ar' ? 'صور معاينة مرفقة من العميل' : 'photos attached'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({lang === 'ar' ? 'اضغط على الصورة للتكبير' : 'Click to zoom'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {req.images.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewPhoto(imgUrl)}
                                className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all"
                                title={lang === 'ar' ? 'اضغط للتكبير' : 'Click to zoom'}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Inspection ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {req.address_text && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.address_text}</span>
                          </span>
                        )}
                        {req.budget !== null && (
                          <span className="font-bold text-slate-800 tabular-nums">
                            {t.budget}: {req.budget} EGP
                          </span>
                        )}
                        {req.preferred_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.preferred_time}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedRequestId(req.id)}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.details}</span>
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={isProcessingAction === req.id}
                        className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessingAction === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{lang === 'ar' ? 'قبول الطلب' : 'Accept Request'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ASSIGNED JOBS */}
      {activeTab === 'my_jobs' && (
        <div className="space-y-4">
          {/* Sub-filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {(['all', 'accepted', 'in_progress', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setMyJobsStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  myJobsStatusFilter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? t.all : t[f as keyof typeof t] || f}
              </button>
            ))}
          </div>

          {loadingMyRequests ? (
            <LoadingState rows={3} />
          ) : filteredMyJobs.length === 0 ? (
            <EmptyState
              title={t.noData}
              description={
                lang === 'ar'
                  ? 'لا توجد مهام صيانة معينة لك بهذه الحالة.'
                  : 'No jobs assigned under this status.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredMyJobs.map(req => {
                const sName =
                  lang === 'ar' ? req.service?.name_ar : req.service?.name_en || 'Service';
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {sName}
                        </span>
                        <StatusBadge status={req.status} />
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          • {formatDate(req.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {req.description}
                      </p>

                      {/* Problem Photos preview for the assigned technician */}
                      {req.images && req.images.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{req.images.length} {lang === 'ar' ? 'صور المعاينة' : 'photos'}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {req.images.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewPhoto(imgUrl)}
                                className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all"
                                title={lang === 'ar' ? 'اضغط للتكبير' : 'Click to zoom'}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Inspection ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Maximize2 className="w-3 h-3" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {req.address_text && (
                          <span className="truncate max-w-[200px]">{req.address_text}</span>
                        )}
                        {req.budget !== null && (
                          <span className="tabular-nums font-semibold text-slate-700">
                            {t.budget}: {req.budget} EGP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions based on state */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        onClick={() => setSelectedRequestId(req.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.details} / المحادثة</span>
                      </button>

                      {/* State update transitions */}
                      {req.status === 'accepted' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(req.id, 'in_progress', req.status)
                          }
                          disabled={isProcessingAction === req.id}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'بدء العمل' : 'Start Job'}</span>
                        </button>
                      )}

                      {req.status === 'in_progress' && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(req.id, 'completed', req.status)
                          }
                          disabled={isProcessingAction === req.id}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إتمام العمل' : 'Complete Job'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TECHNICIAN PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-100">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Tech'}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xl shrink-0">
                {(profile?.full_name || 'ف')[0]}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900">{profile?.full_name}</h4>
              <p className="text-xs text-slate-500">{profile?.email} • {profile?.phone}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    techProfile?.is_verified
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {techProfile?.is_verified
                    ? t.verified
                    : lang === 'ar'
                      ? 'قيد مراجعة التوثيق'
                      : 'Pending Verification'}
                </span>
                {profile?.card_id && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-medium flex items-center gap-1 border border-slate-200">
                    <IdCard className="w-3 h-3 text-amber-600" />
                    <span>{lang === 'ar' ? 'الرقم القومي:' : 'National ID:'} {profile.card_id}</span>
                  </span>
                )}
                {(profile?.front_card || profile?.back_card) && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">
                    {lang === 'ar' ? 'البطاقة مرفوعة (وجه/ظهر)' : 'ID Cards Uploaded'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-4">
            {lang === 'ar' ? 'تعديل البيانات المهنية' : 'Technician Professional Details'}
          </h3>

          <form onSubmit={handleSaveTechProfile} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-900">
                  {lang === 'ar' ? 'التخصص الفني والمهنة' : 'Trade & Profession'} *
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
                  technician type
                </span>
              </div>
              <input
                type="text"
                required
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: كهربائي منازل / صيانة كهرباء' : 'e.g. Electrician'}
                className="w-full py-2 px-3 text-xs rounded-lg border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-medium"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ar' ? 'اختصارات سريعة:' : 'Quick choices:'}
                </span>
                {[
                  'كهربائي منازل / كهرباء',
                  'سباك محترف / سباكة',
                  'فني تكييف وتبريد',
                  'فني أجهزة منزلية',
                  'نجار تركيبات وأثاث',
                  'نقاش ودهانات وديكور',
                ].map(choice => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setHeadline(choice)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors border border-slate-200 cursor-pointer font-medium"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-amber-900/80 mt-1.5 leading-snug">
                {lang === 'ar'
                  ? 'يُحفظ هذا التخصص في حقل technician type بجدول profiles لحصر وتوجيه طلبات تخصصك فقط تلقائياً (مثل طلبات الكهرباء لفني الكهرباء فقط).'
                  : 'Saved into technician type in profiles to automatically filter orders for your trade only.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.bio}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب نبذة عن سنوات خبرتك والمهام السابقة...' : 'Describe your experience...'}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.experienceYears}
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={e => setYearsExperience(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.hourlyRate}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.skills} ({lang === 'ar' ? 'افصل بين المهارات بفاصلة' : 'comma-separated'})
              </label>
              <input
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="صيانة شاشات، كشف أعطال كهرباء، تركيب قواطع"
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>

            {/* Availability Toggle */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900">{t.availability}</h5>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ar'
                    ? 'عند تفعيل الحالة ستظهر في نتائج البحث للعملاء القريبين منك'
                    : 'When active, your profile is open for new customer requests'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={e => setIsAvailable(e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="py-2.5 px-5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.saveChanges}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: LOCATION */}
      {activeTab === 'location' && (
        <div className="max-w-xl bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-2">{t.updateLocation}</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {lang === 'ar'
              ? 'تحديث موقعك يساعد في اقتراح وإظهار طلبات الصيانة القريبة منك جغرافياً أولاً بأول.'
              : 'Updating your coordinates helps assign nearby technical jobs.'}
          </p>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              ) : (
                <Navigation className="w-4 h-4 text-amber-600" />
              )}
              <span>{t.detectMyLocation}</span>
            </button>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude !== null ? latitude : ''}
                  onChange={e => setLatitude(parseFloat(e.target.value) || null)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 focus:border-amber-500 outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude !== null ? longitude : ''}
                  onChange={e => setLongitude(parseFloat(e.target.value) || null)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 focus:border-amber-500 outline-none tabular-nums"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveLocation}
              disabled={isUpdatingLocation || latitude === null}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingLocation && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t.saveChanges}</span>
            </button>
          </div>
        </div>
      )}

      {/* Details modal */}
      <RequestDetailModal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
        onRequestUpdated={() => {
          fetchAvailableRequests();
          fetchMyJobs();
        }}
      />

      {/* Inspection Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-transparent"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-amber-400 transition-colors cursor-pointer"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto}
              alt="Inspection Photo Zoom"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
