import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { ensureProfile, getProfile } from "../services/supabase/profiles";
import { supabase } from "../services/supabase/client";
import { Profile } from "../types/user";

const authLoadTimeoutMs = 3500;

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
        const { data } = await withTimeout(supabase.auth.getSession(), authLoadTimeoutMs);
        if (!mounted) return;
        setSession(data.session);
      } catch {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialSession();

    // Avoid awaiting Supabase calls inside onAuthStateChange — supabase-js v2
    // serialises auth callbacks behind a lock, so DB queries here can deadlock
    // and leave the UI unresponsive after a sign-in.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    ensureProfile(userId, session?.user?.email ?? null)
      .then((loaded) => {
        if (!cancelled) setProfile(loaded);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.email]);

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error("Auth load timeout")), timeoutMs);
    })
  ]);
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth muss innerhalb von AuthProvider genutzt werden.");
  return value;
}
