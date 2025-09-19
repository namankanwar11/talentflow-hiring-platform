// src/context/AuthContext.tsx
import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { db } from '../lib/db';

interface AuthContextType {
  user: { email: string } | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext) as AuthContextType;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<{ email: string } | null>(null);

  const login = async (email: string, pass: string) => {
    // This is a simplified, insecure hash for demo purposes.
    // A real app would use a strong hashing library like bcrypt.
    const passwordHash = btoa(pass); 
    const foundUser = await db.users.where('email').equalsIgnoreCase(email).first();
    if (foundUser && foundUser.passwordHash === passwordHash) {
      setUser({ email: foundUser.email });
      return true;
    }
    return false;
  };

  const signup = async (email: string, pass: string) => {
    const existingUser = await db.users.where('email').equalsIgnoreCase(email).first();
    if (existingUser) {
      alert('User with this email already exists.');
      return false;
    }
    const passwordHash = btoa(pass);
    await db.users.add({ email, passwordHash });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const value = { user, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}