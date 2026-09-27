import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Service, Profile } from '../../types/database';
import { matchesTechnicianProfession } from '../../lib/specialtyMatcher';
import {
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  Send,
  Upload,
  Camera,
  Trash2,
  Plus,
  HardHat,
  Star,
  CheckCircle2,
} from 'lucide-react';

export interface AvailableTechItem {
  user_id: string;
  headline: string | null;
  bio: string | null;
  rating: number | null;
  reviews_count: number | null;
  hourly_rate: number | null;
  years_experience: number | null;
  skills: any;
  is_verified: boolean;
  profile?: Profile;
}

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: Service | null;
  preselectedTechnicianId?: string | null;
  onRequestCreated: () => void;
}

export function CreateRequestModal({
  isOpen,
  onClose,
  preselectedService,
  preselectedTechnicianId,
  onRequestCreated,
}: CreateRequestModalProps) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { showSuccess, showError } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [preferredTime, setPreferredTime] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Available technicians selection
  const [availableTechs, setAvailableTechs] = useState<AvailableTechItem[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compress image on client canvas to keep payload compact and fast
  const processImageFile = (file: File, maxDim = 1000, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
          let width = img.width;
          let height = img.height;
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
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    if (images.length + fileList.length > 6) {
      showError(
        lang === 'ar'
          ? 'الحد الأقصى المسموح به هو 6 صور للمعاينة'
          : 'Maximum 6 inspection photos allowed'
      );
      return;
    }

    setIsProcessingImages(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await processImageFile(file);
        newImages.push(compressed);
      }
      setImages(prev => [...prev, ...newImages]);
      showSuccess(
        lang === 'ar'
          ? `تم تجهيز ${newImages.length} صورة بنجاح وستظهر للفني`
          : `${newImages.length} photo(s) added successfully`
      );
    } catch (err) {
      console.error('Image compression error:', err);
      showError(lang === 'ar' ? 'تعذر معالجة بعض الصور' : 'Failed to process images');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (data) {
        setServices(data);
        if (preselectedService) {
          setSelectedServiceId(preselectedService.id);
        } else if (data.length > 0 && !selectedServiceId) {
          setSelectedServiceId(data[0].id);
        }
      }
    }
    if (isOpen) {
      loadServices();
    }
  }, [isOpen, preselectedService]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showError(lang === 'ar' ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Geolocation is not supported by your browser');
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
            ? `تم تحديد الإحداثيات بنجاح: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
            : `Coordinates captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      err => {
        console.error('Geolocation error:', err);
        setIsLocating(false);
        showError(lang === 'ar' ? 'تعذر جلب موقعك، يرجى كتابة العنوان يدوياً' : 'Failed to retrieve location');
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }
    if (!selectedServiceId) {
      setErrorMessage(lang === 'ar' ? 'يرجى اختيار الخدمة المطلوبة' : 'Please select a service');
      return;
    }
    if (!description.trim()) {
      setErrorMessage(lang === 'ar' ? 'يرجى توضيح وصف المشكلة' : 'Please provide description');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newRequestPayload = {
        customer_id: user.id,
        service_id: selectedServiceId,
        description: description.trim(),
        address_text: addressText.trim() || null,
        latitude: latitude,
        longitude: longitude,
        preferred_time: preferredTime.trim() || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        budget: budget ? parseFloat(budget) : null,
        status: 'pending' as const,
      };

      const { data: requestData, error: reqError } = await supabase
        .from('service_requests')
        .insert(newRequestPayload)
        .select()
        .single();

      if (reqError) {
        console.error('Supabase create request error:', reqError);
        setErrorMessage(
          lang === 'ar' ? `خطأ أثناء إنشاء الطلب: ${reqError.message}` : reqError.message
        );
        showError(reqError.message);
        setIsSubmitting(false);
        return;
      }

      // If user provided photos (via camera or device upload), attach them to request_images
      if (images.length > 0 && requestData?.id) {
        for (const imgUrl of images) {
          try {
            await supabase.from('request_images').insert({
              request_id: requestData.id,
              file_url: imgUrl,
            });
          } catch (imgErr) {
            console.warn('Could not insert image record:', imgErr);
          }
        }
      }

      // Add initial entry in request_status_history
      if (requestData?.id) {
        try {
          await supabase.from('request_status_history').insert({
            request_id: requestData.id,
            old_status: null,
            new_status: 'pending',
            changed_by: user.id,
            note: 'إنشاء طلب الخدمة الجديد',
          });
        } catch (histErr) {
          console.warn('Status history notice:', histErr);
        }
      }

      showSuccess(t.serviceCreatedSuccess);
      setDescription('');
      setAddressText('');
      setLatitude(null);
      setLongitude(null);
      setPreferredTime('');
      setScheduledAt('');
      setBudget('');
      setImages([]);
      onRequestCreated();
      onClose();
    } catch (err: any) {
      console.error('Exception creating service request:', err);
      setErrorMessage(err?.message || t.actionError);
      showError(err?.message || t.actionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lang === 'ar' ? 'طلب فني صيانة جديد' : 'New Service Request'} maxWidth="2xl">
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3-Step Wizard Indicator */}
      <div className="mb-5 pb-3 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center gap-1.5 text-[#0D47A1]">
          <span className="w-6 h-6 rounded-full bg-[#0D47A1] text-white flex items-center justify-center text-xs font-black">1</span>
          <span>{lang === 'ar' ? 'اختيار الخدمة' : 'Select Service'}</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-200" />
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-black">2</span>
          <span>{lang === 'ar' ? 'وصف العطل والموقع' : 'Describe Issue'}</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-200" />
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-black">3</span>
          <span>{lang === 'ar' ? 'تأكيد وإرسال' : 'Submit'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service selector */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            {t.services} *
          </label>
          <select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            required
            className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] outline-none transition-colors bg-white font-medium"
          >
            <option value="">{lang === 'ar' ? '-- اختر الخدمة المطلوبة --' : '-- Select Service --'}</option>
            {services.map(svc => (
              <option key={svc.id} value={svc.id}>
                {lang === 'ar' ? svc.name_ar : svc.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.description} *
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'اشرح العطل أو الصيانة المطلوبة بالتفصيل (نوع الجهاز، المشكلة الحادثة، إلخ)...'
                : 'Describe the technical issue, appliance details, or required maintenance...'
            }
            className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
          />
        </div>

        {/* Address and location coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.address}
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressText}
                onChange={e => setAddressText(e.target.value)}
                placeholder={lang === 'ar' ? 'المدينة، الحي، اسم الشارع، رقم المبنى' : 'City, Street, Building No.'}
                className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.location}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {latitude && longitude
                    ? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`
                    : t.detectMyLocation}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Schedule & Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.preferredTime}
            </label>
            <div className="relative">
              <input
                type="text"
                value={preferredTime}
                onChange={e => setPreferredTime(e.target.value)}
                placeholder={lang === 'ar' ? 'عاجل، هذا المساء، غداً' : 'e.g. This evening, Urgent'}
                className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-3 rtl:right-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.scheduledTime}
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.budget}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="250"
                className="w-full ltr:pl-8 ltr:pr-3 rtl:pr-8 rtl:pl-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none tabular-nums"
              />
              <DollarSign className="w-4 h-4 text-slate-400 absolute top-2.5 ltr:left-2.5 rtl:right-2.5" />
            </div>
          </div>
        </div>

        {/* Image Attachment & Camera Capture */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ImageIcon className="w-4 h-4 text-[#0D47A1]" />
              <span>{lang === 'ar' ? 'صور المشكلة / العطل' : 'Problem / Inspection Photos'}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {images.length}/6 {lang === 'ar' ? 'صور' : 'photos'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            {lang === 'ar'
              ? 'التقط صوراً للعطل بكاميرا هاتفك أو ارفعها من جهازك، وستظهر هذه الصور مباشرة للفني لمعاينة وفهم المشكلة.'
              : 'Take photos with your camera or select from your device. These photos will appear directly to the technician.'}
          </p>

          {/* Action buttons: Device File & Camera */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Pick from device */}
            <label
              htmlFor="request-device-upload"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#0D47A1] text-slate-700 font-semibold text-xs cursor-pointer transition-all shadow-xs"
            >
              <Upload className="w-4 h-4 text-[#0D47A1]" />
              <span>{lang === 'ar' ? 'رفع صور من الجهاز' : 'Upload from Device'}</span>
              <input
                id="request-device-upload"
                type="file"
                accept="image/*"
                multiple
                disabled={isProcessingImages || images.length >= 6}
                onChange={handleImageFiles}
                className="hidden"
              />
            </label>

            {/* Direct Camera capture */}
            <label
              htmlFor="request-camera-capture"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400 text-amber-900 font-semibold text-xs cursor-pointer transition-all shadow-xs"
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>{lang === 'ar' ? 'التقاط صورة بالكاميرا' : 'Take Photo (Camera)'}</span>
              <input
                id="request-camera-capture"
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isProcessingImages || images.length >= 6}
                onChange={handleImageFiles}
                className="hidden"
              />
            </label>
          </div>

          {/* Processing spinner indicator */}
          {isProcessingImages && (
            <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 text-[#0D47A1] rounded-lg text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{lang === 'ar' ? 'جاري ضغط ومعالجة الصور...' : 'Processing & compressing photos...'}</span>
            </div>
          )}

          {/* Images preview thumbnails grid */}
          {images.length > 0 && (
            <div className="pt-1">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {images.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs aspect-square"
                  >
                    <img
                      src={imgUrl}
                      alt={`Problem photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow"
                      title={lang === 'ar' ? 'حذف الصورة' : 'Delete photo'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#0D47A1] to-[#1E88E5] hover:opacity-95 rounded-xl transition-all shadow-md shadow-[#0D47A1]/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-amber-300" />
            )}
            <span>{lang === 'ar' ? 'إرسال الطلب الآن' : 'Submit Request'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
