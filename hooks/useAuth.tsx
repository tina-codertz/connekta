import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { getNameFromUserMetadata, toFirstName } from '@/lib/profile';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await fetchProfile(nextSession.user);
        } else if (event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      } else {
        setProfile(null);
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function syncAuthMetadata(updates: {
    full_name?: string;
    first_name?: string;
    phone?: string | null;
  }) {
    const payload: Record<string, string> = {};
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.first_name !== undefined) payload.first_name = updates.first_name;
    if (updates.phone !== undefined) payload.phone = updates.phone ?? '';
    if (Object.keys(payload).length === 0) return null;

    const { data, error } = await supabase.auth.updateUser({ data: payload });
    if (error) {
      console.warn('Failed to sync auth metadata:', error.message);
      return null;
    }

    if (data.user) {
      setUser(data.user);
    }

    return data.user ?? null;
  }

  async function ensureProfile(authUser: User): Promise<Profile | null> {
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (fetchError) {
      console.warn('Failed to fetch profile:', fetchError.message);
    }

    const metadataName = getNameFromUserMetadata(authUser);

    if (existing) {
      if (!existing.full_name?.trim() && metadataName) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: metadataName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id)
          .select('*')
          .single();

        if (!updateError && updated) {
          return updated;
        }
      }

      return existing;
    }

    if (!authUser.email) return null;

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email,
        full_name: metadataName,
      })
      .select('*')
      .single();

    if (createError) {
      console.warn('Failed to create profile:', createError.message);
      return null;
    }

    return created;
  }

  async function fetchProfile(authUser: User) {
    const resolved = await ensureProfile(authUser);
    setProfile(resolved);
    setLoading(false);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const firstName = toFirstName(fullName);
    const trimmedFullName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: trimmedFullName,
          first_name: firstName,
        },
      },
    });

    if (error) return { error };

    if (data.session?.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.session.user.id,
          email: data.session.user.email ?? email,
          full_name: firstName || trimmedFullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    return { error: null, needsEmailConfirmation: !data.session };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('No user') };

    const normalized: Partial<Profile> = { ...updates };
    if (typeof normalized.full_name === 'string') {
      normalized.full_name = normalized.full_name.trim();
    }
    if (typeof normalized.phone === 'string') {
      normalized.phone = normalized.phone.trim() || null;
    }

    const payload = { ...normalized, updated_at: new Date().toISOString() };
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(payload as Partial<Profile>)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) return { error };

    const metadataUpdates: {
      full_name?: string;
      first_name?: string;
      phone?: string | null;
    } = {};

    if (normalized.full_name !== undefined) {
      metadataUpdates.full_name = normalized.full_name ?? '';
      metadataUpdates.first_name =
        toFirstName(normalized.full_name ?? '') || normalized.full_name || '';
    }

    if (normalized.phone !== undefined) {
      metadataUpdates.phone = normalized.phone;
    }

    await syncAuthMetadata(metadataUpdates);

    if (updatedProfile) {
      setProfile(updatedProfile);
    } else {
      setProfile((current) => (current ? { ...current, ...normalized } : current));
    }

    return { error: null };
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
