// High-Performance Caching System for TaklifNoma
// =================================================

// Cache interface
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires: number;
  tags?: string[];
}

// Cache storage
class CacheStorage {
  private storage: Map<string, CacheItem<any>> = new Map();
  private memoryLimit = 1000; // Maximum items in memory cache
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Set cache item
  set<T>(
    key: string,
    data: T,
    ttl: number = this.defaultTTL,
    tags: string[] = [],
  ): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expires: now + ttl,
      tags,
    };

    // If we're at memory limit, remove oldest items
    if (this.storage.size >= this.memoryLimit) {
      this.cleanOldItems();
    }

    this.storage.set(key, item);

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn("Failed to store in localStorage:", error);
    }
  }

  // Get cache item
  get<T>(key: string): T | null {
    // First check memory cache
    let item = this.storage.get(key);

    // If not in memory, check localStorage
    if (!item) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          item = JSON.parse(stored);
          // Add back to memory cache if still valid
          if (item && item.expires > Date.now()) {
            this.storage.set(key, item);
          }
        }
      } catch (error) {
        console.warn("Failed to read from localStorage:", error);
      }
    }

    // Check if item exists and is not expired
    if (item && item.expires > Date.now()) {
      return item.data;
    }

    // Remove expired item
    if (item) {
      this.delete(key);
    }

    return null;
  }

  // Delete cache item
  delete(key: string): void {
    this.storage.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  }

  // Clear cache by tags
  clearByTags(tags: string[]): void {
    const keysToDelete: string[] = [];

    for (const [key, item] of this.storage.entries()) {
      if (item.tags?.some((tag) => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.delete(key));
  }

  // Clear expired items
  cleanOldItems(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Remove expired items first
    for (const [key, item] of this.storage.entries()) {
      if (item.expires <= now) {
        keysToDelete.push(key);
      }
    }

    // If still too many items, remove oldest ones
    if (this.storage.size - keysToDelete.length >= this.memoryLimit) {
      const sortedEntries = Array.from(this.storage.entries())
        .filter(([key]) => !keysToDelete.includes(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const excessItems =
        this.storage.size - keysToDelete.length - this.memoryLimit + 10;
      for (let i = 0; i < excessItems; i++) {
        if (sortedEntries[i]) {
          keysToDelete.push(sortedEntries[i][0]);
        }
      }
    }

    keysToDelete.forEach((key) => this.delete(key));
  }

  // Clear all cache
  clear(): void {
    this.storage.clear();

    // Clear localStorage cache items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cache_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.storage.values()) {
      if (item.expires <= now) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.storage.size,
      valid,
      expired,
      memoryLimit: this.memoryLimit,
    };
  }
}

// Create global cache instance
const cache = new CacheStorage();

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};

// Cache tags for organized invalidation
export const CACHE_TAGS = {
  USER: "user",
  TEMPLATE: "template",
  INVITATION: "invitation",
  ANALYTICS: "analytics",
  CONFIG: "config",
};

// High-level cache operations
export const cacheUtils = {
  // Templates
  getTemplate: (id: string) => cache.get(`template_${id}`),
  setTemplate: (id: string, data: any) =>
    cache.set(`template_${id}`, data, CACHE_TIMES.LONG, [CACHE_TAGS.TEMPLATE]),

  // User templates
  getUserTemplates: (userId: string) => cache.get(`user_templates_${userId}`),
  setUserTemplates: (userId: string, data: any) =>
    cache.set(`user_templates_${userId}`, data, CACHE_TIMES.MEDIUM, [
      CACHE_TAGS.TEMPLATE,
      CACHE_TAGS.USER,
    ]),

  // Popular templates
  getPopularTemplates: () => cache.get("popular_templates"),
  setPopularTemplates: (data: any) =>
    cache.set("popular_templates", data, CACHE_TIMES.LONG, [
      CACHE_TAGS.TEMPLATE,
    ]),

  // Invitations
  getUserInvitations: (userId: string) =>
    cache.get(`user_invitations_${userId}`),
  setUserInvitations: (userId: string, data: any) =>
    cache.set(`user_invitations_${userId}`, data, CACHE_TIMES.MEDIUM, [
      CACHE_TAGS.INVITATION,
      CACHE_TAGS.USER,
    ]),

  getInvitation: (id: string) => cache.get(`invitation_${id}`),
  setInvitation: (id: string, data: any) =>
    cache.set(`invitation_${id}`, data, CACHE_TIMES.LONG, [
      CACHE_TAGS.INVITATION,
    ]),

  // Analytics
  getInvitationAnalytics: (id: string) => cache.get(`analytics_${id}`),
  setInvitationAnalytics: (id: string, data: any) =>
    cache.set(`analytics_${id}`, data, CACHE_TIMES.SHORT, [
      CACHE_TAGS.ANALYTICS,
    ]),

  // Configuration
  getConfig: (key: string) => cache.get(`config_${key}`),
  setConfig: (key: string, data: any) =>
    cache.set(`config_${key}`, data, CACHE_TIMES.VERY_LONG, [
      CACHE_TAGS.CONFIG,
    ]),

  // Invalidation helpers
  invalidateUser: (userId: string) => {
    cache.clearByTags([CACHE_TAGS.USER]);
    cache.delete(`user_templates_${userId}`);
    cache.delete(`user_invitations_${userId}`);
  },

  invalidateTemplate: (templateId: string) => {
    cache.delete(`template_${templateId}`);
    cache.clearByTags([CACHE_TAGS.TEMPLATE]);
  },

  invalidateInvitation: (invitationId: string) => {
    cache.delete(`invitation_${invitationId}`);
    cache.delete(`analytics_${invitationId}`);
  },

  // Cleanup
  cleanup: () => cache.cleanOldItems(),
  clear: () => cache.clear(),
  stats: () => cache.getStats(),
};

// Auto cleanup every 5 minutes
setInterval(
  () => {
    cacheUtils.cleanup();
  },
  5 * 60 * 1000,
);

// Export cache utilities
export default cacheUtils;

// Performance monitoring
export const performance = {
  // Measure cache hit rate
  measureCachePerformance: () => {
    const stats = cache.getStats();
    const hitRate = stats.valid / (stats.valid + stats.expired);

    console.log("Cache Performance:", {
      hitRate: (hitRate * 100).toFixed(2) + "%",
      ...stats,
    });

    return { hitRate, ...stats };
  },

  // Time function execution
  timeExecution: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    console.log(`${label} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
  },
};

// Enhanced fetch with caching
export const cachedFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TIMES.MEDIUM,
  tags: string[] = [],
): Promise<T> => {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, fetch and cache the result
  const data = await fetcher();
  cache.set(key, data, ttl, tags);

  return data;
};

// Batch operations for better performance
export const batchCache = {
  // Set multiple items at once
  setMultiple: <T>(
    items: { key: string; data: T; ttl?: number; tags?: string[] }[],
  ) => {
    items.forEach(({ key, data, ttl, tags }) => {
      cache.set(key, data, ttl, tags);
    });
  },

  // Get multiple items at once
  getMultiple: <T>(keys: string[]): (T | null)[] => {
    return keys.map((key) => cache.get<T>(key));
  },

  // Delete multiple items at once
  deleteMultiple: (keys: string[]) => {
    keys.forEach((key) => cache.delete(key));
  },
};
