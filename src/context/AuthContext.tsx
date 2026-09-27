import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, AppRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAccountActive: boolean;
  refreshProfile: () => Promise<Profile | null>;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  register: (params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'customer' | 'technician' | 'company';
    cardId?: string;
    avatarUrl?: string;
    profession?: string;
    nationalIdFront?: string;
    nationalIdBack?: string;
  }) => Promise<{ error: AuthError | Error | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfileState: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        return null;
      }

      if (data) {
        const raw = data as Record<string, any>;
        const techType =
          raw.technician_type ||
          raw['technician type'] ||
          raw.profession ||
          null;

        const normalizedProfile: Profile = {
          ...data,
          avatar_url: raw.avatar_url || raw['profile photo'] || raw['profile_photo'] || null,
          'profile photo': raw['profile photo'] || raw.avatar_url || null,
          card_id: raw.card_id || raw['card id'] || null,
          'card id': raw['card id'] || raw.card_id || null,
          front_card: raw.front_card || raw['front card'] || null,
          'front card': raw['front card'] || raw.front_card || null,
          back_card: raw.back_card || raw['back card'] || null,
          'back card': raw['back card'] || raw.back_card || null,
          technician_type: techType,
          'technician type': techType,
        };

        if (data.role === 'technician' && !techType) {
          try {
            const { data: techProf } = await supabase
              .from('technician_profiles')
              .select('headline, skills')
              .eq('user_id', userId)
              .maybeSingle();
            if (techProf?.headline) {
              normalizedProfile.technician_type = techProf.headline;
              normalizedProfile['technician type'] = techProf.headline;
            }
          } catch (e) {
            // ignore
          }
        }

        setProfile(normalizedProfile);
        return normalizedProfile;
      }
      return null;
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!user) return null;
    return await fetchProfile(user.id);
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth state changes listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    if (data.user) {
      await fetchProfile(data.user.id);
    }
    setIsLoading(false);
    return { error: null };
  };

  const register = async ({
    fullName,
    email,
    phone,
    password,
    role,
    cardId,
    avatarUrl,
    profession,
    nationalIdFront,
    nationalIdBack,
  }: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'customer' | 'technician' | 'company';
    cardId?: string;
    avatarUrl?: string;
    profession?: string;
    nationalIdFront?: string;
    nationalIdBack?: string;
  }) => {
    setIsLoading(true);
    const cleanPhone = phone?.trim() || '';
    const cleanCardId = cardId?.trim() || null;
    const effectiveCardId =
      cleanCardId ||
      (role !== 'customer'
        ? `29${Math.floor(100000000000 + Math.random() * 900000000000)}`
        : null);

    // Default fallback avatar if none provided
    const effectiveAvatar =
      avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim() || 'User')}&background=0D47A1&color=fff&size=200`;

    // 1. For Customer: Check if mobile phone number is suspended
    if (role === 'customer' && cleanPhone) {
      try {
        const { data: suspendedCustomer } = await supabase
          .from('profiles')
          .select('id, is_active, reason, phone')
          .eq('phone', cleanPhone)
          .eq('is_active', false)
          .limit(1)
          .maybeSingle();

        if (suspendedCustomer) {
          setIsLoading(false);
          return {
            error: new Error(
              `هذا الرقم (${cleanPhone}) محظور حالياً من قبل الإدارة: ${
                suspendedCustomer.reason || 'مخالفة شروط الاستخدام'
              }`
            ),
          };
        }
      } catch (chkErr) {
        console.warn('Could not check customer phone suspension:', chkErr);
      }
    }

    // 2. For Technician: Check if National ID (card id) is suspended
    if (role === 'technician' && cleanCardId) {
      try {
        const { data: suspendedTech } = await supabase
          .from('profiles')
          .select('id, is_active, reason, "card id"')
          .eq('card id', cleanCardId)
          .eq('is_active', false)
          .limit(1)
          .maybeSingle();

        if (suspendedTech) {
          setIsLoading(false);
          return {
            error: new Error(
              `هذا الرقم القومي (${cleanCardId}) محظور لدى الإدارة: ${
                suspendedTech.reason || 'مخالفة معايير الأمان والجودة'
              }`
            ),
          };
        }
      } catch (chkErr) {
        console.warn('Could not check tech card id suspension:', chkErr);
      }
    }

    // Helper to synchronize full profile details into database tables
    const syncProfileData = async (targetUserId: string) => {
      try {
        const professionName =
          profession?.trim() || (role === 'technician' ? 'فني عام / General Technician' : null);
        const frontImage = nationalIdFront || null;
        const backImage = nationalIdBack || nationalIdFront || null;

        // Exact database columns in profiles table:
        // avatar_url, 'front card', 'back card', 'card id', 'technician type'
        const profileFields: Record<string, any> = {
          id: targetUserId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: cleanPhone,
          role: role,
          is_active: true,
          avatar_url: effectiveAvatar,
          'front card': frontImage,
          'back card': backImage,
          'card id': effectiveCardId,
        };

        if (professionName) {
          profileFields['technician type'] = professionName;
        }

        // Check if profile row exists
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', targetUserId)
          .maybeSingle();

        if (!existingProf) {
          const { error: insErr } = await supabase.from('profiles').insert(profileFields);
          if (insErr) {
            console.warn('Could not insert profile with full fields, falling back to minimal payload:', insErr);
            await supabase.from('profiles').upsert({
              id: targetUserId,
              full_name: fullName.trim(),
              email: email.trim(),
              phone: cleanPhone,
              role: role,
              is_active: true,
              avatar_url: effectiveAvatar,
              'card id': effectiveCardId,
              'technician type': professionName,
            });
          }
        } else {
          const { error: updErr } = await supabase
            .from('profiles')
            .update(profileFields)
            .eq('id', targetUserId);
          if (updErr) {
            console.warn('Could not update profile fields:', updErr);
          }
        }

        // If user registered as a technician, ensure technician_profiles record exists
        if (role === 'technician') {
          try {
            await supabase.from('technician_profiles').upsert({
              user_id: targetUserId,
              headline: professionName || 'فني معتمد',
              bio: `فني متخصص في ${professionName || 'خدمات الصيانة المنزلية'}`,
              skills: [professionName || 'صيانة عامة'],
              is_verified: true,
              is_available: true,
            });
          } catch (techErr) {
            console.warn('Could not update technician profile row:', techErr);
          }
        }

        // If company and avatar was provided, update logo_url
        if (role === 'company' && effectiveAvatar) {
          try {
            await supabase
              .from('companies')
              .update({ logo_url: effectiveAvatar })
              .eq('user_id', targetUserId);
          } catch (e) {
            console.warn('Could not update company logo_url:', e);
          }
        }

        // Refresh cached profile state
        await fetchProfile(targetUserId);
      } catch (err) {
        console.warn('Error in syncProfileData:', err);
      }
    };

    // Supabase auth sign up with lightweight text-only metadata (DO NOT put Base64 images here!)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: cleanPhone,
          role: role,
          card_id: effectiveCardId,
          profession: profession?.trim() || null,
          technician_type: profession?.trim() || (role === 'technician' ? 'فني عام' : null),
        },
      },
    });

    if (error) {
      // If the email is already registered (e.g. from previous failed attempt), attempt auto-login
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('user already exists')
      ) {
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!loginErr && loginData.user) {
          setUser(loginData.user);
          if (loginData.session) setSession(loginData.session);
          await syncProfileData(loginData.user.id);
          setIsLoading(false);
          return { error: null };
        }
      }

      setIsLoading(false);
      return { error };
    }

    if (data.user) {
      const createdUserId = data.user.id;
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
      } else {
        // Try immediate sign-in to get an active session
        try {
          const { data: signData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signData?.session) {
            setUser(signData.user);
            setSession(signData.session);
          }
        } catch (e) {
          console.warn('Auto sign-in after signup skipped:', e);
        }
      }

      await syncProfileData(createdUserId);
      setTimeout(() => syncProfileData(createdUserId), 800);
      setTimeout(() => syncProfileData(createdUserId), 2500);
    }

    setIsLoading(false);
    return { error: null };
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    return { error };
  };

  const updateProfileState = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('User not logged in') };
    const payload: Record<string, any> = {};

    if ('full_name' in updates && updates.full_name !== undefined) payload.full_name = updates.full_name;
    if ('email' in updates && updates.email !== undefined) payload.email = updates.email;
    if ('phone' in updates && updates.phone !== undefined) payload.phone = updates.phone;
    if ('role' in updates && updates.role !== undefined) payload.role = updates.role;
    if ('is_active' in updates && updates.is_active !== undefined) payload.is_active = updates.is_active;
    if ('reason' in updates && updates.reason !== undefined) payload.reason = updates.reason;

    // Exact database columns in profiles:
    if ('avatar_url' in updates || 'profile photo' in updates) {
      payload.avatar_url = updates.avatar_url || (updates as any)['profile photo'];
    }
    if ('card_id' in updates || 'card id' in updates) {
      payload['card id'] = updates.card_id || (updates as any)['card id'];
    }
    if ('front_card' in updates || 'front card' in updates) {
      payload['front card'] = updates.front_card || (updates as any)['front card'];
    }
    if ('back_card' in updates || 'back card' in updates) {
      payload['back card'] = updates.back_card || (updates as any)['back card'];
    }
    if ('technician_type' in updates || 'technician type' in updates) {
      payload['technician type'] = updates.technician_type || (updates as any)['technician type'];
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      const raw = data as Record<string, any>;
      const techType =
        raw['technician type'] ||
        raw.technician_type ||
        raw.profession ||
        null;

      const normalizedProfile: Profile = {
        ...data,
        avatar_url: raw.avatar_url || null,
        'profile photo': raw.avatar_url || null,
        card_id: raw['card id'] || null,
        'card id': raw['card id'] || null,
        front_card: raw['front card'] || null,
        'front card': raw['front card'] || null,
        back_card: raw['back card'] || null,
        'back card': raw['back card'] || null,
        technician_type: techType,
        'technician type': techType,
      };

      if (updates.technician_type || updates['technician type']) {
        const tVal = updates.technician_type || updates['technician type'];
        try {
          await supabase
            .from('technician_profiles')
            .upsert({ user_id: user.id, headline: tVal, skills: [tVal] });
        } catch (e) {
          console.warn('Could not sync headline with technician_type:', e);
        }
      }

      setProfile(normalizedProfile);
    }
    return { error };
  };

  const isAccountActive = profile ? profile.is_active !== false : true;

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        session,
        profile,
        isLoading,
        isAccountActive,
        refreshProfile,
        login,
        register,
        logout,
        resetPassword,
        updateProfileState,
      },
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
