import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<string, User> = {
  'admin@imole.ai': {
    id: 'admin-001',
    email: 'admin@imole.ai',
    name: 'System Administrator',
    role: 'admin',
    createdAt: new Date(),
  },
  'center@imole.ai': {
    id: 'center-001',
    email: 'center@imole.ai',
    name: 'Lagos Diagnostic Center',
    role: 'diagnostic_center',
    organization: 'Lagos Diagnostic Center',
    phone: '+234 801 234 5678',
    createdAt: new Date(),
  },
  'radio@imole.ai': {
    id: 'radio-1',
    email: 'radio@imole.ai',
    name: 'Dr. Adebayo Johnson',
    role: 'radiologist',
    phone: '+234 802 345 6789',
    createdAt: new Date(),
  },
  'senior@imole.ai': {
    id: 'radio-2',
    email: 'senior@imole.ai',
    name: 'Dr. Ngozi Okonkwo',
    role: 'radiologist',
    phone: '+234 803 456 7890',
    createdAt: new Date(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string, role: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.role === role) {
      setUser(mockUser);
    } else {
      // For demo, create a new user if not in mock data
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role,
        createdAt: new Date(),
      };
      setUser(newUser);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

export function requireAuth(user: User | null, allowedRoles?: UserRole[]): boolean {
  if (!user) return false;
  if (allowedRoles && !allowedRoles.includes(user.role)) return false;
  return true;
}
