# Authentication Guard System

This document explains how to use the new authentication guard system that eliminates the need for manual auth checks in every component.

## Overview

The auth guard system provides three main approaches:

1. **Root-level protection** (automatic)
2. **Hook-based protection** (`useRequireAuth`)
3. **Component-based protection** (`AuthGuard` or `withAuthGuard`)

## 1. Root-level Protection (Automatic)

The root layout (`app/_layout.tsx`) automatically handles authentication for all routes. It:

- Shows a loading screen while Clerk initializes
- Redirects unauthenticated users to `/auth/sign-in`
- Redirects authenticated users away from auth pages
- Only shows the bottom navigation for authenticated users

**No action needed** - this works automatically for all your routes.

## 2. Hook-based Protection

### `useRequireAuth()` Hook

Use this hook in components that require authentication:

```tsx
import { useRequireAuth } from '@/src/hooks/useAuthGuard';

export default function MyComponent() {
  const { user, shouldRender } = useRequireAuth();

  // Early return if not authenticated
  if (!shouldRender || !user) {
    return null;
  }

  // Your component logic here
  return (
    <View>
      <Text>Hello {user.firstName}!</Text>
    </View>
  );
}
```

### `useAuthGuard()` Hook

For more control over the redirect behavior:

```tsx
import { useAuthGuard } from '@/src/hooks/useAuthGuard';

export default function MyComponent() {
  const { isAuthenticated, user, isLoading } = useAuthGuard('/custom-redirect');

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null; // Will redirect automatically

  return <YourContent />;
}
```

## 3. Component-based Protection

### `AuthGuard` Component

Wrap components that need authentication:

```tsx
import { AuthGuard } from '@/src/components/AuthGuard';

export default function MyScreen() {
  return (
    <AuthGuard>
      <YourProtectedContent />
    </AuthGuard>
  );
}
```

With custom loading/fallback:

```tsx
<AuthGuard 
  loadingComponent={<CustomLoader />}
  fallback={<CustomFallback />}
>
  <YourProtectedContent />
</AuthGuard>
```

### `withAuthGuard` HOC

Wrap entire components:

```tsx
import { withAuthGuard } from '@/src/components/AuthGuard';

const MyComponent = () => {
  return <YourContent />;
};

export default withAuthGuard(MyComponent);
```

## Migration Guide

### Before (Manual Auth Checks)

```tsx
import { useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function MyComponent() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  // Component logic...
}
```

### After (Using Auth Guard)

```tsx
import { useRequireAuth } from '@/src/hooks/useAuthGuard';

export default function MyComponent() {
  const { user, shouldRender } = useRequireAuth();

  if (!shouldRender || !user) return null;

  // Component logic...
}
```

## Benefits

1. **Cleaner Code**: No more repetitive auth checks
2. **Consistent UX**: Standardized loading and redirect behavior
3. **Better Performance**: Centralized auth logic
4. **Easier Maintenance**: Change auth behavior in one place
5. **Type Safety**: Better TypeScript support

## Public Routes

Routes that don't require authentication are defined in the root layout:

```tsx
const publicPaths = ['/auth', '/(auth)', '/auth/sign-in', '/auth/sign-up'];
```

Add new public routes to this array if needed.

## Best Practices

1. **Use root-level protection** for most cases (it's automatic)
2. **Use `useRequireAuth`** for components that need user data
3. **Use `AuthGuard`** for wrapping specific sections
4. **Use `withAuthGuard`** for reusable protected components
5. **Remove old manual auth checks** as you migrate components

## Examples

See the updated `InviteSection.tsx` for a real-world example of migration from manual auth checks to the new system. 