import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import React from 'react';
import { RequestStatus, AppRole } from '../types/database';

export type Language = 'ar' | 'en';

export interface Translations {
  appName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  requestServiceNow: string;
  login: string;
  register: string;
  logout: string;
  dashboard: string;
  myRequests: string;
  newRequest: string;
  services: string;
  howItWorks: string;
  whyTechHelp: string;
  verifiedTechnicians: string;
  customerReviews: string;
  allRightsReserved: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  loadingData: string;
  saveSuccess: string;
  actionError: string;
  noData: string;
  customer: string;
  technician: string;
  company: string;
  admin: string;
  pending: string;
  accepted: string;
  in_progress: string;
  completed: string;
  cancelled: string;
  rejected: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  selectRole: string;
  forgotPassword: string;
  resetPasswordLink: string;
  sendResetLink: string;
  signIn: string;
  signUp: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  accountInactiveNotice: string;
  serviceCreatedSuccess: string;
  requestAcceptedSuccess: string;
  statusUpdatedSuccess: string;
  chatPlaceholder: string;
  send: string;
  messages: string;
  timeline: string;
  leaveReview: string;
  submitReview: string;
  rating: string;
  comment: string;
  complaint: string;
  submitComplaint: string;
  complaintSubject: string;
  complaintDescription: string;
  againstUser: string;
  payments: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  notifications: string;
  markAsRead: string;
  unreadCount: string;
  location: string;
  updateLocation: string;
  detectMyLocation: string;
  locationUpdatedSuccess: string;
  availability: string;
  available: string;
  busy: string;
  hourlyRate: string;
  experienceYears: string;
  skills: string;
  bio: string;
  headline: string;
  verified: string;
  notVerified: string;
  statsUsers: string;
  statsTechnicians: string;
  statsCompanies: string;
  statsRequests: string;
  statsReviews: string;
  statsComplaints: string;
  search: string;
  filter: string;
  all: string;
  saveChanges: string;
  cancel: string;
  close: string;
  budget: string;
  address: string;
  preferredTime: string;
  scheduledTime: string;
  description: string;
  images: string;
  imageUrlPlaceholder: string;
  storageNotice: string;
  notes: string;
  details: string;
  adminConsole: string;
  customerPortal: string;
  technicianPortal: string;
  companyPortal: string;
}

const ar: Translations = {
  appName: 'TechHelp',
  tagline: 'منصة الخدمات الفنية والصيانة المنزلية المعتمدة',
  heroHeadline: 'محتاج فني صيانة محترف؟ TechHelp في خدمتك',
  heroSubtitle: 'تواصل مباشرة مع نخبة من أمهر الفنيين والشركات المعتمدة لصيانة منزلك وأجهزتك بأعلى معايير الجودة والشفافية في الأسعار.',
  requestServiceNow: 'اطلب خدمة الآن',
  login: 'تسجيل الدخول',
  register: 'إنشاء حساب جديد',
  logout: 'تسجيل الخروج',
  dashboard: 'لوحة التحكم',
  myRequests: 'طلباتي',
  newRequest: 'طلب خدمة جديد',
  services: 'خدماتنا',
  howItWorks: 'كيف نعمل',
  whyTechHelp: 'لماذا TechHelp',
  verifiedTechnicians: 'الفنيون المعتمدون',
  customerReviews: 'آراء وتقييمات العملاء',
  allRightsReserved: 'جميع الحقوق محفوظة - منصة TechHelp',
  step1Title: 'اختر الخدمة المطلوبة',
  step1Desc: 'حدد نوع العطل أو الصيانة من دليل الخدمات المتاح بدقة وسهولة.',
  step2Title: 'حدد موقعك وموعدك',
  step2Desc: 'أدخل تفاصيل العنوان والوقت المناسب والميزانية المتوقعة للخدمة.',
  step3Title: 'تواصل مع فني معتمد',
  step3Desc: 'يقبل فني متخصص طلبك فوراً وتتواصل معه عبر المحادثة المباشرة.',
  step4Title: 'تنفيذ العمل والتقييم',
  step4Desc: 'يتم إنجاز الصيانة بضمان كامل ثم تقييم الفني لضمان الجودة المستمرة.',
  loadingData: 'جاري تحميل البيانات...',
  saveSuccess: 'تم الحفظ بنجاح',
  actionError: 'حدث خطأ أثناء تنفيذ العملية',
  noData: 'لا توجد بيانات متاحة حالياً',
  customer: 'عميل',
  technician: 'فني متخصص',
  company: 'شركة صيانة',
  admin: 'مدير النظام',
  pending: 'قيد الانتظار',
  accepted: 'تم القبول',
  in_progress: 'جاري التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  rejected: 'مرفوض',
  fullName: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  password: 'كلمة المرور',
  role: 'نوع الحساب',
  selectRole: 'اختر نوع الحساب',
  forgotPassword: 'نسيت كلمة المرور؟',
  resetPasswordLink: 'إعادة تعيين كلمة المرور',
  sendResetLink: 'إرسال رابط الاستعادة',
  signIn: 'دخول',
  signUp: 'تسجيل',
  alreadyHaveAccount: 'لديك حساب بالفعل؟',
  dontHaveAccount: 'ليس لديك حساب؟ سجل الآن مجاناً',
  accountInactiveNotice: 'تم تعطيل هذا الحساب من قبل الإدارة. يرجى التواصل مع الدعم الفني.',
  serviceCreatedSuccess: 'تم إنشاء طلب الخدمة بنجاح',
  requestAcceptedSuccess: 'تم قبول طلب الخدمة بنجاح',
  statusUpdatedSuccess: 'تم تحديث حالة الطلب بنجاح',
  chatPlaceholder: 'اكتب رسالتك هنا للتواصل المباشر...',
  send: 'إرسال',
  messages: 'المحادثات المباشرة',
  timeline: 'سجل وتتبع الحالات',
  leaveReview: 'تقييم الخدمة والفني',
  submitReview: 'إرسال التقييم',
  rating: 'التقييم (من 1 إلى 5 نجوم)',
  comment: 'تعليقك وملاحظاتك',
  complaint: 'تقديم شكوى أو نزاع',
  submitComplaint: 'إرسال الشكوى',
  complaintSubject: 'موضوع الشكوى',
  complaintDescription: 'تفاصيل الشكوى',
  againstUser: 'ضد المستخدم',
  payments: 'المدفوعات',
  amount: 'المبلغ',
  currency: 'العملة',
  method: 'طريقة الدفع',
  status: 'الحالة',
  notifications: 'الإشعارات',
  markAsRead: 'تحديد كمقروء',
  unreadCount: 'غير مقروء',
  location: 'الإحداثيات والموقع',
  updateLocation: 'تحديث الموقع الجغرافي',
  detectMyLocation: 'تحديد موقعي الحالي GPS',
  locationUpdatedSuccess: 'تم تحديث إحداثيات موقعك بنجاح',
  availability: 'حالة الاستعداد للعمل',
  available: 'متاح للعمل وتلقي الطلبات',
  busy: 'مشغول حالياً',
  hourlyRate: 'سعر الساعة التقديري (ج.م)',
  experienceYears: 'سنوات الخبرة',
  skills: 'المهارات والتخصصات',
  bio: 'نبذة عن الخبرة والعمل',
  headline: 'المسمى المهني المختصر',
  verified: 'معتمد وموثق',
  notVerified: 'غير موثق',
  statsUsers: 'إجمالي المستخدمين',
  statsTechnicians: 'إجمالي الفنيين',
  statsCompanies: 'إجمالي الشركات',
  statsRequests: 'إجمالي الطلبات',
  statsReviews: 'إجمالي التقييمات',
  statsComplaints: 'الشكاوى والنزاعات',
  search: 'بحث...',
  filter: 'تصفية',
  all: 'الكل',
  saveChanges: 'حفظ التعديلات',
  cancel: 'إلغاء',
  close: 'إغلاق',
  budget: 'الميزانية المتوقعة (ج.م)',
  address: 'العنوان بالتفصيل',
  preferredTime: 'الوقت المفضل',
  scheduledTime: 'الموعد المحدد',
  description: 'الوصف التفصيلي',
  images: 'الصور المرفقة',
  imageUrlPlaceholder: 'أدخل رابط الصورة (URL)',
  storageNotice: 'يمكن إرفاق روابط صور الأعطال والمعاينات',
  notes: 'ملاحظات',
  details: 'التفاصيل',
  adminConsole: 'لوحة إدارة النظام',
  customerPortal: 'بوابة العميل',
  technicianPortal: 'بوابة الفني',
  companyPortal: 'بوابة الشركات',
};

const en: Translations = {
  appName: 'TechHelp',
  tagline: 'Certified Technical & Home Services Platform',
  heroHeadline: 'Need a Technician? TechHelp is Here',
  heroSubtitle: 'Connect with verified top-rated technicians and certified companies for precision maintenance and technical services with clear pricing.',
  requestServiceNow: 'Request a Service Now',
  login: 'Sign In',
  register: 'Create Account',
  logout: 'Sign Out',
  dashboard: 'Dashboard',
  myRequests: 'My Requests',
  newRequest: 'New Service Request',
  services: 'Our Services',
  howItWorks: 'How It Works',
  whyTechHelp: 'Why TechHelp',
  verifiedTechnicians: 'Verified Technicians',
  customerReviews: 'Customer Reviews',
  allRightsReserved: 'All rights reserved - TechHelp Platform',
  step1Title: 'Select Desired Service',
  step1Desc: 'Browse our catalog and describe your technical maintenance issue.',
  step2Title: 'Set Location & Schedule',
  step2Desc: 'Provide your detailed address, preferred timing, and estimated budget.',
  step3Title: 'Connect with Certified Pro',
  step3Desc: 'An available specialist accepts your job and connects via direct chat.',
  step4Title: 'Service Done & Rate Pro',
  step4Desc: 'Receive guaranteed high-standard service and share your feedback.',
  loadingData: 'Loading data...',
  saveSuccess: 'Saved successfully',
  actionError: 'An error occurred during operation',
  noData: 'No data available currently',
  customer: 'Customer',
  technician: 'Technician',
  company: 'Company',
  admin: 'System Admin',
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  fullName: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  password: 'Password',
  role: 'Account Type',
  selectRole: 'Select Account Type',
  forgotPassword: 'Forgot Password?',
  resetPasswordLink: 'Reset Password',
  sendResetLink: 'Send Reset Link',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  alreadyHaveAccount: 'Already have an account? Sign in',
  dontHaveAccount: "Don't have an account? Register free",
  accountInactiveNotice: 'Your account is deactivated by administration. Please contact support.',
  serviceCreatedSuccess: 'Service request submitted successfully',
  requestAcceptedSuccess: 'Request accepted successfully',
  statusUpdatedSuccess: 'Request status updated successfully',
  chatPlaceholder: 'Type your message here for direct communication...',
  send: 'Send',
  messages: 'Live Messages',
  timeline: 'Status History',
  leaveReview: 'Rate Service & Pro',
  submitReview: 'Submit Review',
  rating: 'Rating (1 to 5 Stars)',
  comment: 'Your Feedback & Comments',
  complaint: 'File a Complaint',
  submitComplaint: 'Submit Complaint',
  complaintSubject: 'Subject',
  complaintDescription: 'Complaint Details',
  againstUser: 'Against User',
  payments: 'Payments',
  amount: 'Amount',
  currency: 'Currency',
  method: 'Payment Method',
  status: 'Status',
  notifications: 'Notifications',
  markAsRead: 'Mark as Read',
  unreadCount: 'Unread',
  location: 'Location Coordinates',
  updateLocation: 'Update Location',
  detectMyLocation: 'Detect Current GPS Location',
  locationUpdatedSuccess: 'Your coordinates have been updated successfully',
  availability: 'Job Availability',
  available: 'Available for work',
  busy: 'Currently Busy',
  hourlyRate: 'Hourly Rate (EGP)',
  experienceYears: 'Years of Experience',
  skills: 'Skills & Specialties',
  bio: 'Professional Bio',
  headline: 'Professional Headline',
  verified: 'Verified & Certified',
  notVerified: 'Unverified',
  statsUsers: 'Total Users',
  statsTechnicians: 'Total Technicians',
  statsCompanies: 'Total Companies',
  statsRequests: 'Total Requests',
  statsReviews: 'Total Reviews',
  statsComplaints: 'Complaints',
  search: 'Search...',
  filter: 'Filter',
  all: 'All',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  close: 'Close',
  budget: 'Expected Budget (EGP)',
  address: 'Detailed Address',
  preferredTime: 'Preferred Time',
  scheduledTime: 'Scheduled Date/Time',
  description: 'Detailed Description',
  images: 'Attached Photos',
  imageUrlPlaceholder: 'Enter image URL',
  storageNotice: 'Storage bucket required for image upload',
  notes: 'Notes',
  details: 'Details',
  adminConsole: 'Admin Console',
  customerPortal: 'Customer Portal',
  technicianPortal: 'Technician Portal',
  companyPortal: 'Company Portal',
};

export const statusTranslations: Record<RequestStatus, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  accepted: { ar: 'تم القبول', en: 'Accepted' },
  in_progress: { ar: 'جاري التنفيذ', en: 'In Progress' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
};

export const roleTranslations: Record<AppRole, { ar: string; en: string }> = {
  customer: { ar: 'عميل', en: 'Customer' },
  technician: { ar: 'فني', en: 'Technician' },
  company: { ar: 'شركة', en: 'Company' },
  admin: { ar: 'مدير نظام', en: 'Admin' },
};

interface I18nContextType {
  lang: Language;
  t: Translations;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  formatStatus: (status: RequestStatus) => string;
  formatRole: (role: AppRole) => string;
  formatDate: (dateStr: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('techhelp_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = lang === 'ar' ? ar : en;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('techhelp_lang', lang);
  }, [lang, dir]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const formatStatus = (status: RequestStatus) => {
    return statusTranslations[status]?.[lang] || status;
  };

  const formatRole = (role: AppRole) => {
    return roleTranslations[role]?.[lang] || role;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return React.createElement(
    I18nContext.Provider,
    {
      value: {
        lang,
        t,
        dir,
        setLang,
        toggleLang,
        formatStatus,
        formatRole,
        formatDate,
      },
    },
    children
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
