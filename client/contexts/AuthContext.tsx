import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";
import { LoginResponse, User } from "@shared/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error(
      "AuthContext is undefined. Make sure useAuth is called within an AuthProvider.",
    );
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const initializeAuth = async () => {
      const token = localStorage.getItem("authToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);

          // Try to verify token with a simple API call
          try {
            await apiClient.healthCheck();
            setUser(parsedUser);
          } catch (error) {
            // Token might be expired, try to refresh
            if (refreshToken) {
              try {
                const response = await apiClient.refreshToken(refreshToken);
                localStorage.setItem("authToken", response.token);
                localStorage.setItem("refreshToken", response.refreshToken);
                setUser(parsedUser);
              } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                await logout();
              }
            } else {
              await logout();
            }
          }
        } catch (error) {
          console.error("Error parsing saved user:", error);
          await logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiClient.login(email, password);
      if (response && response.token) {
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
    }),
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Export User type for convenience
export type { User };
