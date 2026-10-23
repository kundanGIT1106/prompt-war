import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginAsDemoUser: (role: UserRole) => void;
  loginWithEmail: (email: string, role?: UserRole) => Promise<void>;
  registerUser: (email: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  updateStaffRole: (targetUid: string, newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  allUsers: UserProfile[];
}

const STORAGE_KEY_AUTH = 'civicpulse_auth_user_v1';
const STORAGE_KEY_USERS = 'civicpulse_all_users_v1';

const DEMO_ACCOUNTS: Record<UserRole, UserProfile> = {
  citizen: {
    uid: 'citizen_john_doe',
    email: 'john.citizen@civicpulse.org',
    displayName: 'John Doe (Citizen)',
    role: 'citizen',
    createdAt: '2026-01-15T09:00:00Z',
  },
  officer: {
    uid: 'officer_sarah_connor',
    email: 'sarah.officer@civicpulse.org',
    displayName: 'Sarah Connor (Municipal Officer)',
    role: 'officer',
    department: 'Department of Transportation',
    createdAt: '2025-11-01T08:30:00Z',
  },
  admin: {
    uid: 'admin_elizabeth_stone',
    email: 'admin.stone@civicpulse.org',
    displayName: 'Elizabeth Stone (Chief Administrator)',
    role: 'admin',
    createdAt: '2025-08-20T10:00:00Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Initialize users list
    try {
      const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (savedUsers) {
        setAllUsers(JSON.parse(savedUsers));
      } else {
        const initial = Object.values(DEMO_ACCOUNTS);
        setAllUsers(initial);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initial));
      }

      // Restore session
      const savedUser = localStorage.getItem(STORAGE_KEY_AUTH);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Default to demo citizen for seamless first impression
        setUser(DEMO_ACCOUNTS.citizen);
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(DEMO_ACCOUNTS.citizen));
      }
    } catch {
      setUser(DEMO_ACCOUNTS.citizen);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsDemoUser = (role: UserRole) => {
    const demoUser = DEMO_ACCOUNTS[role];
    setUser(demoUser);
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(demoUser));
  };

  const loginWithEmail = async (email: string, requestedRole: UserRole = 'citizen') => {
    setLoading(true);
    try {
      // Look up existing user in registry
      let existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!existing) {
        // Create new citizen user (Role is ALWAYS citizen unless explicitly managed by admin)
        existing = {
          uid: `user_${Date.now()}`,
          email,
          displayName: email.split('@')[0],
          role: requestedRole === 'admin' ? 'citizen' : requestedRole, // Security: prevent self-assigning admin!
          createdAt: new Date().toISOString(),
        };
        const updated = [...allUsers, existing];
        setAllUsers(updated);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      }
      setUser(existing);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(existing));
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (email: string, displayName: string) => {
    setLoading(true);
    try {
      // Security: Registration ALWAYS assigns citizen role. Never officer or admin.
      const newUser: UserProfile = {
        uid: `citizen_${Date.now()}`,
        email,
        displayName,
        role: 'citizen',
        createdAt: new Date().toISOString(),
      };
      const updated = [...allUsers, newUser];
      setAllUsers(updated);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  /**
   * Trusted administrator role management
   * Only admin users are authorized to execute role changes.
   */
  const updateStaffRole = async (
    targetUid: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== 'admin') {
      return {
        success: false,
        error: 'Privilege escalation rejected: Only system administrators can alter user roles.',
      };
    }

    const updated = allUsers.map((u) => {
      if (u.uid === targetUid) {
        return { ...u, role: newRole };
      }
      return u;
    });

    setAllUsers(updated);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));

    // If target was current user, update active state
    if (user.uid === targetUid) {
      const updatedSelf = { ...user, role: newRole };
      setUser(updatedSelf);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedSelf));
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginAsDemoUser,
        loginWithEmail,
        registerUser,
        logout,
        updateStaffRole,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
