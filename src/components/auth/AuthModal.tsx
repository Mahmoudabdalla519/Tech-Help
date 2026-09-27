import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { supabase } from '../../lib/supabase';
import { TechHelpLogo } from '../common/TechHelpLogo';
import {
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  HardHat,
  IdCard,
  Upload,
  Camera,
  Trash2,
  Building2,
} from 'lucide-react';
import { Service } from '../../types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const { login, register, resetPassword } = useAuth();
  const { t, lang } = useI18n();
  const { showSuccess, showError } = useToast();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardId, setCardId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'technician' | 'company'>('customer');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [, setAvatarFileName] = useState('');

  const normalizeArabicNumbers = (val: string) => {
    return val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  // Technician-specific fields
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [nationalIdFront, setNationalIdFront] = useState('');
  const [nationalIdBack, setNationalIdBack] = useState('');
  const [frontFileName, setFrontFileName] = useState('');
  const [backFileName, setBackFileName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Compress image on client canvas to keep Base64 payload small, accepts ANY photo format
  const processImage = (file: File, maxDim = 800, quality = 0.75): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = e => {
        const rawResult = (e.target?.result as string) || '';
        try {
          const img = new Image();
          img.onerror = () => {
            // Fallback immediately to raw data URL so image is never rejected
            resolve(rawResult);
          };
          img.onload = () => {
            try {
              let width = img.width || 800;
              let height = img.height || 600;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(rawResult);
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', quality));
            } catch {
              resolve(rawResult);
            }
          };
          img.src = rawResult;
        } catch {
          resolve(rawResult);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Load available professions from services table when registering
  useEffect(() => {
    async function loadProfessions() {
      try {
        const { data } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (data && data.length > 0) {
          setAvailableServices(data);
        }
      } catch (e) {
        console.error('Error fetching services for technician signup:', e);
      }
    }
    if (isOpen) {
      loadProfessions();
    }
  }, [isOpen]);

  // Handle avatar upload - accepts any photo
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processImage(file, 400, 0.8);
      setAvatarUrl(compressed || '');
      setAvatarFileName(file.name);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl((reader.result as string) || '');
        setAvatarFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle ID card image conversion - accepts ANY photo/image directly without restrictions
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processImage(file, 800, 0.75);
      const finalImg = compressed || '';
      if (type === 'front') {
        setNationalIdFront(finalImg);
        setFrontFileName(file.name);
        // Automatically prefill back with same photo if not set yet for quick single-photo acceptance
        if (!nationalIdBack) {
          setNationalIdBack(finalImg);
          setBackFileName(file.name);
        }
      } else {
        setNationalIdBack(finalImg);
        setBackFileName(file.name);
      }
    } catch {
      // Direct reader fallback
      const reader = new FileReader();
      reader.onload = () => {
        const res = (reader.result as string) || '';
        if (type === 'front') {
          setNationalIdFront(res);
          setFrontFileName(file.name);
          if (!nationalIdBack) {
            setNationalIdBack(res);
            setBackFileName(file.name);
          }
        } else {
          setNationalIdBack(res);
          setBackFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await login(email, password);
        if (error) {
          const msg =
            lang === 'ar'
              ? error.message.includes('Invalid login credentials')
                ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور'
                : `خطأ في تسجيل الدخول: ${error.message}`
              : error.message;
          setErrorMessage(msg);
          showError(msg);
        } else {
          showSuccess(lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
          onClose();
          if (onSuccess) onSuccess();
        }
      } else if (mode === 'register') {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          setErrorMessage(
            lang === 'ar' ? 'يرجى إدخال الاسم والبريد وكلمة المرور' : 'Please fill required fields'
          );
          setIsSubmitting(false);
          return;
        }

        // Clean card ID if entered (optional - accepts any value without strict validation or data extraction)
        let cleanCardId: string | undefined = undefined;
        if (cardId.trim()) {
          cleanCardId = normalizeArabicNumbers(cardId.trim().replace(/[\s-]+/g, ''));
        }

        // Profession selection (fallback to General Technician if none chosen)
        const chosenProfession =
          (profession === 'other' ? customProfession : profession) ||
          (role === 'technician' ? 'فني عام / General Technician' : '');

        // Avatar url fallback
        const effectiveAvatarUrl =
          avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName.trim() || 'User'
          )}&background=0D47A1&color=fff&size=200`;

        // Card images: accepts ANY image
        const effectiveFrontCard = nationalIdFront || undefined;
        const effectiveBackCard = nationalIdBack || nationalIdFront || undefined;

        const { error } = await register({
          fullName,
          email,
          phone,
          password,
          role,
          cardId: cleanCardId,
          avatarUrl: effectiveAvatarUrl,
          profession: role === 'technician' ? chosenProfession?.trim() : undefined,
          nationalIdFront: effectiveFrontCard,
          nationalIdBack: effectiveBackCard,
        });

        if (error) {
          let msg = error.message;
          if (lang === 'ar') {
            if (error.message.includes('rate limit') || error.message.toLowerCase().includes('email rate limit exceeded')) {
              msg = 'تم بلوغ الحد الأقصى لإرسال رسائل التأكيد في Supabase. يرجى المحاولة بعد قليل أو تفعيل الدخول المباشر بدون تأكيد بريد.';
            } else if (error.message.includes('already registered')) {
              msg = 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.';
            } else {
              msg = `خطأ أثناء إنشاء الحساب: ${error.message}`;
            }
          }
          setErrorMessage(msg);
          showError(msg);
        } else {
          showSuccess(
            lang === 'ar'
              ? 'تم إنشاء الحساب بنجاح وتم تسجيل دخولك!'
              : 'Account registered successfully!'
          );
          onClose();
          if (onSuccess) onSuccess();
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMessage(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
          setIsSubmitting(false);
          return;
        }
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(error.message);
          showError(error.message);
        } else {
          setResetSent(true);
          showSuccess(
            lang === 'ar'
              ? 'تم إرسال رابط استعادة كلمة المرور إلى بريدك'
              : 'Password reset link sent to your email'
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t.actionError);
      showError(err?.message || t.actionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === 'login') return t.login;
    if (mode === 'register') return t.register;
    return t.resetPasswordLink;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="md">
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {resetSent ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            {lang === 'ar' ? 'تم إرسال الرابط' : 'Link Sent'}
          </h4>
          <p className="text-xs text-slate-500 mb-6">
            {lang === 'ar'
              ? 'يرجى مراجعة صندوق الوارد لبريدك الإلكتروني واتباع التعليمات.'
              : 'Please check your inbox and follow instructions to reset your password.'}
          </p>
          <button
            onClick={() => {
              setResetSent(false);
              setMode('login');
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.login}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Centered TechHelp Logo */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <TechHelpLogo size="lg" showTagline />
          </div>

          {mode === 'register' && (
            <>
              {/* Role selection cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    {lang === 'ar' ? 'اختر نوع الحساب' : 'Choose Account Type'} *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'حدد للمتابعة' : 'Select to continue'}
                  </span>
                </div>
                <div className="space-y-2">
                  {/* Option 1: Customer */}
                  <div
                    onClick={() => setRole('customer')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      role === 'customer'
                        ? 'border-[#0D47A1] bg-blue-50/60 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          role === 'customer'
                            ? 'bg-[#0D47A1] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {lang === 'ar' ? 'عميل' : 'Customer'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (Customer)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar'
                            ? 'طلب فنيين لصيانة المنزل والأجهزة'
                            : 'Find technicians for tasks'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        role === 'customer'
                          ? 'border-[#0D47A1] bg-[#0D47A1]'
                          : 'border-slate-300'
                      }`}
                    >
                      {role === 'customer' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Option 2: Technician */}
                  <div
                    onClick={() => setRole('technician')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      role === 'technician'
                        ? 'border-[#0D47A1] bg-blue-50/60 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          role === 'technician'
                            ? 'bg-[#0D47A1] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {lang === 'ar' ? 'فني مستقل' : 'Technician'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (Technician)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar'
                            ? 'تقديم الخدمات واستقبال طلبات الصيانة'
                            : 'Provide services & take customer jobs'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        role === 'technician'
                          ? 'border-[#0D47A1] bg-[#0D47A1]'
                          : 'border-slate-300'
                      }`}
                    >
                      {role === 'technician' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Option 3: Company */}
                  <div
                    onClick={() => setRole('company')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      role === 'company'
                        ? 'border-[#0D47A1] bg-blue-50/60 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          role === 'company'
                            ? 'bg-[#0D47A1] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {lang === 'ar' ? 'شركة صيانة' : 'Company'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (Company)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar'
                            ? 'إدارة فرق العمل والمشاريع الكبرى'
                            : 'Manage teams & enterprise requests'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        role === 'company'
                          ? 'border-[#0D47A1] bg-[#0D47A1]'
                          : 'border-slate-300'
                      }`}
                    >
                      {role === 'company' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Avatar Upload */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-dashed border-amber-300 flex flex-col sm:flex-row items-center gap-3.5">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-amber-500 shadow-xs flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <label
                    htmlFor="register-avatar-file"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-white shadow hover:bg-amber-600 transition-all cursor-pointer"
                    title={lang === 'ar' ? 'رفع صورة' : 'Upload photo'}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                  <input
                    id="register-avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-start">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {lang === 'ar' ? 'الصورة الشخصية (اختيارية)' : 'Profile Photo (Optional)'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-medium">
                      avatar_url
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'ar'
                      ? 'يمكنك رفع صورة أو تركها وسيتم تخصيص صورة تلقائياً'
                      : 'Upload a picture or leave blank for auto-generated avatar'}
                  </p>
                  <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                    <label
                      htmlFor="register-avatar-file"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 cursor-pointer underline"
                    >
                      <Upload className="w-3 h-3" />
                      <span>
                        {avatarUrl
                          ? (lang === 'ar' ? 'تغيير الصورة' : 'Change photo')
                          : (lang === 'ar' ? 'اختر صورة من جهازك' : 'Choose photo')}
                      </span>
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl('');
                          setAvatarFileName('');
                        }}
                        className="inline-flex items-center gap-0.5 text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{lang === 'ar' ? 'حذف' : 'Remove'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.fullName} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: محمد أحمد' : 'John Doe'}
                    className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.phone} *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors text-left"
                    dir="ltr"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
                </div>
              </div>

              {/* National ID Number - Only for Technicians & Service Providers (Not for Customers) */}
              {role !== 'customer' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {lang === 'ar' ? 'رقم البطاقة القومية / الهوية (اختياري)' : 'National ID Number (Optional)'}
                    </label>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-medium">
                      {lang === 'ar' ? 'يقبل أي أرقام أو فارغ' : 'Optional'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardId}
                      onChange={e => {
                        const val = normalizeArabicNumbers(e.target.value.replace(/[^\d٠-٩]/g, ''));
                        if (val.length <= 14) {
                          setCardId(val);
                        }
                      }}
                      placeholder={lang === 'ar' ? 'أدخل الرقم القومي أو اتركه فارغاً وسيتم إنشاؤه تلقائياً' : 'Optional ID number'}
                      className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors font-mono tracking-wider text-left"
                      dir="ltr"
                      maxLength={14}
                    />
                    <IdCard className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500">
                      {lang === 'ar' ? 'لا يتطلب استخراج بيانات من البطاقة' : 'No data extraction required'}
                    </span>
                    {cardId && (
                      <span className="font-mono font-medium text-emerald-600">
                        {cardId.length} {lang === 'ar' ? 'أرقام' : 'digits'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Technician Verification: Profession & National ID (Front & Back) */}
              {role === 'technician' && (
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-amber-200/60">
                    <HardHat className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">
                      {lang === 'ar' ? 'بيانات التخصص وصورة البطاقة' : 'Technician Details & Photo'}
                    </span>
                  </div>

                  {/* Profession Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                      <span>{lang === 'ar' ? 'التخصص الفني / المهنة' : 'Profession / Technical Specialty'} *</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-medium">
                        technician type
                      </span>
                    </label>
                    <p className="text-[11px] text-amber-800/90 mb-1.5 leading-snug">
                      {lang === 'ar'
                        ? 'تُحفظ كـ technician type في جدول profiles لتوجيه وعرض الطلبات الخاصة بتخصصك فقط تلقائياً.'
                        : 'Stored as technician type in profiles to automatically match and route orders for your specialty only.'}
                    </p>
                    <select
                      value={profession}
                      onChange={e => setProfession(e.target.value)}
                      required
                      className="w-full py-2 px-3 text-xs rounded-lg border border-amber-300 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-slate-900 font-medium"
                    >
                      <option value="">{lang === 'ar' ? '-- اختر التخصص الفني --' : '-- Select Profession --'}</option>
                      {availableServices.map(svc => (
                        <option key={svc.id} value={svc.name_ar}>
                          {lang === 'ar' ? svc.name_ar : svc.name_en}
                        </option>
                      ))}
                      <option value="كهربائي منازل / Residential Electrician">كهربائي منازل / Electrician</option>
                      <option value="فني تكييف وتبريد / HVAC Specialist">فني تكييف وتبريد / HVAC Specialist</option>
                      <option value="سباك محترف / Plumber">سباك محترف / Plumber</option>
                      <option value="نجار تركيبات وأثاث / Carpenter">نجار تركيبات وأثاث / Carpenter</option>
                      <option value="فني أجهزة منزلية / Appliances Technician">فني أجهزة منزلية / Appliances</option>
                      <option value="other">{lang === 'ar' ? 'مهنة وتخصص آخر (كتابة يدوية)' : 'Other profession'}</option>
                    </select>

                    {profession === 'other' && (
                      <input
                        type="text"
                        required
                        value={customProfession}
                        onChange={e => setCustomProfession(e.target.value)}
                        placeholder={lang === 'ar' ? 'اكتب تخصصك الفني بالتفصيل...' : 'Type your technical specialty...'}
                        className="w-full mt-2 py-2 px-3 text-xs rounded-lg border border-amber-300 bg-white focus:border-amber-500 outline-none"
                      />
                    )}
                  </div>

                  {/* National ID Upload (Front & Back) - Accepts ANY photo directly */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <IdCard className="w-4 h-4 text-amber-700" />
                        <span>{lang === 'ar' ? 'صورة البطاقة / المستند' : 'ID Photo / Document'}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {lang === 'ar' ? 'يقبل أي صورة مباشرة بدون استخراج بيانات' : 'Accepts any photo'}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Front ID */}
                      <div className="relative border-2 border-dashed border-amber-300 rounded-lg p-2.5 text-center bg-white hover:bg-amber-50/30 transition-colors">
                        <input
                          type="file"
                          accept="image/*,*"
                          onChange={e => handleFileUpload(e, 'front')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {nationalIdFront ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={nationalIdFront}
                              alt="ID Front"
                              className="h-16 w-full object-cover rounded mb-1 border border-slate-200"
                            />
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="truncate max-w-[120px]">{frontFileName || (lang === 'ar' ? 'تم قبول الصورة' : 'Photo Uploaded')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 flex flex-col items-center">
                            <Upload className="w-5 h-5 text-amber-600 mb-1" />
                            <span className="text-xs font-bold text-slate-800">
                              {lang === 'ar' ? 'صورة البطاقة (يقبل أي صورة)' : 'Photo (Accepts any image)'}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {lang === 'ar' ? 'اضغط لاختيار أي صورة مباشرة' : 'Click to pick any photo'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Back ID */}
                      <div className="relative border-2 border-dashed border-amber-300 rounded-lg p-2.5 text-center bg-white hover:bg-amber-50/30 transition-colors">
                        <input
                          type="file"
                          accept="image/*,*"
                          onChange={e => handleFileUpload(e, 'back')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {nationalIdBack ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={nationalIdBack}
                              alt="ID Back"
                              className="h-16 w-full object-cover rounded mb-1 border border-slate-200"
                            />
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="truncate max-w-[120px]">{backFileName || (lang === 'ar' ? 'تم حفظ الصورة' : 'Photo Uploaded')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 flex flex-col items-center">
                            <Upload className="w-5 h-5 text-amber-600 mb-1" />
                            <span className="text-xs font-bold text-slate-800">
                              {lang === 'ar' ? 'صورة إضافية / ظهر البطاقة (اختياري)' : 'Back Face (Optional)'}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {lang === 'ar' ? 'اختياري - يكتفي بالصورة الأولى' : 'Optional'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If company: optional Commercial / ID Verification */}
              {role === 'company' && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <IdCard className="w-4 h-4 text-slate-600" />
                      <span>{lang === 'ar' ? 'مستندات السجل التجاري / البطاقة' : 'Company ID / Commercial Doc'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      front_card / back_card
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Front ID */}
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-2 text-center bg-white hover:bg-slate-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'front')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {nationalIdFront ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={nationalIdFront}
                            alt="ID Front"
                            className="h-12 w-full object-cover rounded mb-1 border border-slate-200"
                          />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate max-w-[120px]">{frontFileName || (lang === 'ar' ? 'تم الرفع' : 'Uploaded Front')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-1 flex flex-col items-center">
                          <Upload className="w-4 h-4 text-slate-500 mb-0.5" />
                          <span className="text-[11px] font-bold text-slate-700">
                            {lang === 'ar' ? 'مستند الواجهة / السجل' : 'ID Front Face'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            front_card
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Back ID */}
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-2 text-center bg-white hover:bg-slate-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'back')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {nationalIdBack ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={nationalIdBack}
                            alt="ID Back"
                            className="h-12 w-full object-cover rounded mb-1 border border-slate-200"
                          />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate max-w-[120px]">{backFileName || (lang === 'ar' ? 'تم الرفع' : 'Uploaded Back')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-1 flex flex-col items-center">
                          <Upload className="w-4 h-4 text-slate-500 mb-0.5" />
                          <span className="text-[11px] font-bold text-slate-700">
                            {lang === 'ar' ? 'الوجه الآخر' : 'ID Back Face'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            back_card
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.email} *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors text-left"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
            </div>
          </div>

          {/* Password (for login and register) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.password} *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-[#0D47A1] font-semibold hover:underline cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] outline-none transition-colors text-left"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#0D47A1] to-[#1E88E5] hover:opacity-95 rounded-xl transition-all shadow-md shadow-[#0D47A1]/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            <span>
              {mode === 'login'
                ? t.signIn
                : mode === 'register'
                ? t.signUp
                : t.sendResetLink}
            </span>
          </button>

          {/* Toggle modes */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            {mode === 'login' ? (
              <p>
                {t.dontHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('register');
                  }}
                  className="font-bold text-[#0D47A1] hover:underline inline-block cursor-pointer"
                >
                  {t.register}
                </button>
              </p>
            ) : (
              <p>
                {t.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="font-bold text-[#0D47A1] hover:underline inline-block cursor-pointer"
                >
                  {t.login}
                </button>
              </p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
