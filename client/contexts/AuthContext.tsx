import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isInitialized: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string },
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

// Default context value to prevent undefined context errors
const defaultAuthContextValue: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  isInitialized: false,
  signUp: async () => ({ error: new Error("Auth not initialized") }),
  signIn: async () => ({ error: new Error("Auth not initialized") }),
  signInWithGoogle: async () => ({ error: new Error("Auth not initialized") }),
  signOut: async () => ({ error: new Error("Auth not initialized") }),
  updateProfile: async () => ({ error: new Error("Auth not initialized") }),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export function useAuth() {
  const context = useContext(AuthContext);

  // Context should never be undefined now due to default value
  if (!context.isInitialized) {
    console.warn("useAuth called before AuthProvider initialization");
  }

  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log("AuthProvider rendering with state:", {
    user: !!user,
    profile: !!profile,
    loading,
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Test database connection first
        const testDatabaseConnection = async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("count")
              .limit(1);
            if (error) {
              console.warn("Database connection test failed:", {
                error: error,
                message: error?.message,
                hint: error?.hint,
                details: error?.details,
              });
            } else {
              console.log("Database connection test successful");
            }
          } catch (err) {
            console.warn("Database connection test error:", err);
          }
        };

        await testDatabaseConnection();

        // Get initial session and validate it
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error on load:", error);
          // Clear any stored session data
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session) {
          console.log("Session found, validating...");

          // Check if session is expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.log("Session expired, attempting refresh...");

            // Try to refresh the session
            const {
              data: { session: refreshedSession },
              error: refreshError,
            } = await supabase.auth.refreshSession();

            if (!mounted) return;

            if (refreshError || !refreshedSession) {
              console.log("Session refresh failed, signing out...");
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }

            console.log("Session refreshed successfully");
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            await loadProfile(refreshedSession.user.id);
          } else {
            console.log("Session is valid");
            setSession(session);
            setUser(session.user);
            await loadProfile(session.user.id);
          }
        } else {
          console.log("No session found");
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session?.user?.id);

      try {
        // Handle different auth events
        if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          if (!session) {
            console.log("Token refresh failed, signing out");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          console.log("Token refreshed successfully");
          setSession(session);
          setUser(session.user);

          // Only reload profile if we don't have one or if user changed
          if (!profile || profile.id !== session.user.id) {
            await loadProfile(session.user.id);
          } else {
            setLoading(false);
          }
          return;
        }

        if (event === "SIGNED_IN") {
          console.log("User signed in");

          // Validate the session
          if (!session || !session.user) {
            console.error("Invalid session on sign in");
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          setSession(session);
          setUser(session.user);
          await loadProfile(session.user.id);
          return;
        }

        // For other events, just update the session
        console.log("Other auth event:", event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && session.user.id !== profile?.id) {
          await loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        if (mounted) {
          // On error, clear everything and sign out
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Add session recovery on window focus
  useEffect(() => {
    const handleWindowFocus = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error on focus:", error);
          if (user) {
            console.log("Session error on focus, signing out...");
            await supabase.auth.signOut();
          }
          return;
        }

        if (!session) {
          // No session but we think user is logged in, sign out
          if (user) {
            console.log("No session on focus but user exists, signing out...");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          return;
        }

        // Check if session is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.log("Session expired on focus");
          if (user) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          return;
        }

        // Session exists and is valid, restore if needed
        if (session && !user) {
          console.log("Restoring valid session on focus...");
          setSession(session);
          setUser(session.user);
          if (session.user && !profile) {
            await loadProfile(session.user.id);
          }
        } else if (session && user && session.user.id !== user.id) {
          // Different user, update
          console.log("Different user detected on focus, updating...");
          setSession(session);
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error in window focus handler:", error);
      }
    };

    // Add a debounce to avoid too many calls
    let focusTimeout: NodeJS.Timeout;
    const debouncedFocusHandler = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(handleWindowFocus, 500);
    };

    window.addEventListener("focus", debouncedFocusHandler);
    return () => {
      window.removeEventListener("focus", debouncedFocusHandler);
      clearTimeout(focusTimeout);
    };
  }, [user, profile]);

  const createUserProfile = async (user: User) => {
    try {
      const newProfile = {
        id: user.id,
        email: user.email || "",
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      console.log("Creating profile with data:", newProfile);

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (!createError && createdProfile) {
        console.log("Profile created successfully:", createdProfile.id);
        return createdProfile;
      } else {
        console.warn(
          "Profile creation failed, using minimal profile:",
          createError?.message,
        );
        throw createError;
      }
    } catch (error) {
      console.warn(
        "Database profile creation failed, returning minimal profile",
      );

      // Return a complete minimal profile object for the app to continue working
      return {
        id: user.id,
        email: user.email || "",
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: null,
        company_name: null,
        is_active: true,
        settings: {},
        metadata: {},
      };
    }
  };

  const loadProfile = async (userId: string) => {
    let timeoutId: NodeJS.Timeout;
    try {
      setLoading(true);

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.log("Profile loading timeout, creating minimal profile...");
        // Create a minimal profile from user metadata
        if (session?.user) {
          const minimalProfile = {
            id: session.user.id,
            email: session.user.email || "",
            first_name: session.user.user_metadata?.first_name || null,
            last_name: session.user.user_metadata?.last_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: null,
            company_name: null,
            is_active: true,
            settings: {},
            metadata: {},
          };
          setProfile(minimalProfile);
        }
        setLoading(false);
        setIsInitialized(true);
      }, 5000); // Reduced timeout

      // Check if we can connect to database first
      try {
        const { error: testError } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);

        if (testError) {
          console.warn("Database connectivity issue:", testError.message);
          throw new Error("Database not accessible");
        }
      } catch (dbError) {
        console.warn("Database connection test failed, using minimal profile");
        // Create minimal profile from user metadata
        if (session?.user) {
          const minimalProfile = {
            id: session.user.id,
            email: session.user.email || "",
            first_name: session.user.user_metadata?.first_name || null,
            last_name: session.user.user_metadata?.last_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: null,
            company_name: null,
            is_active: true,
            settings: {},
            metadata: {},
          };
          setProfile(minimalProfile);
        }
        return;
      }

      // Try to load profile from database
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message.includes("No rows found")
        ) {
          // Profile doesn't exist, create one
          console.log(
            "Profile not found, creating new profile for user:",
            userId,
          );

          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const newProfile = await createUserProfile(userData.user);
              setProfile(newProfile);
            } else {
              console.warn("No user data available, using minimal profile");
              if (session?.user) {
                const minimalProfile = {
                  id: session.user.id,
                  email: session.user.email || "",
                  first_name: session.user.user_metadata?.first_name || null,
                  last_name: session.user.user_metadata?.last_name || null,
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  phone: null,
                  company_name: null,
                  is_active: true,
                  settings: {},
                  metadata: {},
                };
                setProfile(minimalProfile);
              }
            }
          } catch (createError) {
            console.warn(
              "Failed to create profile, using minimal profile:",
              createError,
            );
            if (session?.user) {
              const minimalProfile = {
                id: session.user.id,
                email: session.user.email || "",
                first_name: session.user.user_metadata?.first_name || null,
                last_name: session.user.user_metadata?.last_name || null,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                phone: null,
                company_name: null,
                is_active: true,
                settings: {},
                metadata: {},
              };
              setProfile(minimalProfile);
            }
          }
        } else {
          console.warn("Profile loading error:", error.message);
          // For any other error, use minimal profile
          if (session?.user) {
            const minimalProfile = {
              id: session.user.id,
              email: session.user.email || "",
              first_name: session.user.user_metadata?.first_name || null,
              last_name: session.user.user_metadata?.last_name || null,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              phone: null,
              company_name: null,
              is_active: true,
              settings: {},
              metadata: {},
            };
            setProfile(minimalProfile);
          }
        }
      } else if (data) {
        console.log("Profile loaded successfully:", data.id);
        setProfile(data);
      }
    } catch (error) {
      console.warn("Unexpected error in loadProfile, using fallback:", error);

      // Always provide a fallback profile to prevent app breakage
      if (session?.user) {
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email || "",
          first_name: session.user.user_metadata?.first_name || null,
          last_name: session.user.user_metadata?.last_name || null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: null,
          company_name: null,
          is_active: true,
          settings: {},
          metadata: {},
        };
        setProfile(fallbackProfile);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string },
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
      }

      return { error };
    } catch (err) {
      console.error("Google sign-in error:", err);
      return { error: err as any };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isInitialized,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  console.log("AuthProvider providing value:", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
