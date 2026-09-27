import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingState } from '../common/LoadingState';
import {
  ServiceRequest,
  RequestStatusHistory,
  Message,
  Review,
  Payment,
  TechnicianProfile,
  Profile,
  RequestImage,
} from '../../types/database';
import {
  MapPin,
  Calendar,
  Send,
  Star,
  ShieldAlert,
  CreditCard,
  History,
  HardHat,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Maximize2,
  X,
} from 'lucide-react';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  onRequestUpdated: () => void;
}

export function RequestDetailModal({
  isOpen,
  onClose,
  requestId,
  onRequestUpdated,
}: RequestDetailModalProps) {
  const { user } = useAuth();
  const { t, lang, formatDate, formatStatus } = useI18n();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'history' | 'payment' | 'review' | 'complaint'>('details');
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Joined relations
  const [technicianUser, setTechnicianUser] = useState<Profile | null>(null);
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [historyItems, setHistoryItems] = useState<RequestStatusHistory[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [requestImages, setRequestImages] = useState<RequestImage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Forms
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadAllRequestData = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      // 1. Fetch Request
      const { data: reqData, error: reqErr } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(*)
        `)
        .eq('id', requestId)
        .single();

      if (reqErr) {
        console.error('Error fetching request details:', reqErr);
        setLoading(false);
        return;
      }
      setRequest(reqData as ServiceRequest);

      // 2. If technician assigned, fetch technician profile & user info
      if (reqData.technician_id) {
        const { data: techUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', reqData.technician_id)
          .maybeSingle();
        if (techUser) setTechnicianUser(techUser as Profile);

        const { data: techProf } = await supabase
          .from('technician_profiles')
          .select('*')
          .eq('user_id', reqData.technician_id)
          .maybeSingle();
        if (techProf) setTechnicianProfile(techProf as TechnicianProfile);
      } else {
        setTechnicianUser(null);
        setTechnicianProfile(null);
      }

      // 3. Status history
      const { data: histData } = await supabase
        .from('request_status_history')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });
      if (histData) setHistoryItems(histData);

      // 4. Messages
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (msgData) setMessages(msgData);

      // 5. Payments
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('request_id', requestId);
      if (payData) setPayments(payData);

      // 6. Review check
      const { data: revData } = await supabase
        .from('reviews')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();
      if (revData) setExistingReview(revData);

      // 7. Request Inspection Images (attached by customer)
      const { data: imgData, error: imgErr } = await supabase
        .from('request_images')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (!imgErr && imgData) {
        setRequestImages(imgData as RequestImage[]);
      } else {
        setRequestImages([]);
      }
    } catch (err) {
      console.error('Exception loading request details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requestId) {
      loadAllRequestData();
      setActiveTab('details');
    }
  }, [isOpen, requestId]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!isOpen || !requestId) return;

    const channel = supabase
      .channel(`req_messages_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, requestId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !requestId) return;

    setIsSendingMessage(true);
    try {
      const { data, error } = await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: user.id,
        message: newMessage.trim(),
        attachment_url: null,
      }).select().single();

      if (error) {
        console.error('Error sending message:', error);
        showError(lang === 'ar' ? 'تعذر إرسال الرسالة' : 'Failed to send message');
      } else if (data) {
        setMessages(prev => (prev.some(m => m.id === data.id) ? prev : [...prev, data as Message]));
        setNewMessage('');
      }
    } catch (err: any) {
      showError(err?.message || 'Error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !request || !request.technician_id) return;

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        request_id: request.id,
        customer_id: user.id,
        technician_id: request.technician_id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });

      if (error) {
        console.error('Error submitting review:', error);
        showError(lang === 'ar' ? `خطأ أثناء إرسال التقييم: ${error.message}` : error.message);
      } else {
        showSuccess(lang === 'ar' ? 'تم تسجيل تقييمك بنجاح، شكراً لك!' : 'Review submitted successfully!');
        setReviewComment('');
        loadAllRequestData();
        onRequestUpdated();
      }
    } catch (err: any) {
      showError(err?.message || 'Error submitting review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !request) return;
    if (!complaintSubject.trim() || !complaintDesc.trim()) {
      showError(lang === 'ar' ? 'يرجى كتابة موضوع الشكوى والتفاصيل' : 'Please provide subject and details');
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        request_id: request.id,
        opened_by: user.id,
        against_user: request.technician_id || null,
        subject: complaintSubject.trim(),
        description: complaintDesc.trim(),
        status: 'pending',
      });

      if (error) {
        console.error('Error submitting complaint:', error);
        showError(lang === 'ar' ? `خطأ أثناء إرسال الشكوى: ${error.message}` : error.message);
      } else {
        showSuccess(lang === 'ar' ? 'تم تقديم الشكوى بنجاح وستتم مراجعتها من قبل الإدارة' : 'Complaint submitted successfully');
        setComplaintSubject('');
        setComplaintDesc('');
        setActiveTab('details');
      }
    } catch (err: any) {
      showError(err?.message || 'Error');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  if (!isOpen) return null;

  const isCustomer = user?.id === request?.customer_id;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${t.details} - #${requestId?.slice(0, 8)}`}
        maxWidth="3xl"
      >
      {loading ? (
        <LoadingState message={t.loadingData} rows={4} />
      ) : !request ? (
        <div className="text-center py-8 text-xs text-slate-500">{t.noData}</div>
      ) : (
        <div className="space-y-4">
          {/* Header Overview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-slate-900">
                  {lang === 'ar' ? request.service?.name_ar : request.service?.name_en || 'Service'}
                </span>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-[11px] text-slate-500">
                {formatDate(request.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
              {request.budget !== null && (
                <div>
                  <span className="text-slate-400 font-normal mr-1 ml-1">{t.budget}:</span>
                  <span className="text-slate-900 tabular-nums">{request.budget} EGP</span>
                </div>
              )}
              {request.final_price !== null && (
                <div>
                  <span className="text-slate-400 font-normal mr-1 ml-1">{lang === 'ar' ? 'السعر النهائي:' : 'Final Price:'}</span>
                  <span className="text-emerald-700 font-bold tabular-nums">{request.final_price} EGP</span>
                </div>
              )}
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.details}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t.messages}</span>
              {messages.length > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full tabular-nums">
                  {messages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t.timeline}</span>
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'payment'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.payments}</span>
            </button>

            {/* Review Tab if completed */}
            {request.status === 'completed' && isCustomer && (
              <button
                onClick={() => setActiveTab('review')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'review'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.leaveReview}</span>
              </button>
            )}

            {/* Complaint tab */}
            {isCustomer && (
              <button
                onClick={() => setActiveTab('complaint')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'complaint'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>{t.complaint}</span>
              </button>
            )}
          </div>

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4 pt-1">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{t.description}</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              {/* Inspection Images Section */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <ImageIcon className="w-4 h-4 text-[#0D47A1]" />
                    <span>{lang === 'ar' ? 'صور المشكلة والمعاينة' : 'Inspection Photos'}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0D47A1]">
                    {requestImages.length} {lang === 'ar' ? 'صور مرفقة' : 'attached'}
                  </span>
                </div>

                {requestImages.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    {lang === 'ar'
                      ? 'لم يقم العميل بإرفاق صور لهذا الطلب.'
                      : 'No photos were attached to this request.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                    {requestImages.map((img, i) => (
                      <div
                        key={img.id || i}
                        onClick={() => setLightboxImage(img.file_url)}
                        className="group relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square cursor-pointer hover:border-[#0D47A1] hover:shadow-md transition-all"
                        title={lang === 'ar' ? 'اضغط للتكبير والمشاهدة' : 'Click to zoom'}
                      >
                        <img
                          src={img.file_url}
                          alt={`Inspection photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4 drop-shadow" />
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location & Time info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {request.address_text && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">{t.address}</span>
                    <span className="font-medium text-slate-900 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{request.address_text}</span>
                    </span>
                  </div>
                )}
                {(request.preferred_time || request.scheduled_at) && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">
                      {request.scheduled_at ? t.scheduledTime : t.preferredTime}
                    </span>
                    <span className="font-medium text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>
                        {request.scheduled_at
                          ? formatDate(request.scheduled_at)
                          : request.preferred_time}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned Technician Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'الفني المعين للمهمة' : 'Assigned Technician'}</span>
                </h4>
                {technicianUser ? (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200">
                        {technicianUser.avatar_url ? (
                          <img
                            src={technicianUser.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          technicianUser.full_name?.charAt(0) || 'T'
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{technicianUser.full_name}</span>
                          {technicianProfile?.is_verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {technicianProfile?.headline || (lang === 'ar' ? 'أخصائي صيانة معتمد' : 'Certified Specialist')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {technicianProfile?.rating ? (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-900 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="tabular-nums">{Number(technicianProfile.rating).toFixed(1)}</span>
                        </div>
                      ) : null}
                      {technicianUser.phone && (
                        <a
                          href={`tel:${technicianUser.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors"
                        >
                          {technicianUser.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {lang === 'ar'
                      ? 'الطلب قيد الانتظار ولم يتم تعيين فني بعد. سيقوم أحد الفنيين المتاحين بقبول الطلب قريباً.'
                      : 'Pending request. No technician assigned yet. A specialist will accept shortly.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[380px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 stroke-[1.2] mb-1" />
                    <span>{lang === 'ar' ? 'لا توجد رسائل سابقة. ابدأ المحادثة الآن' : 'No messages yet. Start the conversation'}</span>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-2.5 rounded-xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-amber-500 text-slate-950 font-medium'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 px-1 mt-0.5 tabular-nums">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-2 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !newMessage.trim()}
                  className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: STATUS TIMELINE */}
          {activeTab === 'history' && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 max-h-[360px] overflow-y-auto">
              {historyItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">{t.noData}</div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          {hist.old_status && (
                            <>
                              <span className="text-slate-500 line-through">
                                {formatStatus(hist.old_status as any)}
                              </span>
                              <span className="text-slate-400">←</span>
                            </>
                          )}
                          <StatusBadge status={hist.new_status} />
                        </div>
                        {hist.note && (
                          <p className="text-slate-600 mt-1">{hist.note}</p>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {formatDate(hist.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab === 'payment' && (
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-3">{t.payments}</h4>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {lang === 'ar' ? 'لا توجد سجلات دفع مسجلة لهذا الطلب' : 'No payment records for this request'}
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map(pay => (
                    <div
                      key={pay.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {pay.amount} {pay.currency || 'EGP'}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{t.method}: {pay.method}</span>
                          {pay.provider_reference && (
                            <span className="mr-2 ml-2 font-mono">Ref: {pay.provider_reference}</span>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        {pay.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LEAVE REVIEW */}
          {activeTab === 'review' && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-900">{t.leaveReview}</h4>
              {existingReview ? (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < existingReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-amber-900 mr-2 ml-2">
                      {existingReview.rating} / 5
                    </span>
                  </div>
                  {existingReview.comment && (
                    <p className="text-slate-700 italic">"{existingReview.comment}"</p>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-2">
                    {lang === 'ar' ? 'تم تقديم هذا التقييم مسبقاً' : 'Review previously submitted'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.rating}
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-800 mr-2 ml-2 tabular-nums">
                        {reviewRating} / 5
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.comment}
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder={lang === 'ar' ? 'شاركنا برأيك في جودة الصيانة وسلوك الفني...' : 'Share your experience with the technician...'}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="py-2 px-4 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{t.submitReview}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 6: COMPLAINT */}
          {activeTab === 'complaint' && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-3">{t.complaint}</h4>
              <form onSubmit={handleSubmitComplaint} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.complaintSubject} *
                  </label>
                  <input
                    type="text"
                    required
                    value={complaintSubject}
                    onChange={e => setComplaintSubject(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: تأخير، عمل غير مكتمل، نزاع سعر' : 'e.g. Delay, incomplete job'}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.complaintDescription} *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={complaintDesc}
                    onChange={e => setComplaintDesc(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب كافة التفاصيل لتقوم إدارة المنصة بمراجعتها واتخاذ الإجراء...' : 'Provide complete complaint details for admin investigation...'}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-rose-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingComplaint}
                  className="py-2 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingComplaint && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t.submitComplaint}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </Modal>

    {lightboxImage && (
      <div
        className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
        onClick={() => setLightboxImage(null)}
      >
        <div
          className="relative max-w-4xl max-h-[90vh] bg-transparent"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute -top-10 right-0 p-1.5 text-white hover:text-amber-400 transition-colors cursor-pointer"
            title={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Inspection photo preview"
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/20"
          />
        </div>
      </div>
    )}
  </>
  );
}
