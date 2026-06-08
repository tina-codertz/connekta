import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    // Fallback for accounts created before the profile trigger existed
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;

    if (authUser?.id === userId && authUser.email) {
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser.email,
          full_name: (authUser.user_metadata?.full_name as string) || null,
        })
        .select('*')
        .single();

      if (!createError && createdProfile) {
        setProfile(createdProfile);
      }
    }

    setLoading(false);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error };

    return { error: null, needsEmailConfirmation: !data.session };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    if (data.session?.user) {
      setSession(data.session);
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('No user') };

    const payload = { ...(updates as Partial<Profile>), updated_at: new Date().toISOString() };
    // supabase client typings can be strict depending on generated Table types; cast to any to satisfy overloads
    const { error } = await supabase
      .from('profiles')
      .update(payload as any)
      .eq('id', user.id);

    if (!error) {
      setProfile({ ...profile!, ...updates });
    }

    return { error };
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
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
