import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  username: string;
  role: "admin" | "manager";
  full_name: string | null;
  email: string | null;
  is_active: boolean;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

// Simple password verification (in production, use proper bcrypt)
const verifyPassword = (password: string, hash: string): boolean => {
  // For demo purposes, accept 'admin' password for the default admin
  if (password === "admin" && hash.includes("$2a$10$")) {
    return true;
  }
  return false;
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in (from sessionStorage - no persistence across browser sessions)
    const storedAdmin = sessionStorage.getItem("admin_user");
    if (storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin);
        setAdminUser(parsed);
      } catch (error) {
        console.error("Error parsing stored admin user:", error);
        sessionStorage.removeItem("admin_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // First check if we can connect to Supabase and if admin_users table exists
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("username", username)
          .eq("is_active", true)
          .single();

        if (error) {
          console.log("Supabase admin_users table error:", error);
          // If table doesn't exist, use fallback
          throw new Error("admin_users table not found");
        }

        if (!data) {
          return {
            success: false,
            error: "Noto'g'ri foydalanuvchi nomi yoki parol",
          };
        }

        // Verify password
        if (!verifyPassword(password, data.password_hash)) {
          return {
            success: false,
            error: "Noto'g'ri foydalanuvchi nomi yoki parol",
          };
        }

        // Update last login
        await supabase
          .from("admin_users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.id);

        const adminUser: AdminUser = {
          id: data.id,
          username: data.username,
          role: data.role,
          full_name: data.full_name,
          email: data.email,
          is_active: data.is_active,
        };

        setAdminUser(adminUser);
        sessionStorage.setItem("admin_user", JSON.stringify(adminUser));
        return { success: true };
      } catch (supabaseError) {
        console.log("Using fallback admin authentication...");

        // Fallback authentication for demo purposes
        if (username === "admin" && password === "admin") {
          const adminUser: AdminUser = {
            id: "demo-admin-" + Date.now(),
            username: "admin",
            role: "admin",
            full_name: "Demo Admin",
            email: "admin@demo.com",
            is_active: true,
          };

          setAdminUser(adminUser);
          sessionStorage.setItem("admin_user", JSON.stringify(adminUser));
          return { success: true };
        } else {
          return {
            success: false,
            error: "Noto'g'ri foydalanuvchi nomi yoki parol. Demo: admin/admin",
          };
        }
      }
    } catch (error) {
      console.error("Admin login error:", error?.message || error);
      return { success: false, error: "Tizimda xatolik yuz berdi" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    sessionStorage.removeItem("admin_user");
  };

  const value = {
    adminUser,
    loading,
    login,
    logout,
    isLoggedIn: !!adminUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
