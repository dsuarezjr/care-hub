import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { FamilyProfile } from '../../domain/models/care';
import { bootstrapFamilyProfile, saveFamilyProfile } from '../../services/profile/familyProfiles';
import { hasSupabaseConfig, supabase } from '../../services/auth/supabaseClient';

type AuthContextValue = {
  loading: boolean;
  user: User | null;
  profile: FamilyProfile | null;
  normalizedRole: 'viewer' | 'editor' | 'coordinator';
  canEdit: boolean;
  canCoordinate: boolean;
  hasConfig: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  saveProfile: (updates: Pick<FamilyProfile, 'displayName' | 'roleLabel'>) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeRole(roleLabel: string | undefined): 'viewer' | 'editor' | 'coordinator' {
  const value = (roleLabel || '').trim().toLowerCase();
  if (value === 'viewer') {
    return 'viewer';
  }

  if (value === 'editor') {
    return 'editor';
  }

  return 'coordinator';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FamilyProfile | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    let active = true;
    setLoading(true);

    bootstrapFamilyProfile(session.user).then((nextProfile) => {
      if (!active) {
        return;
      }

      setProfile(nextProfile);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [session?.user]);

  const value = useMemo<AuthContextValue>(
    () => {
      const normalizedRole = normalizeRole(profile?.roleLabel);

      return ({
      loading,
      user: session?.user ?? null,
      profile,
      normalizedRole,
      canEdit: normalizedRole !== 'viewer',
      canCoordinate: normalizedRole === 'coordinator',
      hasConfig: hasSupabaseConfig,
      async signInWithMagicLink(email: string) {
        if (!supabase) {
          return { error: 'Supabase config is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        return error ? { error: error.message } : {};
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
      },
      async saveProfile(updates) {
        if (!session?.user) {
          return { error: 'No authenticated user.' };
        }

        const nextProfile: FamilyProfile = {
          ...(profile || {
            userId: session.user.id,
            familyId: import.meta.env.VITE_FAMILY_ID || 'ramon-family',
            email: session.user.email || '',
            displayName: session.user.email?.split('@')[0] || 'Family Member',
            roleLabel: 'Family member',
            updatedAt: new Date().toISOString()
          }),
          ...updates,
          updatedAt: new Date().toISOString()
        };

        const result = await saveFamilyProfile(nextProfile);
        if (result.profile) {
          setProfile(result.profile);
        }

        return result.error ? { error: result.error } : {};
      }
      });
    },
    [loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}
