import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import supabase from "../api/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  const [access, setAccess] = useState(null);
  const accessRequest = useRef(0);

  const refreshAccess = useCallback(async () => {
    const request = ++accessRequest.current;
    if (!session?.user?.id) { setAccess(null); return; }
    try {
      const { data, error } = await supabase.rpc("beauty_voice_site_access");
      if (error) throw error;
      if (request !== accessRequest.current) return;
      const result = data?.[0];
      setAccess({ token: session.access_token, status: result?.status || "error", admin: result?.is_admin === true });
    } catch {
      if (request === accessRequest.current) {
        setAccess({ token: session.access_token, status: "error", admin: false });
      }
    }
  }, [session]);

  useEffect(() => {
    refreshAccess();
    const onFocus = () => refreshAccess();
    const interval = window.setInterval(refreshAccess, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      accessRequest.current += 1;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshAccess]);

  const accessStatus = !user ? "signed_out"
    : access?.token !== session?.access_token ? "loading" : access.status;
  const canUseSite = accessStatus === "active";
  const canReplyOfficial = canUseSite && access?.admin === true;

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const loadSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!active || authEventReceived) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error(
          "로그인 정보를 불러오지 못했습니다.",
          error
        );
      } finally {
        if (active && !authEventReceived) setIsAuthLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        authEventReceived = true;
        if (!active) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsAuthLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isAuthLoading,
    isLoggedIn: Boolean(user),
    canReplyOfficial,
    canUseSite,
    accessStatus,
    refreshAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth는 AuthProvider 안에서 사용해야 합니다."
    );
  }

  return context;
}