import { Service } from '../types/database';

/**
 * Normalizes Arabic strings by unifying alefs, yaas, taa marbuta,
 * stripping diacritics and symbols, and collapsing whitespace.
 */
export function normalizeArabicText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic tashkeel/diacritics
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\s\-_/\\,،.:;]+/g, ' ')
    .trim();
}

export interface SpecialtyCategoryDef {
  key: string;
  nameAr: string;
  nameEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
  icon: string;
}

export const SPECIALTY_CATEGORIES: SpecialtyCategoryDef[] = [
  {
    key: 'electricity',
    nameAr: 'كهرباء ومنازل',
    nameEn: 'Electrical & Power',
    keywordsAr: [
      'كهرب',
      'كهربا',
      'كهربائي',
      'اناره',
      'فيش',
      'قواطع',
      'لوحه توزيع',
      'اسلاك',
      'كابل',
      'عداد',
      'نجف',
      'سبوت',
      'الكتريك',
    ],
    keywordsEn: ['electric', 'power', 'wiring', 'voltage', 'circuit', 'socket', 'lighting', 'breaker'],
    icon: 'zap',
  },
  {
    key: 'plumbing',
    nameAr: 'سباكة وصرف صحي',
    nameEn: 'Plumbing & Drainage',
    keywordsAr: [
      'سباك',
      'سباكه',
      'مواسير',
      'حنفيه',
      'صرف',
      'مياه',
      'خلاط',
      'تسريب',
      'سيفون',
      'محبس',
      'طلمبه',
      'فلاتر',
    ],
    keywordsEn: ['plumb', 'pipe', 'leak', 'drain', 'water', 'faucet', 'valve', 'sanitary', 'shower', 'sink'],
    icon: 'droplet',
  },
  {
    key: 'ac_hvac',
    nameAr: 'تكييف وتبريد',
    nameEn: 'HVAC & Air Conditioning',
    keywordsAr: [
      'تكييف',
      'تبريد',
      'مكيف',
      'سبليت',
      'فريون',
      'تهويه',
      'شارب',
      'كارير',
      'شحن فريون',
    ],
    keywordsEn: ['ac', 'air cond', 'air condition', 'hvac', 'cooling', 'chiller', 'freon', 'compressor'],
    icon: 'air-vent',
  },
  {
    key: 'appliances',
    nameAr: 'أجهزة منزلية',
    nameEn: 'Home Appliances',
    keywordsAr: [
      'اجهزه',
      'غساله',
      'ثلاجه',
      'بوتاجاز',
      'فرن',
      'سخان',
      'ميكروويف',
      'شاشه',
      'تلفزيون',
      'ديب فريزر',
      'غساله اطباق',
    ],
    keywordsEn: ['appliance', 'washer', 'fridge', 'refrigerator', 'stove', 'oven', 'heater', 'microwave', 'tv', 'dishwasher'],
    icon: 'tv',
  },
  {
    key: 'carpentry',
    nameAr: 'نجارة وأثاث',
    nameEn: 'Carpentry & Furniture',
    keywordsAr: [
      'نجار',
      'نجاره',
      'اثاث',
      'خشب',
      'ابواب',
      'مطابخ',
      'كالون',
      'اقفال',
      'باركيه',
      'دواليب',
      'سرير',
    ],
    keywordsEn: ['carpent', 'wood', 'furniture', 'door', 'lock', 'cabinet', 'kitchen', 'closet'],
    icon: 'hammer',
  },
  {
    key: 'painting',
    nameAr: 'دهانات وديكور',
    nameEn: 'Painting & Decor',
    keywordsAr: ['دهان', 'نقاش', 'نقاشه', 'بويات', 'طلاء', 'ديكور', 'معجون', 'ورق حائط'],
    keywordsEn: ['paint', 'decor', 'wall', 'wallpaper', 'coating'],
    icon: 'paint-bucket',
  },
  {
    key: 'cleaning',
    nameAr: 'نظافة ومكافحة حشرات',
    nameEn: 'Cleaning & Pest Control',
    keywordsAr: ['نظاف', 'تنظيف', 'اباده', 'حشرات', 'رش', 'سجاد', 'مفروشات', 'واجهات'],
    keywordsEn: ['clean', 'pest', 'disinfect', 'carpet', 'facade'],
    icon: 'sparkles',
  },
];

/**
 * Detects the specialty category of a technician by matching keywords
 * against their technician_type, headline, or bio.
 */
export function detectSpecialtyCategory(technicianType: string | null | undefined): SpecialtyCategoryDef | null {
  if (!technicianType || !technicianType.trim()) return null;

  const norm = normalizeArabicText(technicianType);
  const lower = technicianType.toLowerCase();

  for (const cat of SPECIALTY_CATEGORIES) {
    const arMatch = cat.keywordsAr.some(kw => norm.includes(normalizeArabicText(kw)));
    const enMatch = cat.keywordsEn.some(kw => lower.includes(kw));
    if (arMatch || enMatch) {
      return cat;
    }
  }

  return null;
}

/**
 * Checks whether a service request matches a technician's profession / specialty.
 *
 * Requirements:
 * - If technician is electricity ("كهرباء" / "كهربائي"):
 *   Only requests where service is electricity (or has electrical keywords) return true!
 * - If technician has no specific specialty set: returns true (shows all).
 */
export function matchesTechnicianProfession(
  technicianType: string | null | undefined,
  service: Service | null | undefined
): boolean {
  if (!technicianType || !technicianType.trim()) {
    // If technician has not set a specialty yet, permit seeing available requests
    return true;
  }

  if (!service) {
    return true;
  }

  const techCategory = detectSpecialtyCategory(technicianType);

  const normSvcAr = normalizeArabicText(service.name_ar);
  const lowerSvcEn = (service.name_en || '').toLowerCase();
  const lowerSvcIcon = (service.icon || '').toLowerCase();

  // 1. If technician matches a recognized category (e.g. Electricity, Plumbing)
  if (techCategory) {
    const svcMatchesAr = techCategory.keywordsAr.some(kw => normSvcAr.includes(normalizeArabicText(kw)));
    const svcMatchesEn = techCategory.keywordsEn.some(kw => lowerSvcEn.includes(kw) || lowerSvcIcon.includes(kw));
    return svcMatchesAr || svcMatchesEn;
  }

  // 2. Fallback: Direct string containment & mutual token overlap
  const normTech = normalizeArabicText(technicianType);
  const lowerTech = technicianType.toLowerCase();

  if (normSvcAr && (normTech.includes(normSvcAr) || normSvcAr.includes(normTech))) {
    return true;
  }

  if (lowerSvcEn && (lowerTech.includes(lowerSvcEn) || lowerSvcEn.includes(lowerTech))) {
    return true;
  }

  // Check word intersections
  const techTokens = normTech.split(' ').filter(w => w.length > 2);
  const svcTokens = normSvcAr.split(' ').filter(w => w.length > 2);
  for (const tToken of techTokens) {
    if (svcTokens.some(sToken => sToken.includes(tToken) || tToken.includes(sToken))) {
      return true;
    }
  }

  return false;
}
