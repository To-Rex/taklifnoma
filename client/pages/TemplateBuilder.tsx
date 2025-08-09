import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Save,
  Eye,
  Palette,
  Type,
  Layout,
  RotateCcw,
  Sparkles,
  Loader2,
  Check,
  X,
  Monitor,
  Smartphone,
  Heart,
  Star,
  Settings,
  Download,
  Share2,
  Zap,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";

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
    style: "classic" | "modern" | "elegant" | "rustic" | "luxury";
    spacing: number;
    borderRadius: number;
    shadowIntensity: number;
    padding: number;
  };
  animations: {
    enabled: boolean;
    type: "fade" | "slide" | "scale" | "bounce";
    duration: number;
  };
}

interface InvitationData {
  templateName: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingTime: string;
  venue: string;
  address: string;
  customMessage: string;
}

export default function TemplateBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Template data for real-time preview
  const [templateData, setTemplateData] = useState<InvitationData>({
    templateName: "Yangi Shablon",
    groomName: "Jahongir",
    brideName: "Sarvinoz",
    weddingDate: "15 Iyun, 2024",
    weddingTime: "16:00",
    venue: "Atirgul Bog'i",
    address: "Toshkent sh., Yunusobod t., Bog' ko'chasi 123",
    customMessage:
      "Bizning sevgi va baxt to'la kunimizni birga nishonlash uchun sizni taklif qilamiz.",
  });

  const [config, setConfig] = useState<TemplateConfig>({
    colors: {
      primary: "hsl(220, 91%, 56%)",
      secondary: "hsl(220, 14%, 96%)",
      accent: "hsl(220, 91%, 66%)",
      background: "hsl(0, 0%, 100%)",
      text: "hsl(224, 71%, 4%)",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Inter",
      accent: "Dancing Script",
    },
    layout: {
      style: "elegant",
      spacing: 24,
      borderRadius: 16,
      shadowIntensity: 12,
      padding: 32,
    },
    animations: {
      enabled: true,
      type: "fade",
      duration: 0.5,
    },
  });

  const colorPresets = [
    {
      name: "TaklifNoma Asosiy",
      emoji: "💎",
      colors: {
        primary: "hsl(220, 91%, 56%)",
        secondary: "hsl(220, 14%, 96%)",
        accent: "hsl(220, 91%, 66%)",
        background: "hsl(0, 0%, 100%)",
        text: "hsl(224, 71%, 4%)",
      },
    },
    {
      name: "Romantik Pushti",
      emoji: "🌸",
      colors: {
        primary: "#be185d",
        secondary: "#fda4af",
        accent: "#fb7185",
        background: "#fdf2f8",
        text: "#881337",
      },
    },
    {
      name: "Zamonaviy Ko'k",
      emoji: "💙",
      colors: {
        primary: "#2563eb",
        secondary: "#60a5fa",
        accent: "#3b82f6",
        background: "#eff6ff",
        text: "#1e3a8a",
      },
    },
    {
      name: "Zarhal Oltin",
      emoji: "✨",
      colors: {
        primary: "#d97706",
        secondary: "#fbbf24",
        accent: "#f59e0b",
        background: "#fffbeb",
        text: "#92400e",
      },
    },
    {
      name: "Tabiat Yashil",
      emoji: "🌿",
      colors: {
        primary: "#059669",
        secondary: "#34d399",
        accent: "#10b981",
        background: "#ecfdf5",
        text: "#064e3b",
      },
    },
    {
      name: "Hashamatli Binafsha",
      emoji: "💜",
      colors: {
        primary: "#7c3aed",
        secondary: "#a78bfa",
        accent: "#8b5cf6",
        background: "#f5f3ff",
        text: "#581c87",
      },
    },
    {
      name: "Klassik Qora",
      emoji: "🖤",
      colors: {
        primary: "#1f2937",
        secondary: "#6b7280",
        accent: "#d97706",
        background: "#ffffff",
        text: "#111827",
      },
    },
  ];

  const fontOptions = [
    { value: "Inter", label: "Inter (Zamonaviy)" },
    { value: "Poppins", label: "Poppins (Yumaloq)" },
    { value: "Playfair Display", label: "Playfair Display (Klassik)" },
    { value: "Dancing Script", label: "Dancing Script (Qo'lyozma)" },
    { value: "Montserrat", label: "Montserrat (Aniq)" },
    { value: "Lora", label: "Lora (O'qish uchun)" },
    { value: "Open Sans", label: "Open Sans (Sodda)" },
    { value: "Roboto", label: "Roboto (Texnologik)" },
    { value: "Merriweather", label: "Merriweather (Jurnalistik)" },
    { value: "Crimson Text", label: "Crimson Text (Akademik)" },
    { value: "Great Vibes", label: "Great Vibes (Nafis)" },
    { value: "Libre Baskerville", label: "Libre Baskerville (Klassik)" },
  ];

  const layoutStyles = [
    {
      value: "classic",
      label: "Klassik",
      description: "An'anaviy va rasmiiy dizayn",
      icon: "📜",
    },
    {
      value: "modern",
      label: "Zamonaviy",
      description: "Minimalistik va sodda",
      icon: "✨",
    },
    {
      value: "elegant",
      label: "Nafis",
      description: "Chiroyli va mukammal",
      icon: "💎",
    },
    {
      value: "rustic",
      label: "Tabiy",
      description: "Tabiy va issiq his",
      icon: "🌿",
    },
    {
      value: "luxury",
      label: "Hashamatli",
      description: "Dabdabali va noyob",
      icon: "👑",
    },
  ];

  const animationTypes = [
    { value: "fade", label: "Fade (Paydo bo'lish)" },
    { value: "slide", label: "Slide (Sirpanish)" },
    { value: "scale", label: "Scale (Kattayish)" },
    { value: "bounce", label: "Bounce (Sakrash)" },
  ];

  const handleColorChange = (
    colorType: keyof TemplateConfig["colors"],
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: value,
      },
    }));
  };

  const handleFontChange = (
    fontType: keyof TemplateConfig["fonts"],
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontType]: value,
      },
    }));
  };

  const handleLayoutChange = (
    layoutKey: keyof TemplateConfig["layout"],
    value: any,
  ) => {
    setConfig((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [layoutKey]: value,
      },
    }));
  };

  const handleAnimationChange = (
    animKey: keyof TemplateConfig["animations"],
    value: any,
  ) => {
    setConfig((prev) => ({
      ...prev,
      animations: {
        ...prev.animations,
        [animKey]: value,
      },
    }));
  };

  const handleTemplateDataChange = (
    key: keyof InvitationData,
    value: string,
  ) => {
    setTemplateData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setConfig((prev) => ({
      ...prev,
      colors: preset.colors,
    }));
  };

  const saveTemplate = async () => {
    if (!user) {
      setError("Shablon saqlash uchun tizimga kirishingiz kerak");
      return;
    }

    if (!templateData.templateName.trim()) {
      setError("Iltimos, shablon nomini kiriting");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const templateToSave = {
        user_id: user.id,
        name: templateData.templateName.trim(),
        description: `Maxsus shablon - ${new Date().toLocaleDateString("uz-UZ")}`,
        category: "custom",
        config: config,
        colors: config.colors,
        fonts: config.fonts,
        layout: config.layout,
        is_public: false,
        is_featured: false,
        tags: [config.layout.style, "maxsus", "real-time"],
      };

      const { data, error: saveError } = await supabase
        .from("custom_templates")
        .insert(templateToSave)
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      setSuccess("🎉 Shablon muvaffaqiyatli saqlandi!");

      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } catch (err: any) {
      console.error("Template save error:", err);

      // Save to localStorage as fallback
      const fallbackTemplate = {
        id: `local_${Date.now()}`,
        ...templateData,
        config: config,
        created_at: new Date().toISOString(),
        is_local: true,
      };

      localStorage.setItem(
        `custom_template_${fallbackTemplate.id}`,
        JSON.stringify(fallbackTemplate),
      );

      setSuccess("✅ Shablon vaqtincha saqlandi (mahalliy xotira)");

      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      colors: {
        primary: "hsl(220, 91%, 56%)",
        secondary: "hsl(220, 14%, 96%)",
        accent: "hsl(220, 91%, 66%)",
        background: "hsl(0, 0%, 100%)",
        text: "hsl(224, 71%, 4%)",
      },
      fonts: {
        heading: "Playfair Display",
        body: "Inter",
        accent: "Dancing Script",
      },
      layout: {
        style: "elegant",
        spacing: 24,
        borderRadius: 16,
        shadowIntensity: 12,
        padding: 32,
      },
      animations: {
        enabled: true,
        type: "fade",
        duration: 0.5,
      },
    });
  };

  // Real-time Template Preview Component with device switching
  const TemplatePreview = () => {
    const containerStyle = {
      backgroundColor: config.colors.background,
      color: config.colors.text,
      fontFamily: config.fonts.body,
      padding: `${config.layout.padding}px`,
      borderRadius: `${config.layout.borderRadius}px`,
      boxShadow: `0 ${config.layout.shadowIntensity}px ${config.layout.shadowIntensity * 2}px rgba(0,0,0,0.1)`,
      border: `2px solid ${config.colors.accent}20`,
      transition: config.animations.enabled
        ? `all ${config.animations.duration}s ease-in-out`
        : "none",
      transform:
        config.animations.enabled && config.animations.type === "scale"
          ? "scale(1.02)"
          : "scale(1)",
    };

    const headingStyle = {
      fontFamily: config.fonts.heading,
      color: config.colors.primary,
      transition: config.animations.enabled
        ? `all ${config.animations.duration}s ease-in-out`
        : "none",
    };

    const accentStyle = {
      fontFamily: config.fonts.accent,
      color: config.colors.accent,
      transition: config.animations.enabled
        ? `all ${config.animations.duration}s ease-in-out`
        : "none",
    };

    const getLayoutClass = () => {
      switch (config.layout.style) {
        case "classic":
          return "text-center space-y-6";
        case "modern":
          return "text-center space-y-4";
        case "elegant":
          return "text-center space-y-8";
        case "rustic":
          return "text-left space-y-6";
        case "luxury":
          return "text-center space-y-10";
        default:
          return "text-center space-y-6";
      }
    };

    const deviceClass =
      previewDevice === "mobile"
        ? "max-w-xs"
        : "max-w-sm md:max-w-md lg:max-w-lg";

    return (
      <div
        className={`w-full ${deviceClass} mx-auto transition-all duration-500`}
      >
        <div
          className="transition-all duration-500 hover:shadow-xl"
          style={containerStyle}
        >
          <div className={getLayoutClass()}>
            {/* Decorative Header */}
            <div className="flex justify-center items-center space-x-2 mb-4">
              <div
                className="w-12 h-0.5 transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
              <Heart
                className="w-4 h-4 animate-pulse"
                style={{ color: config.colors.accent }}
              />
              <div
                className="w-12 h-0.5 transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
            </div>

            {/* Header Text */}
            <div className="space-y-2">
              <div
                className="text-xs font-medium tracking-widest uppercase opacity-75"
                style={{ color: config.colors.secondary }}
              >
                To'y Taklifnomasi
              </div>
            </div>

            {/* Names with real-time updates */}
            <div className="space-y-3">
              <h1
                className={`${previewDevice === "mobile" ? "text-lg sm:text-xl" : "text-2xl md:text-3xl xl:text-4xl"} font-bold tracking-wide transition-all duration-300`}
                style={headingStyle}
              >
                {templateData.groomName}
              </h1>
              <div
                className={`${previewDevice === "mobile" ? "text-2xl sm:text-3xl" : "text-3xl xl:text-4xl"}`}
                style={accentStyle}
              >
                &
              </div>
              <h1
                className={`${previewDevice === "mobile" ? "text-lg sm:text-xl" : "text-2xl md:text-3xl xl:text-4xl"} font-bold tracking-wide transition-all duration-300`}
                style={headingStyle}
              >
                {templateData.brideName}
              </h1>
            </div>

            {/* Decorative Divider */}
            <div className="flex justify-center items-center space-x-2">
              <Star
                className="w-3 h-3 animate-spin"
                style={{ color: config.colors.accent, animationDuration: "3s" }}
              />
              <div
                className="w-8 h-0.5 transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
              <Sparkles
                className="w-3 h-3 animate-pulse"
                style={{ color: config.colors.accent }}
              />
              <div
                className="w-8 h-0.5 transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
              <Star
                className="w-3 h-3 animate-spin"
                style={{
                  color: config.colors.accent,
                  animationDuration: "3s",
                  animationDirection: "reverse",
                }}
              />
            </div>

            {/* Date and Time with real-time updates */}
            <div className="space-y-2">
              <div
                className={`${previewDevice === "mobile" ? "text-base sm:text-lg" : "text-lg xl:text-xl"} font-semibold transition-all duration-300`}
                style={{ color: config.colors.primary }}
              >
                {templateData.weddingDate}
              </div>
              <div
                className={`${previewDevice === "mobile" ? "text-sm sm:text-base" : "text-base xl:text-lg"} transition-all duration-300`}
                style={{ color: config.colors.secondary }}
              >
                {templateData.weddingTime}
              </div>
            </div>

            {/* Venue with real-time updates */}
            <div className="space-y-3">
              <div
                className="w-12 h-0.5 mx-auto transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
              <div
                className={`${previewDevice === "mobile" ? "text-base sm:text-lg" : "text-lg xl:text-xl"} font-medium transition-all duration-300`}
                style={{ color: config.colors.primary }}
              >
                {templateData.venue}
              </div>
              <div
                className={`${previewDevice === "mobile" ? "text-xs sm:text-sm" : "text-sm xl:text-base"} leading-relaxed transition-all duration-300`}
                style={{ color: config.colors.secondary }}
              >
                {templateData.address}
              </div>
            </div>

            {/* Message with real-time updates */}
            <div
              className={`${previewDevice === "mobile" ? "text-xs sm:text-sm px-2 sm:px-3" : "text-sm xl:text-base px-4 xl:px-6"} leading-relaxed italic transition-all duration-300`}
              style={{ color: config.colors.text }}
            >
              "{templateData.customMessage}"
            </div>

            {/* Footer Decoration */}
            <div className="flex justify-center items-center space-x-2 mt-6">
              <div
                className="w-16 h-0.5 transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
              <Heart
                className="w-4 h-4 animate-bounce"
                style={{ color: config.colors.accent }}
              />
              <div
                className="w-16 h-0.5 transition-all duration-300"
                style={{ backgroundColor: config.colors.accent }}
              />
            </div>

            {/* Real-time indicator */}
            <div className="flex justify-center items-center mt-4 opacity-50">
              <Zap className="w-3 h-3 text-green-500 animate-pulse mr-1" />
              <span className="text-xs" style={{ color: config.colors.text }}>
                Real-time
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen hero-gradient">
        {/* Beautiful Header */}
        <nav className="bg-background/90 backdrop-blur-md border-b border-border p-4 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-muted transition-colors"
              >
                <Link to="/templates">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Shablonlar
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold text-foreground">
                    Shablon Yaratuvchi
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Real-time oldindan ko'rish
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                className="hover:bg-muted"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Qayta tiklash
              </Button>
              <Button
                onClick={saveTemplate}
                disabled={loading}
                className="primary-gradient hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Saqlash
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50/80 shadow-sm">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50/80 shadow-sm">
              <X className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-5 xl:col-span-4 order-2 lg:order-1">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-card/80 p-1.5 lg:p-2 shadow-sm border border-border">
                  <TabsTrigger
                    value="info"
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3"
                  >
                    <Settings className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden sm:inline">Ma'lumot</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="colors"
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3"
                  >
                    <Palette className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden sm:inline">Ranglar</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="fonts"
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3"
                  >
                    <Type className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">Shriftlar</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3"
                  >
                    <Layout className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">Layout</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="effects"
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3"
                  >
                    <Layers className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">Effektlar</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4 lg:mt-6">
                  <div className="card-modern p-4 lg:p-5 shadow-sm">
                    <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Shablon Ma'lumotlari
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="templateName"
                          className="text-sm font-medium"
                        >
                          Shablon Nomi
                        </Label>
                        <Input
                          id="templateName"
                          value={templateData.templateName}
                          onChange={(e) =>
                            handleTemplateDataChange(
                              "templateName",
                              e.target.value,
                            )
                          }
                          placeholder="Mening ajoyib shablonim"
                          className="mt-1 border-border focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="groomName"
                            className="text-sm font-medium"
                          >
                            Kuyov Ismi
                          </Label>
                          <Input
                            id="groomName"
                            value={templateData.groomName}
                            onChange={(e) =>
                              handleTemplateDataChange(
                                "groomName",
                                e.target.value,
                              )
                            }
                            className="mt-1 border-border focus:border-primary"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="brideName"
                            className="text-sm font-medium"
                          >
                            Kelin Ismi
                          </Label>
                          <Input
                            id="brideName"
                            value={templateData.brideName}
                            onChange={(e) =>
                              handleTemplateDataChange(
                                "brideName",
                                e.target.value,
                              )
                            }
                            className="mt-1 border-border focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="weddingDate"
                            className="text-sm font-medium"
                          >
                            To'y Sanasi
                          </Label>
                          <Input
                            id="weddingDate"
                            value={templateData.weddingDate}
                            onChange={(e) =>
                              handleTemplateDataChange(
                                "weddingDate",
                                e.target.value,
                              )
                            }
                            className="mt-1 border-border focus:border-primary"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="weddingTime"
                            className="text-sm font-medium"
                          >
                            Vaqt
                          </Label>
                          <Input
                            id="weddingTime"
                            value={templateData.weddingTime}
                            onChange={(e) =>
                              handleTemplateDataChange(
                                "weddingTime",
                                e.target.value,
                              )
                            }
                            className="mt-1 border-border focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="venue" className="text-sm font-medium">
                          Joy
                        </Label>
                        <Input
                          id="venue"
                          value={templateData.venue}
                          onChange={(e) =>
                            handleTemplateDataChange("venue", e.target.value)
                          }
                          className="mt-1 border-border focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="address"
                          className="text-sm font-medium"
                        >
                          Manzil
                        </Label>
                        <Input
                          id="address"
                          value={templateData.address}
                          onChange={(e) =>
                            handleTemplateDataChange("address", e.target.value)
                          }
                          className="mt-1 border-border focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="customMessage"
                          className="text-sm font-medium"
                        >
                          Maxsus Xabar
                        </Label>
                        <Textarea
                          id="customMessage"
                          value={templateData.customMessage}
                          onChange={(e) =>
                            handleTemplateDataChange(
                              "customMessage",
                              e.target.value,
                            )
                          }
                          className="mt-1 border-border focus:border-primary"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6 mt-4 lg:mt-6">
                  <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 border border-border shadow-sm">
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      Rang Shablonlari
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {colorPresets.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => applyColorPreset(preset)}
                          className="p-4 border border-border rounded-lg hover:border-primary transition-all hover:shadow-md group"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{preset.emoji}</span>
                            <div className="flex gap-1">
                              <div
                                className="w-4 h-4 rounded-full border border-white shadow-sm group-hover:scale-110 transition-transform"
                                style={{
                                  backgroundColor: preset.colors.primary,
                                }}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-white shadow-sm group-hover:scale-110 transition-transform"
                                style={{
                                  backgroundColor: preset.colors.secondary,
                                }}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-white shadow-sm group-hover:scale-110 transition-transform"
                                style={{
                                  backgroundColor: preset.colors.accent,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-xs font-medium text-foreground text-left">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium text-foreground">
                        Maxsus Ranglar
                      </h4>
                      {Object.entries(config.colors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <Label className="text-sm font-medium capitalize min-w-[80px]">
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
                          <Input
                            type="color"
                            value={value}
                            onChange={(e) =>
                              handleColorChange(
                                key as keyof TemplateConfig["colors"],
                                e.target.value,
                              )
                            }
                            className="w-12 h-10 p-1 border border-border rounded-lg cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handleColorChange(
                                key as keyof TemplateConfig["colors"],
                                e.target.value,
                              )
                            }
                            className="flex-1 border-border focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fonts" className="space-y-6 mt-4 lg:mt-6">
                  <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 border border-border shadow-sm">
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" />
                      Shrift Sozlamalari
                    </h3>
                    {Object.entries(config.fonts).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-sm font-medium capitalize">
                          {key === "heading"
                            ? "Sarlavha Shrifti"
                            : key === "body"
                              ? "Asosiy Shrift"
                              : "Dekorativ Shrift"}
                        </Label>
                        <Select
                          value={value}
                          onValueChange={(val) =>
                            handleFontChange(
                              key as keyof TemplateConfig["fonts"],
                              val,
                            )
                          }
                        >
                          <SelectTrigger className="border-border focus:border-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem
                                key={font.value}
                                value={font.value}
                                style={{ fontFamily: font.value }}
                              >
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="space-y-6 mt-4 lg:mt-6">
                  <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 border border-border shadow-sm">
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Layout className="w-5 h-5 text-primary" />
                      Layout Sozlamalari
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Layout Uslubi
                        </Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {layoutStyles.map((style) => (
                            <button
                              key={style.value}
                              onClick={() =>
                                handleLayoutChange("style", style.value)
                              }
                              className={`p-3 border rounded-lg text-left transition-all ${
                                config.layout.style === style.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-rose-25"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{style.icon}</span>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {style.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {style.description}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Ichki bo'shliq: {config.layout.spacing}px
                          </Label>
                          <Slider
                            value={[config.layout.spacing]}
                            onValueChange={(value) =>
                              handleLayoutChange("spacing", value[0])
                            }
                            max={50}
                            min={10}
                            step={2}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Padding: {config.layout.padding}px
                          </Label>
                          <Slider
                            value={[config.layout.padding]}
                            onValueChange={(value) =>
                              handleLayoutChange("padding", value[0])
                            }
                            max={60}
                            min={16}
                            step={4}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Burchak radiusi: {config.layout.borderRadius}px
                          </Label>
                          <Slider
                            value={[config.layout.borderRadius]}
                            onValueChange={(value) =>
                              handleLayoutChange("borderRadius", value[0])
                            }
                            max={30}
                            min={0}
                            step={2}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Soya kuchi: {config.layout.shadowIntensity}
                          </Label>
                          <Slider
                            value={[config.layout.shadowIntensity]}
                            onValueChange={(value) =>
                              handleLayoutChange("shadowIntensity", value[0])
                            }
                            max={20}
                            min={0}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="effects" className="space-y-6 mt-4 lg:mt-6">
                  <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 border border-border shadow-sm">
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      Animatsiya va Effektlar
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Animatsiyani yoqish
                        </Label>
                        <Switch
                          checked={config.animations.enabled}
                          onCheckedChange={(checked) =>
                            handleAnimationChange("enabled", checked)
                          }
                        />
                      </div>

                      {config.animations.enabled && (
                        <>
                          <div>
                            <Label className="text-sm font-medium">
                              Animatsiya turi
                            </Label>
                            <Select
                              value={config.animations.type}
                              onValueChange={(val) =>
                                handleAnimationChange("type", val)
                              }
                            >
                              <SelectTrigger className="mt-2 border-border focus:border-primary">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {animationTypes.map((anim) => (
                                  <SelectItem
                                    key={anim.value}
                                    value={anim.value}
                                  >
                                    {anim.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">
                              Animatsiya davomiyligi:{" "}
                              {config.animations.duration}s
                            </Label>
                            <Slider
                              value={[config.animations.duration]}
                              onValueChange={(value) =>
                                handleAnimationChange("duration", value[0])
                              }
                              max={2}
                              min={0.1}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="lg:col-span-7 xl:col-span-8 order-1 lg:order-2">
              <div className="lg:sticky lg:top-24">
                <div className="bg-card/90 backdrop-blur-sm rounded-xl p-6 lg:p-8 border border-border shadow-lg">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-heading text-lg xl:text-xl font-semibold text-foreground flex items-center gap-3">
                      <Eye className="w-5 h-5 xl:w-6 xl:h-6 text-primary" />
                      Jonli Oldindan Ko'rish
                    </h2>
                    <div className="flex items-center gap-3">
                      <Button
                        variant={
                          previewDevice === "desktop" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setPreviewDevice("desktop")}
                        className="h-9 w-9 lg:h-10 lg:w-10 p-0"
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={
                          previewDevice === "mobile" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setPreviewDevice("mobile")}
                        className="h-9 w-9 lg:h-10 lg:w-10 p-0"
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4 md:p-6 bg-gradient-to-br from-muted/30 to-card min-h-[250px] md:min-h-[280px] lg:min-h-[300px] xl:min-h-[320px] flex items-center justify-center">
                    <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                      <TemplatePreview />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-muted border-border text-xs lg:text-sm lg:py-2"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Yuklab olish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-muted border-border text-xs lg:text-sm lg:py-2"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Ulashish
                    </Button>
                  </div>

                  <div className="text-center mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3 text-green-500 animate-pulse" />
                    Real vaqtda yangilanadi •{" "}
                    {previewDevice === "desktop" ? "Kompyuter" : "Mobil"}{" "}
                    ko'rinish
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
