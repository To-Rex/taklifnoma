// Default Templates System with Database Fallback
// ===============================================

export interface DefaultTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: any;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  layout: {
    style: string;
    spacing: string;
    alignment: string;
  };
  preview: string;
  is_public: boolean;
  is_featured: boolean;
  usage_count: number;
}

// Default Wedding Invitation Templates
export const defaultWeddingTemplates: DefaultTemplate[] = [
  {
    id: "classic-elegant",
    name: "Klassik Nafis",
    description: "Klassik va nafis dizayn, rasmiy to'ylar uchun mukammal",
    category: "classic",
    config: {
      style: "classic",
      layout: "centered",
      animations: true,
      decorative_elements: true,
    },
    colors: {
      primary: "#2C3E50",
      secondary: "#ECF0F1",
      accent: "#E67E22",
      background: "#FFFFFF",
      text: "#2C3E50",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Lora",
      accent: "Dancing Script",
    },
    layout: {
      style: "classic",
      spacing: "comfortable",
      alignment: "center",
    },
    preview: "💍",
    is_public: true,
    is_featured: true,
    usage_count: 150,
  },
  {
    id: "modern-minimalist",
    name: "Zamonaviy Minimalist",
    description:
      "Oddiy va zamonaviy dizayn, minimalist uslubni yaxshi ko'radiganlar uchun",
    category: "modern",
    config: {
      style: "modern",
      layout: "clean",
      animations: true,
      decorative_elements: false,
    },
    colors: {
      primary: "#3498DB",
      secondary: "#BDC3C7",
      accent: "#E74C3C",
      background: "#FFFFFF",
      text: "#2C3E50",
    },
    fonts: {
      heading: "Inter",
      body: "Inter",
      accent: "Inter",
    },
    layout: {
      style: "modern",
      spacing: "spacious",
      alignment: "left",
    },
    preview: "✨",
    is_public: true,
    is_featured: true,
    usage_count: 120,
  },
  {
    id: "romantic-floral",
    name: "Romantik Gullar",
    description: "Romantik va gullar bilan bezatilgan chiroyli dizayn",
    category: "romantic",
    config: {
      style: "romantic",
      layout: "decorative",
      animations: true,
      decorative_elements: true,
      floral_pattern: true,
    },
    colors: {
      primary: "#E91E63",
      secondary: "#FCE4EC",
      accent: "#FF9800",
      background: "#FFF8E1",
      text: "#880E4F",
    },
    fonts: {
      heading: "Dancing Script",
      body: "Lora",
      accent: "Great Vibes",
    },
    layout: {
      style: "romantic",
      spacing: "comfortable",
      alignment: "center",
    },
    preview: "🌹",
    is_public: true,
    is_featured: true,
    usage_count: 200,
  },
  {
    id: "luxury-gold",
    name: "Hashamatli Oltin",
    description: "Hashamatli oltin ranglarda, VIP to'ylar uchun",
    category: "luxury",
    config: {
      style: "luxury",
      layout: "premium",
      animations: true,
      decorative_elements: true,
      gold_accents: true,
    },
    colors: {
      primary: "#B8860B",
      secondary: "#FFF8DC",
      accent: "#FFD700",
      background: "#FFFEF7",
      text: "#8B4513",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Crimson Text",
      accent: "Allura",
    },
    layout: {
      style: "luxury",
      spacing: "elegant",
      alignment: "center",
    },
    preview: "👑",
    is_public: true,
    is_featured: true,
    usage_count: 80,
  },
  {
    id: "traditional-uzbek",
    name: "An'anaviy O'zbek",
    description: "O'zbek milliy an'analariga mos keluvchi dizayn",
    category: "traditional",
    config: {
      style: "traditional",
      layout: "cultural",
      animations: true,
      decorative_elements: true,
      uzbek_patterns: true,
    },
    colors: {
      primary: "#1B5E20",
      secondary: "#E8F5E8",
      accent: "#FF6F00",
      background: "#FFFDE7",
      text: "#2E7D32",
    },
    fonts: {
      heading: "Poppins",
      body: "Open Sans",
      accent: "Dancing Script",
    },
    layout: {
      style: "traditional",
      spacing: "comfortable",
      alignment: "center",
    },
    preview: "🕌",
    is_public: true,
    is_featured: true,
    usage_count: 95,
  },
  {
    id: "garden-nature",
    name: "Bog' va Tabiat",
    description: "Tabiat va yashillik sevuvchilar uchun",
    category: "nature",
    config: {
      style: "nature",
      layout: "organic",
      animations: true,
      decorative_elements: true,
      nature_elements: true,
    },
    colors: {
      primary: "#2E7D32",
      secondary: "#C8E6C9",
      accent: "#FF9800",
      background: "#F1F8E9",
      text: "#1B5E20",
    },
    fonts: {
      heading: "Merriweather",
      body: "Open Sans",
      accent: "Dancing Script",
    },
    layout: {
      style: "nature",
      spacing: "organic",
      alignment: "center",
    },
    preview: "🌿",
    is_public: true,
    is_featured: false,
    usage_count: 60,
  },
  {
    id: "vintage-retro",
    name: "Vintage Retro",
    description: "Eski uslubdagi vintage dizayn",
    category: "vintage",
    config: {
      style: "vintage",
      layout: "retro",
      animations: false,
      decorative_elements: true,
      vintage_border: true,
    },
    colors: {
      primary: "#5D4037",
      secondary: "#EFEBE9",
      accent: "#FF7043",
      background: "#FFF3E0",
      text: "#3E2723",
    },
    fonts: {
      heading: "Crimson Text",
      body: "Lora",
      accent: "Dancing Script",
    },
    layout: {
      style: "vintage",
      spacing: "cozy",
      alignment: "center",
    },
    preview: "📜",
    is_public: true,
    is_featured: false,
    usage_count: 45,
  },
  {
    id: "beach-summer",
    name: "Plyaj va Yoz",
    description: "Yozgi va plyaj to'ylar uchun yorqin dizayn",
    category: "summer",
    config: {
      style: "summer",
      layout: "beach",
      animations: true,
      decorative_elements: true,
      beach_elements: true,
    },
    colors: {
      primary: "#0288D1",
      secondary: "#B3E5FC",
      accent: "#FF9800",
      background: "#E1F5FE",
      text: "#01579B",
    },
    fonts: {
      heading: "Montserrat",
      body: "Open Sans",
      accent: "Dancing Script",
    },
    layout: {
      style: "summer",
      spacing: "relaxed",
      alignment: "center",
    },
    preview: "🏖️",
    is_public: true,
    is_featured: false,
    usage_count: 75,
  },
];

// Template categories with counts
export const templateCategories = [
  { id: "all", name: "Hammasi", count: defaultWeddingTemplates.length },
  {
    id: "classic",
    name: "Klassik",
    count: defaultWeddingTemplates.filter((t) => t.category === "classic")
      .length,
  },
  {
    id: "modern",
    name: "Zamonaviy",
    count: defaultWeddingTemplates.filter((t) => t.category === "modern")
      .length,
  },
  {
    id: "romantic",
    name: "Romantik",
    count: defaultWeddingTemplates.filter((t) => t.category === "romantic")
      .length,
  },
  {
    id: "luxury",
    name: "Hashamatli",
    count: defaultWeddingTemplates.filter((t) => t.category === "luxury")
      .length,
  },
  {
    id: "traditional",
    name: "An'anaviy",
    count: defaultWeddingTemplates.filter((t) => t.category === "traditional")
      .length,
  },
  {
    id: "nature",
    name: "Tabiat",
    count: defaultWeddingTemplates.filter((t) => t.category === "nature")
      .length,
  },
  {
    id: "vintage",
    name: "Vintage",
    count: defaultWeddingTemplates.filter((t) => t.category === "vintage")
      .length,
  },
  {
    id: "summer",
    name: "Yozgi",
    count: defaultWeddingTemplates.filter((t) => t.category === "summer")
      .length,
  },
];

// Get templates by category
export const getTemplatesByCategory = (
  categoryId: string,
): DefaultTemplate[] => {
  if (categoryId === "all") {
    return defaultWeddingTemplates;
  }
  return defaultWeddingTemplates.filter(
    (template) => template.category === categoryId,
  );
};

// Get featured templates
export const getFeaturedTemplates = (): DefaultTemplate[] => {
  return defaultWeddingTemplates.filter((template) => template.is_featured);
};

// Get popular templates (sorted by usage count)
export const getPopularTemplates = (): DefaultTemplate[] => {
  return [...defaultWeddingTemplates].sort(
    (a, b) => b.usage_count - a.usage_count,
  );
};

// Template storage and loading system
export class TemplateManager {
  private static instance: TemplateManager;
  private loadedTemplates: DefaultTemplate[] = [];
  private isLoaded = false;

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  // Load templates from database or use defaults
  async loadTemplates(forceReload = false): Promise<DefaultTemplate[]> {
    if (this.isLoaded && !forceReload) {
      return this.loadedTemplates;
    }

    try {
      console.log("🔄 Loading templates...");

      // Try to load from database first
      // This will be implemented with actual database call
      // For now, use defaults

      this.loadedTemplates = defaultWeddingTemplates;
      this.isLoaded = true;

      console.log(
        "✅ Templates loaded successfully:",
        this.loadedTemplates.length,
      );
      return this.loadedTemplates;
    } catch (error) {
      console.warn(
        "⚠️ Failed to load templates from database, using defaults:",
        error,
      );
      this.loadedTemplates = defaultWeddingTemplates;
      this.isLoaded = true;
      return this.loadedTemplates;
    }
  }

  // Get all templates
  async getAllTemplates(): Promise<DefaultTemplate[]> {
    return this.loadTemplates();
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<DefaultTemplate | null> {
    const templates = await this.loadTemplates();
    return templates.find((template) => template.id === id) || null;
  }

  // Search templates
  async searchTemplates(query: string): Promise<DefaultTemplate[]> {
    const templates = await this.loadTemplates();
    const searchTerm = query.toLowerCase();

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm),
    );
  }

  // Get templates by category
  async getTemplatesByCategory(categoryId: string): Promise<DefaultTemplate[]> {
    const templates = await this.loadTemplates();

    if (categoryId === "all") {
      return templates;
    }

    return templates.filter((template) => template.category === categoryId);
  }

  // Get featured templates
  async getFeaturedTemplates(): Promise<DefaultTemplate[]> {
    const templates = await this.loadTemplates();
    return templates.filter((template) => template.is_featured);
  }

  // Get popular templates
  async getPopularTemplates(): Promise<DefaultTemplate[]> {
    const templates = await this.loadTemplates();
    return [...templates].sort((a, b) => b.usage_count - a.usage_count);
  }

  // Initialize templates in localStorage for offline access
  initializeLocalStorage(): void {
    try {
      const stored = localStorage.getItem("default_templates");
      if (!stored) {
        localStorage.setItem(
          "default_templates",
          JSON.stringify(defaultWeddingTemplates),
        );
        console.log("✅ Default templates saved to localStorage");
      }
    } catch (error) {
      console.warn("⚠️ Failed to save templates to localStorage:", error);
    }
  }

  // Load from localStorage if database is unavailable
  loadFromLocalStorage(): DefaultTemplate[] {
    try {
      const stored = localStorage.getItem("default_templates");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("⚠️ Failed to load templates from localStorage:", error);
    }
    return defaultWeddingTemplates;
  }
}

// Export singleton instance
export const templateManager = TemplateManager.getInstance();

// Initialize on import
templateManager.initializeLocalStorage();

// Backward compatibility exports
export const weddingTemplates = defaultWeddingTemplates;
