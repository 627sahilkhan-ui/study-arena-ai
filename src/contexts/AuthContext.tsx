import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { levelFromXp } from '@/lib/xp';
import { sendEmail } from '@/lib/ai';
import type { Profile } from '@/types';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.warn('Profile not found on first attempt, retrying...', error);
        // Retry up to 3 times with delays
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: retryData, error: retryError } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (retryData) {
            console.log('Profile loaded on retry', i + 1);
            setProfile((retryData as Profile) ?? null);
            return;
          }
          if (i < 2) console.warn(`Retry ${i + 1} failed:`, retryError);
        }
        console.error('Failed to load profile after retries');
        setProfile(null);
      } else {
        console.log('Profile loaded successfully');
        setProfile((data as Profile) ?? null);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    };
    initAuth();
    
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id); else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email: string, password: string, username: string) => {
    const { error: signUpError, data } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } },
    });
    if (signUpError) return { error: signUpError.message };
    
    // Wait for the trigger to create the profile
    if (data.user) {
      const userId = data.user.id;
      let profileExists = false;
      
      // Retry up to 5 times to ensure profile is created
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).single();
        if (profile) {
          profileExists = true;
          console.log('Profile created by trigger');
          break;
        }
        
        // On last attempt, manually create the profile if it still doesn't exist
        if (i === 4) {
          console.log('Profile not created by trigger, creating manually...');
          const { error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            username: username,
            full_name: null,
            xp: 0,
            level: 1,
            streak: 0,
          });
          if (!insertError) {
            profileExists = true;
            console.log('Profile created manually');
          } else {
            console.error('Failed to create profile manually:', insertError);
          }
        }
      }
      
      if (!profileExists) {
        console.warn('Warning: Profile may not exist for new user');
      }
    }
    
    // Send welcome email (fire-and-forget)
    sendEmail(email, 'welcome', username);
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    
    // Ensure profile is loaded after successful signin
    if (data.session?.user) {
      await loadProfile(data.session.user.id);
    }
    return {};
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { error: error.message } : {};
  };

  const refreshProfile = async () => { if (session) await loadProfile(session.user.id); };

  /** Adds XP, recomputes level and maintains the daily streak. */
  const addXp = async (amount: number) => {
    if (!session || !profile) return;
    const today = new Date().toISOString().slice(0, 10);
    let streak = profile.streak;
    if (profile.last_study_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = profile.last_study_date === yesterday ? streak + 1 : 1;
    }
    const xp = profile.xp + amount;
    const updates = { xp, level: levelFromXp(xp), streak, last_study_date: today };
    setProfile({ ...profile, ...updates }); // optimistic
    await supabase.from('profiles').update(updates).eq('id', session.user.id);
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, profile, loading, signUp, signIn, signOut, resetPassword, refreshProfile, addXp }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
