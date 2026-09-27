import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import { Company, ServiceRequest, NotificationItem } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { RequestDetailModal } from '../customer/RequestDetailModal';
import {
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  Bell,
  Briefcase,
  AlertTriangle,
  IdCard,
} from 'lucide-react';

export function CompanyDashboard() {
  const { user, profile, isAccountActive } = useAuth();
  const { t, lang, formatDate } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'requests' | 'profile' | 'notifications'>('requests');
  const [company, setCompany] = useState<Company | null>(null);
  const [, setLoadingCompany] = useState(true);

  // Requests
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Form
  const [companyName, setCompanyName] = useState('');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchCompanyData = async () => {
    if (!user) return;
    setLoadingCompany(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company:', error);
      } else if (data) {
        setCompany(data);
        setCompanyName(data.company_name || '');
        setCommercialRegister(data.commercial_register || '');
        setDescription(data.description || '');
        setLogoUrl(data.logo_url || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompany(false);
    }
  };

  const fetchCompanyRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company requests:', error);
      } else {
        setRequests(data as ServiceRequest[] || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanyData();
      fetchCompanyRequests();
      fetchNotifications();
    }
  }, [user]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: companyName.trim(),
          commercial_register: commercialRegister.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) {
        showError(error.message);
      } else {
        showSuccess(t.saveSuccess);
        await fetchCompanyData();
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {company?.company_name || t.companyPortal}
              </h1>
              {company?.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.verified}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile?.email} {company?.commercial_register ? `• سجل تجاري: ${company.commercial_register}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 my-6 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'requests'
              ? 'border-sky-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الطلبات المسندة للشركة' : 'Assigned Requests'}</span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold text-[10px] tabular-nums">
            {requests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-sky-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{lang === 'ar' ? 'بيانات وسجل الشركة' : 'Company Profile'}</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-sky-500 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t.notifications}</span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-bold text-[10px] tabular-nums">
            {notifications.length}
          </span>
        </button>
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {loadingRequests ? (
            <LoadingState rows={3} />
          ) : requests.length === 0 ? (
            <EmptyState
              title={t.noData}
              description={
                lang === 'ar'
                  ? 'لا توجد طلبات خدمة مسندة لشركتكم حالياً.'
                  : 'No service requests assigned to your company currently.'
              }
            />
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
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

      {/* TAB 2: COMPANY PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-100">
            {profile?.avatar_url || company?.logo_url ? (
              <img
                src={profile?.avatar_url || company?.logo_url || ''}
                alt={company?.company_name || 'Logo'}
                className="w-16 h-16 rounded-full object-cover border-2 border-sky-500 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-xl shrink-0">
                {(company?.company_name || 'ش')[0]}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {company?.company_name || profile?.full_name}
              </h4>
              <p className="text-xs text-slate-500">{profile?.email} • {profile?.phone}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    company?.verified
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {company?.verified
                    ? t.verified
                    : lang === 'ar'
                      ? 'قيد مراجعة السجل التجاري'
                      : 'Pending verification'}
                </span>
                {profile?.card_id && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-medium flex items-center gap-1 border border-slate-200">
                    <IdCard className="w-3 h-3 text-amber-600" />
                    <span>{lang === 'ar' ? 'الرقم القومي للمفوض:' : 'National ID:'} {profile.card_id}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-4">
            {lang === 'ar' ? 'بيانات السجل التجاري والشركة' : 'Company Profile Details'}
          </h3>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'اسم الشركة' : 'Company Name'} *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'رقم السجل التجاري' : 'Commercial Register'}
              </label>
              <input
                type="text"
                value={commercialRegister}
                onChange={e => setCommercialRegister(e.target.value)}
                placeholder="CR-12345678"
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.description}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب نبذة عن تخصصات الشركة وخدماتها...' : 'Company description...'}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'رابط شعار الشركة (Logo URL)' : 'Logo URL'}
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none text-left"
                dir="ltr"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span>{t.saveChanges}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-4">{t.notifications}</h3>
          {notifications.length === 0 ? (
            <EmptyState
              title={t.noData}
              description={
                lang === 'ar' ? 'لا توجد إشعارات حالياً.' : 'No notifications found.'
              }
            />
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 text-xs"
                >
                  <h5 className="font-bold text-slate-900 mb-0.5">{n.title}</h5>
                  <p className="text-slate-600">{n.body}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details modal */}
      <RequestDetailModal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
        onRequestUpdated={fetchCompanyRequests}
      />
    </div>
  );
}
