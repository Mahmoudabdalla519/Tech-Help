import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import {
  Profile,
  Service,
  TechnicianProfile,
  Company,
  ServiceRequest,
  Review,
  Complaint,
  Payment,
} from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { RequestDetailModal } from '../customer/RequestDetailModal';
import { AccountDetailsModal } from './AccountDetailsModal';
import { AdminMediaGallery } from './AdminMediaGallery';
import {
  LayoutDashboard,
  Users,
  HardHat,
  Building2,
  FileSpreadsheet,
  Wrench,
  Star,
  ShieldAlert,
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Loader2,
  Check,
  IdCard,
  Phone,
  Ban,
  Image as ImageIcon,
} from 'lucide-react';

export function AdminDashboard() {
  const { lang, formatDate, formatRole } = useI18n();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'users'
    | 'technicians'
    | 'companies'
    | 'requests'
    | 'services'
    | 'reviews'
    | 'complaints'
    | 'payments'
    | 'media'
  >('overview');

  // Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTechnicians: 0,
    activeTechnicians: 0,
    verifiedTechnicians: 0,
    totalCompanies: 0,
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    cancelledRequests: 0,
    rejectedRequests: 0,
    totalReviews: 0,
    totalComplaints: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Users
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [viewingIdCardsUser, setViewingIdCardsUser] = useState<Profile | null>(null);
  const [selectedAccountUser, setSelectedAccountUser] = useState<Profile | null>(null);

  // Suspension modal states
  const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<Profile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Technicians
  const [techniciansList, setTechniciansList] = useState<
    (TechnicianProfile & { profile?: Profile })[]
  >([]);
  const [loadingTechs, setLoadingTechs] = useState(false);

  // Companies
  const [companiesList, setCompaniesList] = useState<
    (Company & { profile?: Profile })[]
  >([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Requests
  const [requestsList, setRequestsList] = useState<ServiceRequest[]>([]);
  const [reqStatusFilter, setReqStatusFilter] = useState('all');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Services
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newSvcNameAr, setNewSvcNameAr] = useState('');
  const [newSvcNameEn, setNewSvcNameEn] = useState('');
  const [newSvcDesc, setNewSvcDesc] = useState('');
  const [newSvcIcon, setNewSvcIcon] = useState('wrench');
  const [newSvcSort, setNewSvcSort] = useState(1);
  const [isSavingService, setIsSavingService] = useState(false);

  // Reviews
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Complaints
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintAdminNote, setComplaintAdminNote] = useState('');
  const [complaintStatusUpdate, setComplaintStatusUpdate] = useState('investigating');
  const [isUpdatingComplaint, setIsUpdatingComplaint] = useState(false);

  // Payments
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Fetch real counts from Supabase
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const [
        { count: uCount },
        { count: tCount },
        { count: tActiveCount },
        { count: tVerCount },
        { count: cCount },
        { count: rCount },
        { count: rPending },
        { count: rAccepted },
        { count: rProgress },
        { count: rCompleted },
        { count: rCancelled },
        { count: rRejected },
        { count: revCount },
        { count: compCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('technician_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('complaints').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: uCount || 0,
        totalTechnicians: tCount || 0,
        activeTechnicians: tActiveCount || 0,
        verifiedTechnicians: tVerCount || 0,
        totalCompanies: cCount || 0,
        totalRequests: rCount || 0,
        pendingRequests: rPending || 0,
        acceptedRequests: rAccepted || 0,
        inProgressRequests: rProgress || 0,
        completedRequests: rCompleted || 0,
        cancelledRequests: rCancelled || 0,
        rejectedRequests: rRejected || 0,
        totalReviews: revCount || 0,
        totalComplaints: compCount || 0,
      });
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const normalizeProfile = (p: any): Profile => {
    if (!p) return p;
    return {
      ...p,
      avatar_url: p.avatar_url || p['profile photo'] || null,
      'profile photo': p.avatar_url || p['profile photo'] || null,
      card_id: p['card id'] || p.card_id || null,
      'card id': p['card id'] || p.card_id || null,
      front_card: p['front card'] || p.front_card || null,
      'front card': p['front card'] || p.front_card || null,
      back_card: p['back card'] || p.back_card || null,
      'back card': p['back card'] || p.back_card || null,
      technician_type: p['technician type'] || p.technician_type || null,
      'technician type': p['technician type'] || p.technician_type || null,
    };
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setUsersList((data || []).map(normalizeProfile));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTechnicians = async () => {
    setLoadingTechs(true);
    try {
      const { data: tData, error: tErr } = await supabase
        .from('technician_profiles')
        .select('*');
      if (!tErr && tData) {
        const uIds = tData.map(t => t.user_id);
        const { data: pData } = await supabase.from('profiles').select('*').in('id', uIds);
        const pMap = new Map(pData?.map(p => [p.id, normalizeProfile(p)]));
        setTechniciansList(tData.map(t => ({ ...t, profile: pMap.get(t.user_id) })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTechs(false);
    }
  };

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const { data: cData, error: cErr } = await supabase
        .from('companies')
        .select('*');
      if (!cErr && cData) {
        const uIds = cData.map(c => c.user_id);
        const { data: pData } = await supabase.from('profiles').select('*').in('id', uIds);
        const pMap = new Map(pData?.map(p => [p.id, normalizeProfile(p)]));
        setCompaniesList(cData.map(c => ({ ...c, profile: pMap.get(c.user_id) })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setRequestsList(data as ServiceRequest[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) {
        setServicesList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setReviewsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setComplaintsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setPaymentsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'technicians') loadTechnicians();
    if (activeTab === 'companies') loadCompanies();
    if (activeTab === 'requests') loadRequests();
    if (activeTab === 'services') loadServices();
    if (activeTab === 'reviews') loadReviews();
    if (activeTab === 'complaints') loadComplaints();
    if (activeTab === 'payments') loadPayments();
  }, [activeTab]);

  // Open suspension modal
  const handleInitiateSuspend = (u: Profile) => {
    setSuspendingUser(u);
    setSuspensionReason('');
    setSuspensionModalOpen(true);
  };

  // Reactivate user directly
  const handleReactivateUser = async (u: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, reason: null })
        .eq('id', u.id);

      if (error) {
        console.error('Reactivate user error:', error);
        showError(lang === 'ar' ? `خطأ أثناء التفعيل: ${error.message}` : error.message);
      } else {
        showSuccess(lang === 'ar' ? 'تم تنشيط الحساب بنجاح' : 'Account activated successfully');
        setUsersList(prev =>
          prev.map(item => (item.id === u.id ? { ...item, is_active: true, reason: null } : item))
        );
        setTechniciansList(prev =>
          prev.map(t =>
            t.user_id === u.id && t.profile
              ? { ...t, profile: { ...t.profile, is_active: true, reason: null } }
              : t
          )
        );
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    }
  };

  // Confirm suspension and record reason in profiles.reason
  const handleConfirmSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;
    const trimmedReason = suspensionReason.trim();
    if (!trimmedReason) {
      showError(lang === 'ar' ? 'يرجى كتابة سبب الحظر' : 'Please enter a suspension reason');
      return;
    }

    setIsSubmittingSuspension(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, reason: trimmedReason })
        .eq('id', suspendingUser.id);

      if (error) {
        console.warn('Update profiles with reason returned error, falling back to is_active:', error);
        await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', suspendingUser.id);
      }

      showSuccess(
        lang === 'ar'
          ? `تم تعطيل الحساب وتسجيل السبب: "${trimmedReason}"`
          : 'Account suspended and reason recorded'
      );

      setUsersList(prev =>
        prev.map(item =>
          item.id === suspendingUser.id
            ? { ...item, is_active: false, reason: trimmedReason }
            : item
        )
      );

      setTechniciansList(prev =>
        prev.map(t =>
          t.user_id === suspendingUser.id && t.profile
            ? { ...t, profile: { ...t.profile, is_active: false, reason: trimmedReason } }
            : t
        )
      );

      setSuspensionModalOpen(false);
      setSuspendingUser(null);
      setSuspensionReason('');
    } catch (err: any) {
      showError(err?.message || 'Failed to suspend user');
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  // Verify Technician toggle
  const handleToggleTechVerified = async (tProfile: TechnicianProfile) => {
    const nextState = !tProfile.is_verified;
    try {
      const { error } = await supabase
        .from('technician_profiles')
        .update({ is_verified: nextState })
        .eq('user_id', tProfile.user_id);

      if (error) {
        showError(error.message);
      } else {
        showSuccess(t.saveSuccess);
        setTechniciansList(prev =>
          prev.map(item =>
            item.user_id === tProfile.user_id ? { ...item, is_verified: nextState } : item
          )
        );
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    }
  };

  // Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcNameAr.trim() || !newSvcNameEn.trim()) return;
    setIsSavingService(true);
    try {
      const { error } = await supabase.from('services').insert({
        name_ar: newSvcNameAr.trim(),
        name_en: newSvcNameEn.trim(),
        description: newSvcDesc.trim() || null,
        icon: newSvcIcon.trim() || null,
        sort_order: Number(newSvcSort) || 1,
        is_active: true,
      });

      if (error) {
        console.error('Error adding service:', error);
        showError(error.message);
      } else {
        showSuccess(t.saveSuccess);
        setIsAddServiceOpen(false);
        setNewSvcNameAr('');
        setNewSvcNameEn('');
        setNewSvcDesc('');
        loadServices();
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsSavingService(false);
    }
  };

  // Toggle service active
  const handleToggleServiceActive = async (svc: Service) => {
    const next = !svc.is_active;
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: next })
        .eq('id', svc.id);

      if (error) {
        showError(error.message);
      } else {
        showSuccess(t.saveSuccess);
        setServicesList(prev =>
          prev.map(s => (s.id === svc.id ? { ...s, is_active: next } : s))
        );
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    }
  };

  // Update complaint note & status
  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsUpdatingComplaint(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: complaintStatusUpdate,
          admin_note: complaintAdminNote.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedComplaint.id);

      if (error) {
        showError(error.message);
      } else {
        showSuccess(t.saveSuccess);
        setSelectedComplaint(null);
        loadComplaints();
      }
    } catch (err: any) {
      showError(err?.message || t.actionError);
    } finally {
      setIsUpdatingComplaint(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const name = u.full_name || '';
    const email = u.email || '';
    const phone = u.phone || '';
    const matchesSearch =
      name.toLowerCase().includes(userSearch.toLowerCase()) ||
      email.toLowerCase().includes(userSearch.toLowerCase()) ||
      phone.includes(userSearch);
    return matchesRole && matchesSearch;
  });

  const filteredRequests = requestsList.filter(r => {
    if (reqStatusFilter === 'all') return true;
    return r.status === reqStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.adminConsole}
            </h1>
            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
              Admin Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'إدارة شاملة لكافة مستخدمي وفنيي وشركات وطلبات وشكاوى منصة TechHelp'
              : 'Complete oversight of users, specialists, requests, and dispute complaints.'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 my-6 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'نظرة عامة' : 'Overview'}</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t.statsUsers}</span>
        </button>
        <button
          onClick={() => setActiveTab('technicians')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'technicians'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>{t.statsTechnicians}</span>
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'companies'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{t.statsCompanies}</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{t.statsRequests}</span>
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'services'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{t.services}</span>
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>{t.statsReviews}</span>
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'complaints'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t.statsComplaints}</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2 px-3 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{t.payments}</span>
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`py-2 px-3.5 font-bold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'media'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 hover:text-amber-950 border border-amber-200/80'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'ar' ? 'معرض كافة الصور والوسائط' : 'All Media & Photos'}</span>
        </button>
      </div>

      {/* TAB: OVERVIEW / STATISTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingStats ? (
            <LoadingState rows={3} />
          ) : (
            <>
              {/* Top Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {t.statsUsers}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalUsers}
                  </span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {t.statsTechnicians}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalTechnicians}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {stats.verifiedTechnicians} {t.verified}
                  </span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {t.statsCompanies}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalCompanies}
                  </span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {t.statsRequests}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalRequests}
                  </span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {t.statsReviews}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalReviews}
                  </span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {t.statsComplaints}
                  </span>
                  <span className="text-2xl font-extrabold text-rose-600 tabular-nums">
                    {stats.totalComplaints}
                  </span>
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  {lang === 'ar' ? 'توزيع حالات الطلبات' : 'Requests Status Breakdown'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
                    <span className="text-[11px] text-amber-800 font-semibold block mb-0.5">
                      {t.pending}
                    </span>
                    <span className="text-xl font-bold text-amber-900 tabular-nums">
                      {stats.pendingRequests}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200">
                    <span className="text-[11px] text-sky-800 font-semibold block mb-0.5">
                      {t.accepted}
                    </span>
                    <span className="text-xl font-bold text-sky-900 tabular-nums">
                      {stats.acceptedRequests}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200">
                    <span className="text-[11px] text-indigo-800 font-semibold block mb-0.5">
                      {t.in_progress}
                    </span>
                    <span className="text-xl font-bold text-indigo-900 tabular-nums">
                      {stats.inProgressRequests}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 font-semibold block mb-0.5">
                      {t.completed}
                    </span>
                    <span className="text-xl font-bold text-emerald-900 tabular-nums">
                      {stats.completedRequests}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-600 font-semibold block mb-0.5">
                      {t.cancelled}
                    </span>
                    <span className="text-xl font-bold text-slate-700 tabular-nums">
                      {stats.cancelledRequests}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
                    <span className="text-[11px] text-rose-800 font-semibold block mb-0.5">
                      {t.rejected}
                    </span>
                    <span className="text-xl font-bold text-rose-900 tabular-nums">
                      {stats.rejectedRequests}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder={t.search}
                className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute top-2 ltr:left-3 rtl:right-3" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              {(['all', 'customer', 'technician', 'company', 'admin'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    userRoleFilter === r
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? t.all : t[r as keyof typeof t] || r}
                </button>
              ))}
            </div>
          </div>

          {loadingUsers ? (
            <LoadingState rows={4} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">{t.fullName}</th>
                      <th className="p-3 text-start">{t.email}</th>
                      <th className="p-3 text-start">{t.phone}</th>
                      <th className="p-3 text-start">{t.role}</th>
                      <th className="p-3 text-start min-w-[150px]">{lang === 'ar' ? 'الحالة والسبب' : 'Status & Reason'}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
                      <th className="p-3 text-center">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div
                            onClick={() => setSelectedAccountUser(u)}
                            className="flex items-center gap-2 cursor-pointer group"
                            title={lang === 'ar' ? 'اضغط لعرض كافة معلومات الحساب والصور' : 'Click to view full account info & photos'}
                          >
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.full_name || 'Avatar'}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                                {(u.full_name || u.email || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block truncate group-hover:text-amber-700 transition-colors font-bold">{u.full_name || 'بدون اسم'}</span>
                              {u.role !== 'customer' && u.card_id && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono mt-0.5" title="card_id">
                                  <IdCard className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span className="font-semibold">{lang === 'ar' ? 'الرقم القومي:' : 'National ID:'}</span>
                                  <span className="font-bold text-slate-800">{u.card_id}</span>
                                </div>
                              )}
                              {u.role !== 'customer' && (u.front_card || u.back_card || u.card_id) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAccountUser(u);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-800 font-semibold underline mt-0.5 cursor-pointer"
                                >
                                  <IdCard className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'عرض البطاقة والصور' : 'View ID & Photos'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {u.email}
                        </td>
                        <td className="p-3 text-slate-600 tabular-nums">
                          {u.phone || '—'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                            {formatRole(u.role)}
                          </span>
                          {u.role === 'technician' && (u.technician_type || u['technician type']) && (
                            <span className="block mt-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded w-max">
                              {u.technician_type || u['technician type']}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{u.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')}</span>
                          </span>
                          {!u.is_active && (
                            <div className="mt-1.5 space-y-1">
                              {u.reason && (
                                <div className="text-[11px] text-rose-800 bg-rose-50 p-1.5 rounded-md border border-rose-200/80 leading-snug">
                                  <span className="font-bold">{lang === 'ar' ? 'السبب: ' : 'Reason: '}</span>
                                  <span>{u.reason}</span>
                                </div>
                              )}
                              <div className="text-[10px] text-slate-500 font-mono">
                                {u.role === 'technician' && u.card_id && (
                                  <span className="text-amber-800 font-semibold bg-amber-50 px-1 py-0.5 rounded">
                                    {lang === 'ar' ? 'الرقم القومي: ' : 'Blocked ID: '}{u.card_id}
                                  </span>
                                )}
                                {u.role === 'customer' && u.phone && (
                                  <span className="text-blue-800 font-semibold bg-blue-50 px-1 py-0.5 rounded">
                                    {lang === 'ar' ? 'الهاتف: ' : 'Blocked Phone: '}{u.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 tabular-nums">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedAccountUser(u)}
                              className="px-2 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors inline-flex items-center gap-1 cursor-pointer border border-amber-200/80"
                              title={lang === 'ar' ? 'عرض كافة معلومات الحساب والصور' : 'View Full Account & Photos'}
                            >
                              <Eye className="w-3 h-3 text-amber-700" />
                              <span>{lang === 'ar' ? 'معلومات الحساب والصور' : 'Info & Photos'}</span>
                            </button>
                            {u.is_active ? (
                              <button
                                type="button"
                                onClick={() => handleInitiateSuspend(u)}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'تعطيل' : 'Suspend'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivateUser(u)}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'تنشيط' : 'Activate'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: TECHNICIANS */}
      {activeTab === 'technicians' && (
        <div className="space-y-4">
          {loadingTechs ? (
            <LoadingState rows={3} />
          ) : techniciansList.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">{t.technician}</th>
                      <th className="p-3 text-start">{t.headline}</th>
                      <th className="p-3 text-start">{t.experienceYears}</th>
                      <th className="p-3 text-start">{t.rating}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'المهام' : 'Jobs'}</th>
                      <th className="p-3 text-start">{t.availability}</th>
                      <th className="p-3 text-start">{t.verified}</th>
                      <th className="p-3 text-center">{lang === 'ar' ? 'الإجراء' : 'Verify'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {techniciansList.map(item => (
                      <tr key={item.user_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div
                            onClick={() => item.profile && setSelectedAccountUser(item.profile)}
                            className="flex items-center gap-2 cursor-pointer group"
                            title={lang === 'ar' ? 'اضغط لعرض كافة معلومات الحساب والصور' : 'Click to view full account info & photos'}
                          >
                            {item.profile?.avatar_url ? (
                              <img
                                src={item.profile.avatar_url}
                                alt={item.profile.full_name || 'Tech'}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                                {(item.profile?.full_name || item.user_id)[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block truncate group-hover:text-amber-700 transition-colors font-bold">{item.profile?.full_name || item.user_id.slice(0, 8)}</span>
                              {item.profile?.card_id && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                                  <IdCard className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>{item.profile.card_id}</span>
                                </div>
                              )}
                              {(item.profile?.front_card || item.profile?.back_card || item.profile?.card_id) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.profile) setSelectedAccountUser(item.profile);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-800 font-semibold underline mt-0.5 cursor-pointer"
                                >
                                  <IdCard className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'عرض البطاقة والصور' : 'View ID & Photos'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {item.headline || '—'}
                        </td>
                        <td className="p-3 text-slate-800 tabular-nums">
                          {item.years_experience || 0}
                        </td>
                        <td className="p-3 text-amber-700 font-bold tabular-nums">
                          ★ {item.rating ? Number(item.rating).toFixed(1) : '—'}
                        </td>
                        <td className="p-3 text-slate-800 tabular-nums">
                          {item.completed_jobs || 0}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              item.is_available
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.is_available ? t.available : t.busy}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.is_verified
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.is_verified ? t.verified : t.notVerified}
                          </span>
                          {item.profile && !item.profile.is_active && (
                            <div className="mt-1 text-[10px] text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 leading-tight">
                              <span className="font-bold">{lang === 'ar' ? 'معطل: ' : 'Blocked: '}</span>
                              <span>{item.profile.reason || (lang === 'ar' ? 'موقوف' : 'Suspended')}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.profile && (
                              <button
                                type="button"
                                onClick={() => setSelectedAccountUser(item.profile!)}
                                className="px-2 py-1 text-[11px] font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title={lang === 'ar' ? 'عرض كافة معلومات الحساب والصور' : 'View Full Account & Photos'}
                              >
                                <Eye className="w-3 h-3 text-amber-700" />
                                <span>{lang === 'ar' ? 'معلومات الحساب والصور' : 'Info & Photos'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleTechVerified(item)}
                              className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                            >
                              {item.is_verified
                                ? lang === 'ar' ? 'إلغاء التوثيق' : 'Unverify'
                                : lang === 'ar' ? 'توثيق' : 'Verify'}
                            </button>
                            {item.profile && (
                              item.profile.is_active ? (
                                <button
                                  type="button"
                                  onClick={() => handleInitiateSuspend(item.profile!)}
                                  className="px-2 py-1 text-[11px] font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title={lang === 'ar' ? 'تعطيل الحساب بالرقم القومي' : 'Suspend by National ID'}
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'حظر' : 'Suspend'}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReactivateUser(item.profile!)}
                                  className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'تنشيط' : 'Activate'}</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPANIES */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {loadingCompanies ? (
            <LoadingState rows={3} />
          ) : companiesList.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">{lang === 'ar' ? 'اسم الشركة' : 'Company'}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'السجل التجاري' : 'Register'}</th>
                      <th className="p-3 text-start">{t.description}</th>
                      <th className="p-3 text-start">{t.verified}</th>
                      <th className="p-3 text-center">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companiesList.map(c => (
                      <tr key={c.user_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div
                            onClick={() => c.profile && setSelectedAccountUser(c.profile)}
                            className="cursor-pointer group flex items-center gap-2"
                            title={lang === 'ar' ? 'عرض كافة معلومات الحساب والصور' : 'View Account & Photos'}
                          >
                            <span className="group-hover:text-amber-700 transition-colors underline-offset-2 group-hover:underline">
                              {c.company_name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {c.commercial_register || '—'}
                        </td>
                        <td className="p-3 text-slate-600 max-w-sm truncate">
                          {c.description || '—'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              c.verified
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.verified ? t.verified : t.notVerified}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {c.profile && (
                            <button
                              type="button"
                              onClick={() => setSelectedAccountUser(c.profile!)}
                              className="px-2 py-1 text-[11px] font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title={lang === 'ar' ? 'عرض كافة معلومات الحساب والصور' : 'View Full Account & Photos'}
                            >
                              <Eye className="w-3 h-3 text-amber-700" />
                              <span>{lang === 'ar' ? 'معلومات الحساب والصور' : 'Info & Photos'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {(['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'] as const).map(
              st => (
                <button
                  key={st}
                  onClick={() => setReqStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    reqStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? t.all : t[st as keyof typeof t] || st}
                </button>
              )
            )}
          </div>

          {loadingRequests ? (
            <LoadingState rows={4} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">ID</th>
                      <th className="p-3 text-start">{t.services}</th>
                      <th className="p-3 text-start">{t.description}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-start">{t.budget}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                      <th className="p-3 text-center">{t.details}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {r.id.slice(0, 8)}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {lang === 'ar' ? r.service?.name_ar : r.service?.name_en || '—'}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {r.description}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="p-3 text-slate-800 tabular-nums">
                          {r.budget ? `${r.budget} EGP` : '—'}
                        </td>
                        <td className="p-3 text-slate-400 tabular-nums">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedRequestId(r.id)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t.services}</h3>
            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة خدمة جديدة' : 'Add Service'}</span>
            </button>
          </div>

          {loadingServices ? (
            <LoadingState rows={3} />
          ) : servicesList.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</th>
                      <th className="p-3 text-start">{t.description}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الترتيب' : 'Order'}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-center">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {servicesList.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">{s.name_ar}</td>
                        <td className="p-3 font-medium text-slate-700">{s.name_en}</td>
                        <td className="p-3 text-slate-500 max-w-sm truncate">
                          {s.description || '—'}
                        </td>
                        <td className="p-3 font-mono tabular-nums">{s.sort_order}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              s.is_active
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {s.is_active ? (lang === 'ar' ? 'مفعلة' : 'Active') : (lang === 'ar' ? 'معطلة' : 'Inactive')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleServiceActive(s)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                          >
                            {s.is_active
                              ? lang === 'ar' ? 'تعطيل' : 'Disable'
                              : lang === 'ar' ? 'تفعيل' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {loadingReviews ? (
            <LoadingState rows={3} />
          ) : reviewsList.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewsList.map(rev => (
                <div
                  key={rev.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{rev.rating} / 5</span>
                    </div>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {formatDate(rev.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 italic">
                    "{rev.comment || '—'}"
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>طلب: #{rev.request_id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {loadingComplaints ? (
            <LoadingState rows={3} />
          ) : complaintsList.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">{t.complaintSubject}</th>
                      <th className="p-3 text-start">{t.complaintDescription}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'ملاحظة الإدارة' : 'Admin Note'}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="p-3 text-center">{lang === 'ar' ? 'إجراء' : 'Manage'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaintsList.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">{c.subject}</td>
                        <td className="p-3 text-slate-600 max-w-sm truncate">{c.description}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate">
                          {c.admin_note || '—'}
                        </td>
                        <td className="p-3 text-slate-400 tabular-nums">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setComplaintStatusUpdate(c.status);
                              setComplaintAdminNote(c.admin_note || '');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                          >
                            {lang === 'ar' ? 'مراجعة وبحث' : 'Review'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {loadingPayments ? (
            <LoadingState rows={3} />
          ) : paymentsList.length === 0 ? (
            <EmptyState title={t.noData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 text-start">ID</th>
                      <th className="p-3 text-start">{t.amount}</th>
                      <th className="p-3 text-start">{t.currency}</th>
                      <th className="p-3 text-start">{t.method}</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-start">Ref</th>
                      <th className="p-3 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentsList.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {p.id.slice(0, 8)}
                        </td>
                        <td className="p-3 font-bold text-slate-900 tabular-nums">{p.amount}</td>
                        <td className="p-3 text-slate-600">{p.currency || 'EGP'}</td>
                        <td className="p-3 text-slate-700">{p.method}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {p.provider_reference || '—'}
                        </td>
                        <td className="p-3 text-slate-400 tabular-nums">
                          {formatDate(p.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MEDIA & ALL PHOTOS */}
      {activeTab === 'media' && (
        <AdminMediaGallery
          onOpenAccount={prof => setSelectedAccountUser(prof)}
          onOpenRequest={reqId => setSelectedRequestId(reqId)}
        />
      )}

      {/* Add Service Modal */}
      <Modal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        title={lang === 'ar' ? 'إضافة خدمة صيانة جديدة' : 'Add New Service'}
        maxWidth="md"
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'} *
            </label>
            <input
              type="text"
              required
              value={newSvcNameAr}
              onChange={e => setNewSvcNameAr(e.target.value)}
              placeholder="مثال: صيانة التكييف المركزي"
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name in English'} *
            </label>
            <input
              type="text"
              required
              value={newSvcNameEn}
              onChange={e => setNewSvcNameEn(e.target.value)}
              placeholder="e.g. HVAC & AC Repair"
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.description}
            </label>
            <textarea
              rows={2}
              value={newSvcDesc}
              onChange={e => setNewSvcDesc(e.target.value)}
              placeholder="وصف مختصر للخدمة..."
              className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'الأيقونة' : 'Icon Keyword'}
              </label>
              <input
                type="text"
                value={newSvcIcon}
                onChange={e => setNewSvcIcon(e.target.value)}
                placeholder="wrench, electric, plumb..."
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'ترتيب الظهور' : 'Sort Order'}
              </label>
              <input
                type="number"
                value={newSvcSort}
                onChange={e => setNewSvcSort(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none tabular-nums"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddServiceOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSavingService}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSavingService && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{t.saveChanges}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Complaint Update Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={lang === 'ar' ? 'مراجعة وتحديث الشكوى' : 'Review & Update Complaint'}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateComplaint} className="space-y-4">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">{t.complaintSubject}</span>
              <p className="text-xs font-bold text-slate-900">{selectedComplaint.subject}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">{t.complaintDescription}</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {selectedComplaint.description}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <select
                value={complaintStatusUpdate}
                onChange={e => setComplaintStatusUpdate(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              >
                <option value="pending">قيد الانتظار / Pending</option>
                <option value="investigating">جاري التحقيق / Investigating</option>
                <option value="resolved">تم الحل والإنهاء / Resolved</option>
                <option value="rejected">مرفوضة / Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'ملاحظة وقرار الإدارة' : 'Admin Resolution Note'}
              </label>
              <textarea
                rows={3}
                value={complaintAdminNote}
                onChange={e => setComplaintAdminNote(e.target.value)}
                placeholder="اكتب قرار الإدارة والإجراء المتخذ..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isUpdatingComplaint}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingComplaint && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.saveChanges}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Request Details Modal */}
      <RequestDetailModal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
        onRequestUpdated={loadRequests}
      />

      {/* MODAL: VIEW NATIONAL ID CARDS */}
      {viewingIdCardsUser && (
        <Modal
          isOpen={true}
          onClose={() => setViewingIdCardsUser(null)}
          title={lang === 'ar' ? `بيانات بطاقة الهوية: ${viewingIdCardsUser.full_name || ''}` : `National ID: ${viewingIdCardsUser.full_name || ''}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {viewingIdCardsUser.avatar_url ? (
                <img
                  src={viewingIdCardsUser.avatar_url}
                  alt={viewingIdCardsUser.full_name || ''}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shrink-0">
                  {(viewingIdCardsUser.full_name || '?')[0]}
                </div>
              )}
              <div className="text-xs space-y-0.5 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{viewingIdCardsUser.full_name}</div>
                <div className="text-slate-600 truncate">{viewingIdCardsUser.email} • {viewingIdCardsUser.phone}</div>
                <div className="text-amber-800 font-semibold">{formatRole(viewingIdCardsUser.role)}</div>
              </div>
            </div>

            {/* National ID Number (card_id) */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'الرقم القومي المسجل' : 'National ID Number'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                      card_id
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-800">
                    {lang === 'ar' ? 'مسجل في حقل profiles.card_id' : 'Stored in profiles.card_id'}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold text-base text-slate-900 tracking-wider bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-xs">
                {viewingIdCardsUser.card_id || (lang === 'ar' ? 'غير مسجل' : 'Not recorded')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Front Card */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{lang === 'ar' ? 'الوجه الأمامي للبطاقة (front_card)' : 'ID Front (front_card)'}</span>
                  <span className="text-[10px] font-mono text-slate-500">front_card</span>
                </div>
                {viewingIdCardsUser.front_card ? (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[160px]">
                    <img
                      src={viewingIdCardsUser.front_card}
                      alt="Front ID"
                      className="w-full max-h-60 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    {lang === 'ar' ? 'لا توجد صورة أمامية مرفوعة' : 'No front image uploaded'}
                  </div>
                )}
              </div>

              {/* Back Card */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{lang === 'ar' ? 'الوجه الخلفي للبطاقة (back_card)' : 'ID Back (back_card)'}</span>
                  <span className="text-[10px] font-mono text-slate-500">back_card</span>
                </div>
                {viewingIdCardsUser.back_card ? (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[160px]">
                    <img
                      src={viewingIdCardsUser.back_card}
                      alt="Back ID"
                      className="w-full max-h-60 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    {lang === 'ar' ? 'لا توجد صورة خلفية مرفوعة' : 'No back image uploaded'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingIdCardsUser(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Suspend User with Reason */}
      {suspensionModalOpen && suspendingUser && (
        <Modal
          isOpen={suspensionModalOpen}
          onClose={() => {
            if (!isSubmittingSuspension) {
              setSuspensionModalOpen(false);
              setSuspendingUser(null);
            }
          }}
          title={lang === 'ar' ? 'تعطيل الحساب وتحديد سبب الحظر' : 'Suspend Account & Specify Reason'}
        >
          <form onSubmit={handleConfirmSuspend} className="space-y-4">
            {/* User summary card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {suspendingUser.avatar_url ? (
                  <img
                    src={suspendingUser.avatar_url}
                    alt={suspendingUser.full_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {(suspendingUser.full_name || suspendingUser.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{suspendingUser.full_name || 'بدون اسم'}</h4>
                  <p className="text-xs text-slate-500 font-mono truncate" dir="ltr">{suspendingUser.email}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-800 shrink-0">
                {formatRole(suspendingUser.role)}
              </span>
            </div>

            {/* Suspension Type Banner */}
            {suspendingUser.role === 'customer' ? (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Phone className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{lang === 'ar' ? 'حظر عميل برقم الهاتف المحمول' : 'Customer Suspension by Mobile Phone'}</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  {lang === 'ar'
                    ? `سيتم إيقاف الحساب وربط الحظر برقم الهاتف (${suspendingUser.phone || 'غير مسجل'}). يمنع من إنشاء حساب جديد بنفس الرقم.`
                    : `Account will be suspended and tied to mobile (${suspendingUser.phone || 'None'}).`}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <IdCard className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{lang === 'ar' ? 'حظر فني بالرقم القومي (card_id)' : 'Technician Suspension by National ID (card_id)'}</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {lang === 'ar'
                    ? `سيتم حظر حساب الفني وبطاقة الرقم القومي (${suspendingUser.card_id || 'غير مسجل'}) لمنعه نهائياً من تقديم الخدمات بأي حساب آخر.`
                    : `Technician account and National ID (${suspendingUser.card_id || 'None'}) will be disabled across devices.`}
                </p>
              </div>
            )}

            {/* Reason Input (Required - saved in profiles.reason) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {lang === 'ar' ? 'سبب الحظر والتعطيل (يُحفظ في profiles.reason)' : 'Suspension Reason (Required - saved in profiles.reason)'} *
                </label>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                  profiles.reason
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={suspensionReason}
                onChange={e => setSuspensionReason(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب سبب الإيقاف والحظر بالتفصيل ليظهر للمستخدم عند محاولة الدخول...'
                    : 'Enter the exact suspension reason...'
                }
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'ar'
                  ? 'هذا السبب سيتم حفظه في حقل reason بجدول profiles وسيظهر للمستخدم عند تسجيل الدخول من أي جهاز.'
                  : 'This reason will be saved in profiles.reason and shown to the user if they log in from any device.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmittingSuspension}
                onClick={() => {
                  setSuspensionModalOpen(false);
                  setSuspendingUser(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmittingSuspension || !suspensionReason.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingSuspension ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'ar' ? 'جاري التعطيل...' : 'Suspending...'}</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تأكيد الحظر وحفظ السبب' : 'Confirm & Save Reason'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Full Account Details & Photos Modal */}
      {selectedAccountUser && (
        <AccountDetailsModal
          isOpen={!!selectedAccountUser}
          onClose={() => setSelectedAccountUser(null)}
          userId={selectedAccountUser.id}
          initialProfile={selectedAccountUser}
          onProfileUpdated={updated => {
            setSelectedAccountUser(updated);
            setUsersList(prev => prev.map(u => (u.id === updated.id ? updated : u)));
          }}
          onOpenRequest={reqId => {
            setSelectedRequestId(reqId);
          }}
        />
      )}
    </div>
  );
}
