import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Wait a bit after loading completes to ensure state is stable
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure auth state is fully updated
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [loading]);

  // Show loading state while checking auth
  // This is critical - we must wait for auth to finish loading
  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Only check auth requirement AFTER loading is complete and state is stable
  // If auth is required but user is not logged in, redirect to home
  if (requireAuth && !user && !session) {
    return <Navigate to="/" replace />;
  }

  // Render children for all other cases
  return <>{children}</>;
};
