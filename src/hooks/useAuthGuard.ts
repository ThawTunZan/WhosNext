import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';

export const useAuthGuard = (redirectTo: string = '/auth/sign-in') => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Don't redirect if already on an auth path
      const isAuthPath = pathname.startsWith('/auth') || pathname.startsWith('/(auth)');
      if (!isAuthPath) {
        router.replace(redirectTo);
      }
    }
  }, [isLoaded, isSignedIn, pathname, router, redirectTo]);

  return {
    isLoaded,
    isSignedIn,
    user,
    isLoading: !isLoaded,
    isAuthenticated: isLoaded && isSignedIn,
  };
};

// Hook specifically for components that require authentication
export const useRequireAuth = () => {
  const authState = useAuthGuard();
  
  if (!authState.isLoaded) {
    return { ...authState, shouldRender: false };
  }
  
  if (!authState.isSignedIn) {
    return { ...authState, shouldRender: false };
  }
  
  return { ...authState, shouldRender: true };
}; 