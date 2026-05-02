import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { ensureProfile, getProfile } from "../services/supabase/profiles";
import { supabase } from "../services/supabase/client";
import { Profile } from "../types/user";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  passwordRecovery: boolean;
  loading: boolean;
  clearPasswordRecovery: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    if (!session?.user) return;
    const loaded = await getProfile(session.user.id);
    setProfile(loaded);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          try {
            const loaded = await ensureProfile(data.session.user.id, data.session.user.email);
            if (mounted) setProfile(loaded);
          } catch {
            if (mounted) setProfile(null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          const loaded = await ensureProfile(nextSession.user.id, nextSession.user.email);
          setProfile(loaded);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      passwordRecovery,
      loading,
      clearPasswordRecovery: () => setPasswordRecovery(false),
      refreshProfile
    }),
    [session, profile, passwordRecovery, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth muss innerhalb von AuthProvider genutzt werden.");
  return value;
}
