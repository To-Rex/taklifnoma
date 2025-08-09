import { createClient, SupabaseClient } from "@supabase/supabase-js";
import cacheUtils, { cachedFetch, CACHE_TIMES, CACHE_TAGS } from "./cache";

// Use environment variables or fallback to hardcoded values
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tcilxdkolqodtgowlgrh.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaWx4ZGtvbHFvZHRnb3dsZ3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTM1NTEsImV4cCI6MjA3MDIyOTU1MX0.9LFErrgcBMKQVOrl0lndUfBXMdAWmq6206sbBzgk32A";

// Enhanced Supabase client with performance optimizations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "taklifnoma-app",
      "X-Cache-Control": "max-age=300", // 5 minutes cache
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Enhanced database operations with caching and performance optimizations
// ===================================================================

// Connection pool manager
class ConnectionManager {
  private static instance: ConnectionManager;
  private connectionCount = 0;
  private maxConnections = 10;
  private activeQueries = new Map<string, Promise<any>>();

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async executeQuery<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    // Check if same query is already running
    if (this.activeQueries.has(key)) {
      return this.activeQueries.get(key);
    }

    // Execute query
    const queryPromise = this.withConnection(queryFn);
    this.activeQueries.set(key, queryPromise);

    try {
      const result = await queryPromise;
      return result;
    } finally {
      this.activeQueries.delete(key);
    }
  }

  private async withConnection<T>(queryFn: () => Promise<T>): Promise<T> {
    if (this.connectionCount >= this.maxConnections) {
      await this.waitForConnection();
    }

    this.connectionCount++;
    try {
      return await queryFn();
    } finally {
      this.connectionCount--;
    }
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.connectionCount < this.maxConnections) {
          resolve();
        } else {
          setTimeout(checkConnection, 10);
        }
      };
      checkConnection();
    });
  }
}

const connectionManager = ConnectionManager.getInstance();

// Database setup check with caching
export const checkDatabaseSetup = async (): Promise<boolean> => {
  const cached = cacheUtils.getConfig("database_setup");
  if (cached !== null) {
    console.log("📋 Using cached database setup status:", cached);
    return cached;
  }

  console.log(
    "🔍 Ma'lumotlar bazasi ulanishi va sozlamalarini tekshirmoqda...",
  );

  try {
    const result = await connectionManager.executeQuery(
      "db_setup_check",
      async () => {
        // Test multiple critical tables
        const tableTests = [
          {
            name: "profiles",
            query: () => supabase.from("profiles").select("id").limit(1),
          },
          {
            name: "invitations",
            query: () => supabase.from("invitations").select("id").limit(1),
          },
          {
            name: "custom_templates",
            query: () =>
              supabase.from("custom_templates").select("id").limit(1),
          },
        ];

        let tablesExist = 0;
        const tableResults = [];

        for (const table of tableTests) {
          try {
            const { error } = await table.query();
            if (error) {
              if (
                error.message.includes("does not exist") ||
                (error.message.includes("table") &&
                  error.message.includes("does not exist"))
              ) {
                console.warn(`❌ Jadval "${table.name}" mavjud emas`);
                tableResults.push({
                  name: table.name,
                  exists: false,
                  error: error.message,
                });
              } else {
                console.log(
                  `✅ Jadval "${table.name}" mavjud lekin kirish xatosi:`,
                  error.message,
                );
                tableResults.push({
                  name: table.name,
                  exists: true,
                  error: error.message,
                });
                tablesExist++;
              }
            } else {
              console.log(`✅ Jadval "${table.name}" mavjud va kirish mumkin`);
              tableResults.push({
                name: table.name,
                exists: true,
                error: null,
              });
              tablesExist++;
            }
          } catch (tableError) {
            console.warn(
              `❌ Jadval "${table.name}" tekshirishda xatolik:`,
              tableError,
            );
            tableResults.push({
              name: table.name,
              exists: false,
              error: tableError,
            });
          }
        }

        const isSetup = tablesExist >= 2; // At least 2 tables should exist

        console.log("🔍 Ma'lumotlar bazasi tekshiruv natijalari:", {
          topilganJadvallar: tablesExist,
          jami: tableTests.length,
          sozlangan: isSetup,
          tafsilotlar: tableResults,
        });

        return isSetup;
      },
    );

    // Cache result for 3 minutes (shorter cache for faster updates)
    cacheUtils.setConfig("database_setup", result);

    if (result) {
      console.log("✅ Ma'lumotlar bazasi to'g'ri sozlangan");
    } else {
      console.log(
        "⚠️ Ma'lumotlar bazasi sozlanmagan, fallback rejimda ishlaymiz",
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ Ma'lumotlar bazasi ulanish testi muvaffaqiyatsiz:",
      error,
    );
    cacheUtils.setConfig("database_setup", false);
    return false;
  }
};

// Test database connection health
export const testDatabaseConnection = async (): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> => {
  const startTime = Date.now();

  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        connected: false,
        latency,
        error: error.message,
      };
    }

    return {
      connected: true,
      latency,
    };
  } catch (error: any) {
    return {
      connected: false,
      latency: Date.now() - startTime,
      error: error?.message || "Noma'lum ulanish xatosi",
    };
  }
};

// Error xabaridan jadval mavjud emasligini aniqlash
export const isTableNotFoundError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || "";
  return (
    message.includes("Could not find the table") ||
    (message.includes("table") && message.includes("does not exist")) ||
    message.includes("schema cache")
  );
};

// Enhanced Template Operations with Default Templates Fallback
// ===========================================================

import { templateManager, defaultWeddingTemplates } from "./defaultTemplates";

export const templateOperations = {
  // Create template with caching
  create: async (templateData: any) => {
    try {
      const result = await connectionManager.executeQuery(
        `create_template_${Date.now()}`,
        async () => {
          const { data, error } = await supabase
            .from("custom_templates")
            .insert(templateData)
            .select()
            .single();

          if (error) throw error;
          return data;
        },
      );

      // Invalidate user templates cache
      if (templateData.user_id) {
        cacheUtils.invalidateUser(templateData.user_id);
      }

      // Cache the new template
      if (result?.id) {
        cacheUtils.setTemplate(result.id, result);
      }

      return { data: result, error: null };
    } catch (error) {
      console.error("Template creation error:", error);

      // Fallback to localStorage
      const localTemplate = {
        ...templateData,
        id: `local_${Date.now()}`,
        is_local: true,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(
        `custom_template_${localTemplate.id}`,
        JSON.stringify(localTemplate),
      );

      return { data: localTemplate, error: null };
    }
  },

  // Get templates with caching
  getByUser: async (userId: string) => {
    return cachedFetch(
      `user_templates_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from("custom_templates")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      CACHE_TIMES.MEDIUM,
      [CACHE_TAGS.TEMPLATE, CACHE_TAGS.USER],
    );
  },

  // Get popular templates with caching
  getPopular: async () => {
    return cachedFetch(
      "popular_templates",
      async () => {
        const { data, error } = await supabase
          .from("custom_templates")
          .select("*")
          .eq("is_public", true)
          .eq("is_active", true)
          .order("usage_count", { ascending: false })
          .limit(20);

        if (error) throw error;
        return data || [];
      },
      CACHE_TIMES.LONG,
      [CACHE_TAGS.TEMPLATE],
    );
  },

  // Get single template with caching
  getById: async (id: string) => {
    return cachedFetch(
      `template_${id}`,
      async () => {
        const { data, error } = await supabase
          .from("custom_templates")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return data;
      },
      CACHE_TIMES.LONG,
      [CACHE_TAGS.TEMPLATE],
    );
  },

  // Update template
  update: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from("custom_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update cache
      cacheUtils.setTemplate(id, data);

      // Invalidate related caches
      if (data?.user_id) {
        cacheUtils.invalidateUser(data.user_id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete template
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Remove from cache
      cacheUtils.invalidateTemplate(id);

      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

// Enhanced Invitation Operations
// ==============================

export const invitationOperations = {
  // Create invitation with caching
  create: async (invitationData: any) => {
    try {
      const result = await connectionManager.executeQuery(
        `create_invitation_${Date.now()}`,
        async () => {
          const { data, error } = await supabase
            .from("invitations")
            .insert(invitationData)
            .select()
            .single();

          if (error) throw error;
          return data;
        },
      );

      // Invalidate user invitations cache
      if (invitationData.user_id) {
        cacheUtils.invalidateUser(invitationData.user_id);
      }

      // Cache the new invitation
      if (result?.id) {
        cacheUtils.setInvitation(result.id, result);
      }

      return { data: result, error: null };
    } catch (error) {
      console.error("Invitation creation error:", error.message || error);

      // Fallback to localStorage
      const localInvitation = {
        ...invitationData,
        id: `local_${Date.now()}`,
        is_local: true,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(
        `invitation_${localInvitation.id}`,
        JSON.stringify(localInvitation),
      );

      // Update local count
      const currentCount = parseInt(
        localStorage.getItem("demo_invitation_count") || "0",
      );
      localStorage.setItem(
        "demo_invitation_count",
        (currentCount + 1).toString(),
      );

      return { data: localInvitation, error: null };
    }
  },

  // Get user invitations with caching
  getByUser: async (userId: string) => {
    return cachedFetch(
      `user_invitations_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      CACHE_TIMES.MEDIUM,
      [CACHE_TAGS.INVITATION, CACHE_TAGS.USER],
    );
  },

  // Get invitation by slug with caching
  getBySlug: async (slug: string) => {
    return cachedFetch(
      `invitation_slug_${slug}`,
      async () => {
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (error) throw error;
        return data;
      },
      CACHE_TIMES.LONG,
      [CACHE_TAGS.INVITATION],
    );
  },

  // Get invitation analytics with caching
  getAnalytics: async (invitationId: string) => {
    return cachedFetch(
      `analytics_${invitationId}`,
      async () => {
        const [views, rsvps, guests] = await Promise.all([
          supabase
            .from("invitation_views")
            .select("*", { count: "exact", head: true })
            .eq("invitation_id", invitationId),
          supabase
            .from("rsvps")
            .select("*", { count: "exact", head: true })
            .eq("invitation_id", invitationId),
          supabase
            .from("guests")
            .select("*", { count: "exact", head: true })
            .eq("invitation_id", invitationId),
        ]);

        return {
          views: views.count || 0,
          rsvps: rsvps.count || 0,
          guests: guests.count || 0,
        };
      },
      CACHE_TIMES.SHORT,
      [CACHE_TAGS.ANALYTICS],
    );
  },
};

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
      };
      invitations: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          groom_name: string;
          bride_name: string;
          wedding_date: string;
          wedding_time: string | null;
          venue: string;
          address: string;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          custom_message: string | null;
          template_id: string;
          image_url: string | null;
          rsvp_deadline: string | null;
          is_active: boolean;
          slug: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          groom_name: string;
          bride_name: string;
          wedding_date: string;
          wedding_time?: string | null;
          venue: string;
          address: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          custom_message?: string | null;
          template_id: string;
          image_url?: string | null;
          rsvp_deadline?: string | null;
          is_active?: boolean;
          slug: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          groom_name?: string;
          bride_name?: string;
          wedding_date?: string;
          wedding_time?: string | null;
          venue?: string;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          custom_message?: string | null;
          template_id?: string;
          image_url?: string | null;
          rsvp_deadline?: string | null;
          is_active?: boolean;
          slug?: string;
        };
      };
      guests: {
        Row: {
          id: string;
          created_at: string;
          invitation_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          plus_one: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          invitation_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          plus_one?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          invitation_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          plus_one?: boolean;
        };
      };
      rsvps: {
        Row: {
          id: string;
          created_at: string;
          invitation_id: string;
          guest_name: string;
          will_attend: boolean;
          plus_one_attending: boolean | null;
          message: string | null;
          email: string | null;
          phone: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          invitation_id: string;
          guest_name: string;
          will_attend: boolean;
          plus_one_attending?: boolean | null;
          message?: string | null;
          email?: string | null;
          phone?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          invitation_id?: string;
          guest_name?: string;
          will_attend?: boolean;
          plus_one_attending?: boolean | null;
          message?: string | null;
          email?: string | null;
          phone?: string | null;
        };
      };
    };
  };
};
