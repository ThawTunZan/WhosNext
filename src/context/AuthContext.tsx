// src/context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
// Import your dummy constants
import { DUMMY_USER_ID, DUMMY_USER_NAME } from '../constants/auth'; // Adjust path as needed

interface AuthContextType {
  userId: string;
  userName: string;
  // In the future, might add: isAuthenticated: boolean, login: () => void, etc.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  // For this dummy version, the value is static using your constants
  const authValue: AuthContextType = {
    userId: DUMMY_USER_ID,
    userName: DUMMY_USER_NAME,
  };
  // In the future, useState would hold the user state, and useEffect would check auth status

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};