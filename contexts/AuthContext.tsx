
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType, LocalStorageKeys, UserRole } from '../types';
import { useToast } from '../hooks/useToast'; // Import useToast

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = 'http://localhost:3001/api'; 

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast(); 

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user) {
      // Use X-User-Email for server to identify the user making the request.
      // This is a common pattern for simple auth where a backend might not fully rely on session cookies for API calls.
      headers['X-User-Email'] = user.email; 
    }
    return headers;
  }, [user]);


  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const storedUserInfo = localStorage.getItem(LocalStorageKeys.AUTH_USER_INFO);
        if (storedUserInfo) {
          const loggedInUser: User = JSON.parse(storedUserInfo);
          setUser(loggedInUser);
        }
      } catch (error) {
        console.error("Failed to parse user session from localStorage", error);
        localStorage.removeItem(LocalStorageKeys.AUTH_USER_INFO);
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, passwordString: string, role?: UserRole): Promise<boolean> => {
    setLoading(true);
    let success = false;
    let errorMessage: string | null = null;
    try {
      const loginUrl = role === UserRole.ADMIN ? `${API_URL}/auth/login-admin` : `${API_URL}/auth/login`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordString, role }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem(LocalStorageKeys.AUTH_USER_INFO, JSON.stringify(data.user));
            success = true;
        } else {
            errorMessage = data.message || 'Login data error.';
            console.error("Login failed (data error):", errorMessage);
        }
      } else {
         try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Login failed: ${response.statusText} (${response.status})`;
        } catch (e) {
            errorMessage = `Login failed: ${response.statusText} (${response.status}). Server returned non-JSON response.`;
        }
        console.error("Login failed (HTTP error):", errorMessage);
      }
    } catch (error) {
      console.error("Login API error:", error);
      errorMessage = 'Network error or server unavailable during login. Please try again.';
    }
    setLoading(false);
    if (!success && errorMessage) {
        addToast({type: 'error', message: errorMessage});
    }
    return success;
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    setLoading(true);
    let success = false;
    let errorMessage: string | null = null;
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                setUser(data.user); // Optionally auto-login user after registration
                localStorage.setItem(LocalStorageKeys.AUTH_USER_INFO, JSON.stringify(data.user));
                success = true;
            } else {
                errorMessage = data.message || 'Registration data error from server.';
                console.error("Registration failed (data error):", errorMessage);
            }
        } else {
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `Registration failed: ${response.statusText} (${response.status})`;
            } catch (e) {
                 errorMessage = `Registration failed: ${response.statusText} (${response.status}). Server returned non-JSON response.`;
            }
            console.error("Registration failed (HTTP error):", errorMessage);
        }
    } catch (error) { // This catches "Failed to fetch"
        console.error("Registration API error (AuthContext):", error);
        errorMessage = 'Network error or server unavailable during registration. Please check your connection and try again.';
    }
    setLoading(false);
    if (!success && errorMessage) {
        addToast({type: 'error', message: errorMessage});
    }
    return success;
  };

  const loginWithPhone = async (phone: string, otp: string, role?: UserRole): Promise<boolean> => {
    setLoading(true);
    let success = false;
    let errorMessage: string | null = null;
    try {
      const response = await fetch(`${API_URL}/auth/login-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem(LocalStorageKeys.AUTH_USER_INFO, JSON.stringify(data.user));
            success = true;
        } else {
            errorMessage = data.message || 'Phone login data error.';
            console.error("Phone login failed (data error):", data.message);
        }
      } else {
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Phone login failed: ${response.statusText} (${response.status})`;
        } catch (e) {
            errorMessage = `Phone login failed: ${response.statusText} (${response.status}). Server returned non-JSON response.`;
        }
        console.error("Phone login failed (HTTP error):", errorMessage);
      }
    } catch (error) {
      console.error("Phone login API error:", error);
      errorMessage = 'Network error or server unavailable during phone login. Please try again.';
    }
    setLoading(false);
    if (!success && errorMessage) {
        addToast({type: 'error', message: errorMessage});
    }
    return success;
  };

  const registerWithPhone = async (userData: Partial<User>, otp: string): Promise<boolean> => {
    setLoading(true);
    let success = false;
    let errorMessage: string | null = null;
    try {
      const response = await fetch(`${API_URL}/auth/register-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, otp }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
            setUser(data.user); // Optionally auto-login
            localStorage.setItem(LocalStorageKeys.AUTH_USER_INFO, JSON.stringify(data.user));
            success = true;
        } else {
            errorMessage = data.message || 'Phone registration data error from server.';
            console.error("Phone registration failed (data error):", data.message);
        }
      } else {
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Phone registration failed: ${response.statusText} (${response.status})`;
        } catch (e) {
            errorMessage = `Phone registration failed: ${response.statusText} (${response.status}). Server returned non-JSON response.`;
        }
        console.error("Phone registration failed (HTTP error):", errorMessage);
      }
    } catch (error) {
      console.error("Phone registration API error (AuthContext):", error);
      errorMessage = 'Network error or server unavailable during phone registration. Please check your connection and try again.';
    }
    setLoading(false);
    if (!success && errorMessage) {
        addToast({type: 'error', message: errorMessage});
    }
    return success;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LocalStorageKeys.AUTH_USER_INFO);
    addToast({type: 'info', message: "You have been logged out."});
  };
  

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithPhone, registerWithPhone, logout, loading, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;