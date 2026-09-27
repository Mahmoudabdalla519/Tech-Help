export type AppRole = 'customer' | 'technician' | 'company' | 'admin';

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  'profile photo'?: string | null;
  role: AppRole;
  is_active: boolean;
  reason?: string | null;
  card_id?: string | null;
  'card id'?: string | null;
  front_card?: string | null;
  'front card'?: string | null;
  back_card?: string | null;
  'back card'?: string | null;
  technician_type?: string | null;
  'technician type'?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface TechnicianProfile {
  user_id: string;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  rating: number | null;
  reviews_count: number | null;
  completed_jobs: number | null;
  is_verified: boolean;
  is_available: boolean;
  hourly_rate: number | null;
  skills: string[] | string | null;
  created_at?: string;
  // joined fields
  profile?: Profile;
}

export interface Company {
  user_id: string;
  company_name: string;
  commercial_register: string | null;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  created_at?: string;
  profile?: Profile;
}

export interface ServiceRequest {
  id: string;
  customer_id: string;
  technician_id: string | null;
  company_id: string | null;
  service_id: string;
  description: string;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_time: string | null;
  scheduled_at: string | null;
  budget: number | null;
  final_price: number | null;
  status: RequestStatus;
  created_at: string;
  updated_at?: string;
  // joined relations
  service?: Service;
  customer?: Profile;
  technician?: Profile;
  technician_profile?: TechnicianProfile;
  images?: string[];
  request_images?: RequestImage[];
}

export interface RequestImage {
  id: string;
  request_id: string;
  file_url: string;
  created_at: string;
}

export interface RequestStatusHistory {
  id: string;
  request_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
  changer?: Profile;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
  sender?: Profile;
}

export interface Review {
  id: string;
  request_id: string;
  customer_id: string;
  technician_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer?: Profile;
  technician?: Profile;
}

export interface Payment {
  id: string;
  request_id: string;
  customer_id: string;
  technician_id: string | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  provider_reference: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  request_id: string;
  opened_by: string;
  against_user: string | null;
  subject: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at?: string;
  opener?: Profile;
  against?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface TechnicianLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}
