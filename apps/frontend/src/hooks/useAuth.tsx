import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/authService';
import { Profile } from '../types';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (profile: Profile, user?: AuthUser) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setSession: () => {},
  clearSession: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((nextProfile: Profile, nextUser?: AuthUser) => {
    setProfile(nextProfile);
    setUser(
      nextUser ?? {
        id: String(nextProfile.user_id),
        email: nextProfile.email,
      }
    );
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const session = await authService.getSession();
        if (!active) return;

        if (session?.profile) {
          setSession(session.profile, session.user);
        } else {
          clearSession();
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [setSession, clearSession]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
