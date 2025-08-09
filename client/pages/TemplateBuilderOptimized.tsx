import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { templateOperations } from "@/lib/supabase";
import cacheUtils from "@/lib/cache";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Palette,
  Type,
  Layout,
  Settings,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import TemplateRenderer from "@/components/TemplateRenderer";

// Template configuration interface
interface TemplateConfig {
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
  animations: {
    enabled: boolean;
    type: string;
    duration: string;
  };
}

// Default template configuration
const defaultConfig: TemplateConfig = {
  colors: {
    primary: "#3B82F6",
    secondary: "#10B981",
    accent: "#F59E0B",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  fonts: {
    heading: "Poppins",
    body: "Inter",
    accent: "Playfair Display",
  },
  layout: {
    style: "modern",
    spacing: "comfortable",
    alignment: "center",
  },
  animations: {
    enabled: true,
    type: "fade",
    duration: "0.5s",
  },
};

// Color presets for quick styling
const colorPresets = [
  {
    name: "Klassik Ko'k",
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      background: "#F8FAFC",
      text: "#1F2937",
    },
  },
  {
    name: "Romantik Pushti",
    colors: {
      primary: "#EC4899",
      secondary: "#BE185D",
      accent: "#F9A8D4",
      background: "#FDF2F8",
      text: "#831843",
    },
  },
  {
    name: "Elegant Qora",
    colors: {
      primary: "#1F2937",
      secondary: "#374151",
      accent: "#D1D5DB",
      background: "#F9FAFB",
      text: "#111827",
    },
  },
  {
    name: "Tabiat Yashil",
    colors: {
      primary: "#10B981",
      secondary: "#047857",
      accent: "#6EE7B7",
      background: "#F0FDF4",
      text: "#064E3B",
    },
  },
];

export default function TemplateBuilderOptimized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState<TemplateConfig>(defaultConfig);
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "custom",
    isPublic: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  // Load cached template if available
  useEffect(() => {
    if (user?.id) {
      const cachedDraft = cacheUtils.getConfig(`template_draft_${user.id}`);
      if (cachedDraft) {
        setConfig(cachedDraft.config || defaultConfig);
        setTemplateData(cachedDraft.templateData || templateData);
      }
    }
  }, [user?.id]);

  // Auto-save draft to cache
  useEffect(() => {
    if (user?.id) {
      const draftData = { config, templateData };
      cacheUtils.setConfig(`template_draft_${user.id}`, draftData);
    }
  }, [config, templateData, user?.id]);

  // Color preset application
  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setConfig((prev) => ({
      ...prev,
      colors: preset.colors,
    }));
  };

  // Configuration updaters
  const updateColors = (
    colorKey: keyof TemplateConfig["colors"],
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value },
    }));
  };

  const updateFonts = (
    fontKey: keyof TemplateConfig["fonts"],
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [fontKey]: value },
    }));
  };

  const updateLayout = (
    layoutKey: keyof TemplateConfig["layout"],
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      layout: { ...prev.layout, [layoutKey]: value },
    }));
  };

  // High-performance template saving
  const saveTemplate = async () => {
    if (!user) {
      setError("Shablon saqlash uchun tizimga kirishingiz kerak");
      return;
    }

    if (!templateData.name?.trim()) {
      setError("Iltimos, shablon nomini kiriting");
      return;
    }

    if (!templateData.description?.trim()) {
      setError("Iltimos, shablon tavsifini kiriting");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("🚀 Starting high-performance template save...");

      const templateToSave = {
        user_id: user.id,
        name: templateData.name.trim(),
        description: templateData.description.trim(),
        category: templateData.category,
        config: config,
        colors: config.colors,
        fonts: config.fonts,
        layout: config.layout,
        is_public: templateData.isPublic,
        is_featured: false,
        tags: [],
        metadata: {
          created_with: "TemplateBuilder v2.0",
          performance_optimized: true,
        },
      };

      console.log("📋 Template data prepared:", templateToSave);

      // Use optimized template operations with automatic caching and fallback
      const { data, error: saveError } =
        await templateOperations.create(templateToSave);

      if (saveError) {
        console.error("❌ Template save error:", saveError);
        throw new Error(
          saveError.message || "Shablon saqlanishda xatolik yuz berdi",
        );
      }

      console.log("✅ Template saved successfully:", data);
      setSuccess(
        "Shablon muvaffaqiyatli saqlandi! Shablonlar sahifasiga o'tilmoqda...",
      );

      // Clear draft cache
      if (user?.id) {
        cacheUtils.delete(`template_draft_${user.id}`);
      }

      // Navigate after showing success
      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } catch (err: any) {
      console.error("❌ Template save failed:", err);
      setError(err.message || "Kutilmagan xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Mock invitation data for preview
  const getMockInvitationData = () => ({
    id: "preview",
    groom_name: "Jahongir",
    bride_name: "Sarvinoz",
    wedding_date: "2024-06-15",
    wedding_time: "16:00",
    venue: "Atirgul Bog'i",
    address: "Toshkent sh., Yunusobod t., Bog' ko'chasi 123",
    city: "Toshkent",
    custom_message:
      "Bizning sevgi va baxt to'la kunimizni birga nishonlash uchun sizni taklif qilamiz.",
    template_id: "custom",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation showBackButton />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Shablon Yaratuvchi
              </h1>
              <p className="text-muted-foreground">
                Professional taklifnoma shablonini yarating
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Tahrirlash" : "Oldindan ko'rish"}
            </Button>
            <Button
              onClick={saveTemplate}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Shablonni Saqlash
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {showPreview ? (
          /* Preview Mode */
          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
              Shablon Oldindan Ko'rish
            </h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <TemplateRenderer
                invitation={getMockInvitationData()}
                guestName="Hurmatli Mehmon"
                customConfig={config}
              />
            </div>
          </div>
        ) : (
          /* Editor Mode */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-6">
                <Tabs defaultValue="basic" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">
                      <Settings className="w-4 h-4 mr-2" />
                      Asosiy
                    </TabsTrigger>
                    <TabsTrigger value="colors">
                      <Palette className="w-4 h-4 mr-2" />
                      Ranglar
                    </TabsTrigger>
                    <TabsTrigger value="fonts">
                      <Type className="w-4 h-4 mr-2" />
                      Shriftlar
                    </TabsTrigger>
                    <TabsTrigger value="layout">
                      <Layout className="w-4 h-4 mr-2" />
                      Joylashuv
                    </TabsTrigger>
                  </TabsList>

                  {/* Basic Settings */}
                  <TabsContent value="basic" className="space-y-6">
                    <div>
                      <Label
                        htmlFor="templateName"
                        className="text-base font-medium"
                      >
                        Shablon Nomi
                      </Label>
                      <Input
                        id="templateName"
                        placeholder="Masalan: Klassik To'y Taklifnomasi"
                        value={templateData.name}
                        onChange={(e) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="description"
                        className="text-base font-medium"
                      >
                        Tavsif
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Shablon haqida qisqacha ma'lumot..."
                        value={templateData.description}
                        onChange={(e) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        Kategoriya
                      </Label>
                      <select
                        value={templateData.category}
                        onChange={(e) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="mt-2 w-full p-2 border border-border rounded-lg bg-background"
                      >
                        <option value="custom">Maxsus</option>
                        <option value="classic">Klassik</option>
                        <option value="modern">Zamonaviy</option>
                        <option value="elegant">Nafis</option>
                        <option value="minimalist">Minimalist</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={templateData.isPublic}
                        onChange={(e) =>
                          setTemplateData((prev) => ({
                            ...prev,
                            isPublic: e.target.checked,
                          }))
                        }
                        className="rounded border-border"
                      />
                      <Label htmlFor="isPublic" className="text-sm">
                        Ommaviy shablon (boshqalar ham foydalanishi mumkin)
                      </Label>
                    </div>
                  </TabsContent>

                  {/* Color Settings */}
                  <TabsContent value="colors" className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Tayyor Rang Sxemalari
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {colorPresets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyColorPreset(preset)}
                            className="p-3 border border-border rounded-lg hover:border-primary transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: preset.colors.primary,
                                }}
                              />
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: preset.colors.secondary,
                                }}
                              />
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: preset.colors.accent,
                                }}
                              />
                            </div>
                            <p className="text-sm font-medium">{preset.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(config.colors).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-sm font-medium capitalize">
                            {key === "primary"
                              ? "Asosiy"
                              : key === "secondary"
                                ? "Ikkinchi"
                                : key === "accent"
                                  ? "Urg'u"
                                  : key === "background"
                                    ? "Fon"
                                    : "Matn"}
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) =>
                                updateColors(
                                  key as keyof TemplateConfig["colors"],
                                  e.target.value,
                                )
                              }
                              className="w-12 h-10 rounded border border-border"
                            />
                            <Input
                              value={value}
                              onChange={(e) =>
                                updateColors(
                                  key as keyof TemplateConfig["colors"],
                                  e.target.value,
                                )
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Font Settings */}
                  <TabsContent value="fonts" className="space-y-6">
                    {Object.entries(config.fonts).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-base font-medium capitalize">
                          {key === "heading"
                            ? "Sarlavha Shrifti"
                            : key === "body"
                              ? "Matn Shrifti"
                              : "Urg'u Shrifti"}
                        </Label>
                        <select
                          value={value}
                          onChange={(e) =>
                            updateFonts(
                              key as keyof TemplateConfig["fonts"],
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full p-2 border border-border rounded-lg bg-background"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Playfair Display">
                            Playfair Display
                          </option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                        </select>
                      </div>
                    ))}
                  </TabsContent>

                  {/* Layout Settings */}
                  <TabsContent value="layout" className="space-y-6">
                    {Object.entries(config.layout).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-base font-medium capitalize">
                          {key === "style"
                            ? "Uslub"
                            : key === "spacing"
                              ? "Oraliq"
                              : "Hizalash"}
                        </Label>
                        <select
                          value={value}
                          onChange={(e) =>
                            updateLayout(
                              key as keyof TemplateConfig["layout"],
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full p-2 border border-border rounded-lg bg-background"
                        >
                          {key === "style" && (
                            <>
                              <option value="modern">Zamonaviy</option>
                              <option value="classic">Klassik</option>
                              <option value="elegant">Nafis</option>
                              <option value="minimalist">Minimalist</option>
                            </>
                          )}
                          {key === "spacing" && (
                            <>
                              <option value="compact">Ixcham</option>
                              <option value="comfortable">Qulay</option>
                              <option value="spacious">Keng</option>
                            </>
                          )}
                          {key === "alignment" && (
                            <>
                              <option value="left">Chapga</option>
                              <option value="center">Markazga</option>
                              <option value="right">O'ngga</option>
                            </>
                          )}
                        </select>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-4 sticky top-6">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                  Jonli Oldindan Ko'rish
                </h3>
                <div className="border border-border rounded-lg overflow-hidden aspect-[3/4]">
                  <div className="scale-50 origin-top-left w-[200%] h-[200%]">
                    <TemplateRenderer
                      invitation={getMockInvitationData()}
                      guestName="Mehmon"
                      customConfig={config}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  O'zgarishlar avtomatik ko'rsatiladi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
