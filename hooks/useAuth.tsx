import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import {
  clearLinkedUsername,
  deriveDevicePassword,
  getDeviceId,
  getLinkedUsername,
  normalizeUsername,
  saveLinkedUsername,
  usernameToAuthEmail,
} from '@/lib/device-auth';
import { resetLocationUploadThrottle } from '@/lib/location-throttle';
import {
  isExistingUserError,
  isRateLimitError,
  mapAuthError,
} from '@/lib/auth-errors';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  register: (username: string) => Promise<{ error: Error | null }>;
  signIn: (username: string) => Promise<{ error: Error | null }>;
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

    const loadingTimeout = setTimeout(() => {
      if (active) {
        setLoading(false);
      }
    }, 8000);

    let subscription: { unsubscribe: () => void } | undefined;

    async function tryRestoreSession() {
      const linkedUsername = await getLinkedUsername();
      if (!linkedUsername || !active) {
        return;
      }

      const normalized = normalizeUsername(linkedUsername);
      if (!normalized) {
        return;
      }

      const deviceId = await getDeviceId();
      const password = await deriveDevicePassword(deviceId, normalized);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameToAuthEmail(normalized),
        password,
      });

      if (error) {
        console.warn('Device session restore failed:', error.message);
      } else if (data.session?.user && active) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchProfile(data.session.user);
      }
    }

    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (!active) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (event === 'INITIAL_SESSION') {
              setLoading(false);
            }
            void fetchProfile(nextSession.user);
          } else if (event === 'TOKEN_REFRESHED') {
            setLoading(false);
          }
        } else {
          setProfile(null);
          if (event === 'INITIAL_SESSION') {
            await tryRestoreSession();
            setLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      });
      subscription = data.subscription;
    } catch (error) {
      console.warn('Auth initialization failed:', error);
      setLoading(false);
    }

    return () => {
      active = false;
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  async function ensureProfile(authUser: User): Promise<Profile | null> {
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (fetchError) {
      console.warn('Failed to fetch profile:', fetchError.message);
    }

    const metadataUsername =
      typeof authUser.user_metadata?.username === 'string'
        ? authUser.user_metadata.username
        : null;

    if (existing) {
      if (metadataUsername && existing.username !== metadataUsername) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({
            username: metadataUsername,
            full_name: existing.full_name || metadataUsername,
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

    const username = metadataUsername ?? null;
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email,
        username,
        full_name: username,
        device_id:
          typeof authUser.user_metadata?.device_id === 'string'
            ? authUser.user_metadata.device_id
            : null,
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
    try {
      const resolved = await ensureProfile(authUser);
      setProfile(resolved);
    } catch (error) {
      console.warn('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function authenticateUsername(usernameInput: string, mode: 'register' | 'sign-in') {
    const username = normalizeUsername(usernameInput);
    if (!username) {
      return {
        error: new Error('Username must be 3–20 characters (letters, numbers, underscore).'),
      };
    }

    const deviceId = await getDeviceId();
    const password = await deriveDevicePassword(deviceId, username);
    const email = usernameToAuthEmail(username);

    async function ensureProfile(userId: string) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          username,
          device_id: deviceId,
          full_name: username,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (profileError?.message.includes('Username already taken')) {
        return { error: new Error('That username is already taken. Choose another.') };
      }

      return { error: null };
    }

    async function signInWithDeviceCredentials() {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: mapAuthError(error.message, mode) };
      }

      if (data.session?.user) {
        const profileResult = await ensureProfile(data.session.user.id);
        if (profileResult.error) {
          return profileResult;
        }
      }

      return { error: null };
    }

    if (mode === 'register') {
      const { data: available, error: availabilityError } = await supabase.rpc(
        'is_username_available',
        { p_username: username }
      );

      if (availabilityError) {
        return { error: new Error(availabilityError.message) };
      }

      if (!available) {
        return { error: new Error('That username is already taken. Try Sign In instead.') };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            device_id: deviceId,
            full_name: username,
          },
        },
      });

      if (error) {
        if (isExistingUserError(error.message) || isRateLimitError(error.message)) {
          const signInResult = await signInWithDeviceCredentials();
          if (!signInResult.error) {
            await saveLinkedUsername(username);
            return { error: null };
          }
        }

        return { error: mapAuthError(error.message, 'register') };
      }

      if (data.session?.user) {
        const profileResult = await ensureProfile(data.session.user.id);
        if (profileResult.error) {
          return profileResult;
        }
      } else {
        const signInResult = await signInWithDeviceCredentials();
        if (signInResult.error) {
          return {
            error: new Error(
              'Account may have been created, but sign-in failed. Try Sign In, or disable "Confirm email" in Supabase → Authentication → Providers → Email.'
            ),
          };
        }
      }
    } else {
      const signInResult = await signInWithDeviceCredentials();
      if (signInResult.error) {
        return signInResult;
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return {
        error: new Error('Could not start a session. Try Sign In, or check Supabase Auth settings.'),
      };
    }

    await saveLinkedUsername(username);
    return { error: null };
  }

  async function register(username: string) {
    return authenticateUsername(username, 'register');
  }

  async function signIn(username: string) {
    return authenticateUsername(username, 'sign-in');
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: 'local' });
    await clearLinkedUsername();
    resetLocationUploadThrottle();
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
        register,
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
