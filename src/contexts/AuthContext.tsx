import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authStateChangeHandler: any = null;
    let initialLoadComplete = false;

    // Get initial session first
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting initial session:', error);
        // Don't fail completely - just set to logged out state
        setSession(null);
        setUser(null);
        setLoading(false);
        initialLoadComplete = true;
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initialLoadComplete = true;

      // Now set up the auth state change listener AFTER initial load
      // This prevents race conditions
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        
        // Skip INITIAL_SESSION event if we already loaded the session
        // This prevents resetting the state after initial load
        if (_event === 'INITIAL_SESSION' && initialLoadComplete) {
          return;
        }
        
        // Only update if session actually changed
        // This prevents unnecessary re-renders and state resets
        setSession(prevSession => {
          const prevToken = prevSession?.access_token;
          const newToken = session?.access_token;
          
          // If tokens are the same, don't update
          if (prevToken === newToken) {
            return prevSession;
          }
          
          return session;
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
      });

      authStateChangeHandler = subscription;
    });

    return () => {
      mounted = false;
      if (authStateChangeHandler) {
        authStateChangeHandler.unsubscribe();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    // State will be updated by onAuthStateChange listener
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    // State will be updated by onAuthStateChange listener
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
    // State will be updated by onAuthStateChange listener
  };

  const refreshSession = async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return;
    }
    setSession(session);
    setUser(session?.user ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
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
