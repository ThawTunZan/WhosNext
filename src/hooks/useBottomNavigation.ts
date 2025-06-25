import { useMemo } from 'react';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NavItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  route: string;
  onPress: () => void;
}

export const useBottomNavigation = () => {
  const path = usePathname();

  const navItems: NavItem[] = useMemo(() => [
    {
      icon: 'home',
      label: 'Home',
      route: '/',
      onPress: () => router.push('/'),
    },
    {
      icon: 'add-circle',
      label: 'New Trip',
      route: '/create-trip',
      onPress: () => router.push('/create-trip'),
    },
    {
      icon: 'people',
      label: 'Friends',
      route: '/friends',
      onPress: () => router.push('/friends'),
    },
    {
      icon: 'person',
      label: 'Profile',
      route: '/profile',
      onPress: () => router.push('/profile'),
    },
  ], []);

  const getItemColor = (itemRoute: string, theme: any) => {
    return path === itemRoute ? theme.colors.primary : theme.colors.subtext;
  };

  const shouldShowBottomNav = (isSignedIn: boolean, path: string) => {
    const publicPaths = ['/auth', '/(auth)', '/auth/sign-in', '/auth/sign-up'];
    const isPublicPath = publicPaths.some(publicPath => 
      path.startsWith(publicPath) || path === publicPath
    );
    
    return isSignedIn && !isPublicPath && !path.includes('modal');
  };

  return {
    navItems,
    currentPath: path,
    getItemColor,
    shouldShowBottomNav,
  };
}; 