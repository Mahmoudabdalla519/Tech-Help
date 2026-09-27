import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import { ServiceRequest, NotificationItem } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingState } from '../common/LoadingState';
import { EmptyState, ErrorBanner } from '../common/EmptyState';
import { CreateRequestModal } from './CreateRequestModal';
import { RequestDetailModal } from './RequestDetailModal';
import {
  Plus,
  Search,
  Filter,
  Bell,
  User,
  Eye,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export function CustomerDashboard() {
  const { user, profile, isAccountActive, updateProfileState, refreshProfile } = useAuth();
  const { t, lang, formatDate, formatRole } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'requests' | 'notifications' | 'profile'>('requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const fetchMyRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (sbError) {
        console.error('Error fetching customer requests:', sbError);
        setError(sbError.message);
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
            console.warn('Could not load customer request images:', imgErr);
          }
        }
        setRequests(rawReqs);
      }
    } catch (err: any) {
      console.error('Exception fetching requests:', err);
      setError(err?.message || 'Error');
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const { data, error: nErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!nErr && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyRequests();
      fetchNotifications();
    }
  }, [user]);

  const markNotificationRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { error } = await updateProfileState({
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || null,
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess(t.saveSuccess);
        await refreshProfile();
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus =
      statusFilter === 'all' || req.status === statusFilter;
    const sName = (lang === 'ar' ? req.service?.name_ar : req.service?.name_en) || '';
    const desc = req.description || '';
    const matchesSearch =
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Breadcrumb / Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.customerPortal}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'متابعة طلبات الصيانة، المحادثة الفورية مع الفنيين، وتحديث البيانات.'
              : 'Manage technical requests, direct messages, and tracking.'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>{t.newRequest}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 my-6 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'requests'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.myRequests} ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t.notifications}</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{lang === 'ar' ? 'ملفي الشخصي' : 'My Profile'}</span>
        </button>
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {error && <ErrorBanner message={error} onRetry={fetchMyRequests} />}

          {/* Search & Filters bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-2 ltr:left-3 rtl:right-3" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {(['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as const).map(
                st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? t.all : t[st as keyof typeof t] || st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Requests list */}
          {loadingRequests ? (
            <LoadingState message={t.loadingData} rows={3} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title={t.noData}
              description={
                lang === 'ar'
                  ? 'لم تقم بإنشاء أي طلبات صيانة بعد.'
                  : 'You have not created any service requests yet.'
              }
              actionText={t.newRequest}
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredRequests.map(req => {
                const sName =
                  lang === 'ar' ? req.service?.name_ar : req.service?.name_en || 'Service';
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      {/* Photo indicator */}
                      {req.images && req.images.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {req.images.length} {lang === 'ar' ? 'صور مرفقة' : 'photos'}
                          </span>
                          <div className="flex items-center gap-1">
                            {req.images.slice(0, 3).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="Thumb"
                                className="w-6 h-6 rounded object-cover border border-slate-200"
                              />
                            ))}
                            {req.images.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                +{req.images.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {req.address_text && (
                          <span className="truncate max-w-[200px]">
                            {req.address_text}
                          </span>
                        )}
                        {req.budget !== null && (
                          <span className="font-semibold text-slate-700 tabular-nums">
                            {t.budget}: {req.budget} EGP
                          </span>
                        )}
                        {req.final_price !== null && (
                          <span className="font-bold text-emerald-700 tabular-nums">
                            السعر: {req.final_price} EGP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedRequestId(req.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.details}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">{t.notifications}</h3>
          </div>
          {loadingNotifications ? (
            <LoadingState rows={2} />
          ) : notifications.length === 0 ? (
            <EmptyState
              title={t.noData}
              description={
                lang === 'ar'
                  ? 'لا توجد إشعارات جديدة في حسابك.'
                  : 'No notifications in your account.'
              }
            />
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                    n.is_read
                      ? 'bg-slate-50/50 border-slate-200/70 text-slate-600'
                      : 'bg-amber-50/50 border-amber-200 text-slate-900 font-medium'
                  }`}
                >
                  <div>
                    <h5 className="font-bold mb-0.5">{n.title}</h5>
                    <p className="text-[11px] leading-relaxed">{n.body}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 shrink-0 cursor-pointer"
                    >
                      {t.markAsRead}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Avatar'}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xl shrink-0">
                {(profile?.full_name || '?')[0]}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900">{profile?.full_name || t.customer}</h3>
              <p className="text-xs text-slate-500">{profile?.email}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold">
                  {formatRole(profile?.role || 'customer')}
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-slate-700">
            {lang === 'ar' ? 'تعديل البيانات الشخصية' : 'Edit Profile Information'}
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.fullName}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.phone}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'رابط الصورة الرمزية (Avatar URL)' : 'Avatar URL'}
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-left"
                dir="ltr"
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

      {/* Modals */}
      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onRequestCreated={fetchMyRequests}
      />
      <RequestDetailModal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
        onRequestUpdated={fetchMyRequests}
      />
    </div>
  );
}
