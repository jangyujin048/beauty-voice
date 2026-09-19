import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import supabase from "../api/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  const [officialAccess, setOfficialAccess] = useState(null);

  // Bind the response to this session: a previous account must never lend its UI permission.
  useEffect(() => {
    let active = true;
    setOfficialAccess(null);
    if (!session?.user?.id) return;

    supabase.rpc("beauty_voice_can_reply_official")
      .then(({ data, error }) => {
        if (active) setOfficialAccess({
          token: session.access_token,
          allowed: !error && data === true,
        });
      })
      .catch(() => {
        if (active) setOfficialAccess(null);
      });
    return () => { active = false; };
  }, [session]);

  const canReplyOfficial = Boolean(
    user?.id && session?.access_token &&
    officialAccess?.token === session.access_token && officialAccess.allowed
  );

  useEffect(() => {
    const loadSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error(
          "로그인 정보를 불러오지 못했습니다.",
          error
        );
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsAuthLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isAuthLoading,
    isLoggedIn: Boolean(user),
    canReplyOfficial,
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