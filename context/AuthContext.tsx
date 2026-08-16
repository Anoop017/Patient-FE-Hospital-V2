"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserProfile | null;
  role: string | null;
  isLoading: boolean;
  login: (token: string, roles: any[], userObj?: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedRole = localStorage.getItem("role");
      
      if (token) {
        if (storedRole) setRole(storedRole);
        try {
          // Fetch global user context
          const response = await api.get("/auth/profile");
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("role");
          setRole(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, roles: any[], userObj?: any) => {
    localStorage.setItem("accessToken", token);
    const primaryRole = typeof roles[0] === "string" ? roles[0] : (roles[0]?.name || "patient");
    localStorage.setItem("role", primaryRole);
    setRole(primaryRole);
    if (userObj) {
      setUser(userObj);
    }
    // Asynchronously fetch full profile
    api.get("/auth/profile").then((res) => {
      setUser(res.data);
    }).catch(() => {});
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
