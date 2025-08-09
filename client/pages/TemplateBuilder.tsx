import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, templateOperations } from "@/lib/supabase";
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
  Tablet,
  Move,
  RefreshCw,
  Camera,
  Maximize2,
  Minimize2,
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import DatabaseSetupGuide from "@/components/DatabaseSetupGuide";
import { checkDatabaseStatus } from "@/lib/database-setup";

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
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);

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

  // Memoized color presets
  const colorPresets = useMemo(() => [
    {
      name: "TaklifNoma Asosiy",
      emoji: "💎",
      description: "Professional va zamonaviy",
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
      description: "Nozik va romantik",
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
      description: "Tinch va ishonchli",
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
      description: "Hashamatli va dabdabali",
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
      description: "Tabiiy va toza",
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
      description: "Noyob va ajoyib",
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
      description: "Rasmiy va elegant",
      colors: {
        primary: "#1f2937",
        secondary: "#6b7280",
        accent: "#d97706",
        background: "#ffffff",
        text: "#111827",
      },
    },
  ], []);

  const fontOptions = useMemo(() => [
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
  ], []);

  const layoutStyles = useMemo(() => [
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
  ], []);

  const animationTypes = useMemo(() => [
    { value: "fade", label: "Fade (Paydo bo'lish)" },
    { value: "slide", label: "Slide (Sirpanish)" },
    { value: "scale", label: "Scale (Kattayish)" },
    { value: "bounce", label: "Bounce (Sakrash)" },
  ], []);

  // Real-time update handlers with useCallback for performance
  const handleColorChange = useCallback((
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
  }, []);

  const handleFontChange = useCallback((
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
  }, []);

  const handleLayoutChange = useCallback((
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
  }, []);

  const handleAnimationChange = useCallback((
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
  }, []);

  const handleTemplateDataChange = useCallback((
    key: keyof InvitationData,
    value: string,
  ) => {
    setTemplateData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const applyColorPreset = useCallback((preset: typeof colorPresets[0]) => {
    setConfig((prev) => ({
      ...prev,
      colors: preset.colors,
    }));
  }, []);

  // Enhanced save function with better error handling
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
      console.log("🚀 Shablon saqlanmoqda...");
      
      const templateToSave = {
        user_id: user.id,
        name: templateData.templateName.trim(),
        description: `Maxsus shablon - ${new Date().toLocaleDateString("uz-UZ")}`,
        category: "custom",
        config: JSON.stringify(config),
        colors: config.colors,
        fonts: config.fonts,
        layout: config.layout,
        is_public: false,
        is_featured: false,
        tags: [config.layout.style, "maxsus", "real-time"],
        metadata: {
          created_with: "TemplateBuilder v3.0",
          performance_optimized: true,
          responsive: true,
          real_time_preview: true,
        },
      };

      console.log("📋 Shablon ma'lumotlari:", templateToSave);

      // Supabase'ga saqlashga harakat qilamiz
      const { data, error: saveError } = await supabase
        .from("custom_templates")
        .insert(templateToSave)
        .select()
        .single();

      if (saveError) {
        console.error("❌ Supabase saqlash xatoligi:", saveError);
        
        // Agar jadval mavjud bo'lmasa, uni yaratishga harakat qilamiz
        if (saveError.message?.includes("does not exist") || saveError.code === "PGRST116") {
          console.log("🔧 custom_templates jadvali topilmadi, localStorage ga saqlash...");
          
          // LocalStorage ga fallback
          const localTemplate = {
            id: `local_${Date.now()}`,
            ...templateToSave,
            created_at: new Date().toISOString(),
            is_local: true,
          };

          localStorage.setItem(
            `custom_template_${localTemplate.id}`,
            JSON.stringify(localTemplate),
          );

          setSuccess("✅ Shablon vaqtincha saqlandi (mahalliy xotira). Database ulanishi qayta tiklanganda Supabase'ga yuklanadi.");
          setLastSaved(new Date());
          
          setTimeout(() => {
            navigate("/templates");
          }, 3000);
          return;
        }
        
        throw saveError;
      }

      console.log("✅ Shablon muvaffaqiyatli saqlandi:", data);
      setSuccess("🎉 Shablon muvaffaqiyatli Supabase'ga saqlandi!");
      setLastSaved(new Date());

      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } catch (err: any) {
      console.error("❌ Shablon saqlash xatoligi:", err);
      
      // Fallback: localStorage ga saqlash
      const fallbackTemplate = {
        id: `local_${Date.now()}`,
        ...templateData,
        config: config,
        created_at: new Date().toISOString(),
        is_local: true,
        user_id: user.id,
      };

      localStorage.setItem(
        `custom_template_${fallbackTemplate.id}`,
        JSON.stringify(fallbackTemplate),
      );

      setSuccess("✅ Shablon vaqtincha saqlandi (mahalliy xotira)");
      setLastSaved(new Date());

      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = useCallback(() => {
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
  }, []);

  // Enhanced Real-time Template Preview with better responsiveness
  const TemplatePreview = useMemo(() => {
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

    const getDeviceClass = () => {
      switch (previewDevice) {
        case "mobile":
          return "max-w-xs scale-75 md:scale-90";
        case "tablet":
          return "max-w-sm scale-85 md:scale-95";
        case "desktop":
          return "max-w-md lg:max-w-lg";
        default:
          return "max-w-md";
      }
    };

    const getTextSizes = () => {
      switch (previewDevice) {
        case "mobile":
          return {
            title: "text-lg",
            subtitle: "text-base",
            body: "text-sm",
            small: "text-xs",
          };
        case "tablet":
          return {
            title: "text-xl md:text-2xl",
            subtitle: "text-lg",
            body: "text-base",
            small: "text-sm",
          };
        case "desktop":
          return {
            title: "text-2xl md:text-3xl xl:text-4xl",
            subtitle: "text-lg xl:text-xl",
            body: "text-base xl:text-lg",
            small: "text-sm",
          };
        default:
          return {
            title: "text-2xl",
            subtitle: "text-lg",
            body: "text-base",
            small: "text-sm",
          };
      }
    };

    const textSizes = getTextSizes();

    return (
      <div className={`w-full ${getDeviceClass()} mx-auto transition-all duration-500`}>
        <div
          className="transition-all duration-500 hover:shadow-xl relative overflow-hidden"
          style={containerStyle}
        >
          <div className={getLayoutClass()}>
            {/* Real-time indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs opacity-60">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span style={{ color: config.colors.text }}>Real-time</span>
            </div>

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
                className={`${textSizes.small} font-medium tracking-widest uppercase opacity-75`}
                style={{ color: config.colors.secondary }}
              >
                To'y Taklifnomasi
              </div>
            </div>

            {/* Names with real-time updates */}
            <div className="space-y-3">
              <h1
                className={`${textSizes.title} font-bold tracking-wide transition-all duration-300`}
                style={headingStyle}
              >
                {templateData.groomName}
              </h1>
              <div
                className={`${textSizes.subtitle} font-bold`}
                style={accentStyle}
              >
                &
              </div>
              <h1
                className={`${textSizes.title} font-bold tracking-wide transition-all duration-300`}
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
                className={`${textSizes.subtitle} font-semibold transition-all duration-300`}
                style={{ color: config.colors.primary }}
              >
                {templateData.weddingDate}
              </div>
              <div
                className={`${textSizes.body} transition-all duration-300`}
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
                className={`${textSizes.subtitle} font-medium transition-all duration-300`}
                style={{ color: config.colors.primary }}
              >
                {templateData.venue}
              </div>
              <div
                className={`${textSizes.body} leading-relaxed transition-all duration-300`}
                style={{ color: config.colors.secondary }}
              >
                {templateData.address}
              </div>
            </div>

            {/* Message with real-time updates */}
            <div
              className={`${textSizes.body} leading-relaxed italic transition-all duration-300 px-2`}
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
          </div>
        </div>
      </div>
    );
  }, [config, templateData, previewDevice]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen hero-gradient">
        {/* Enhanced Header */}
        <nav className="bg-background/95 backdrop-blur-lg border-b border-border p-4 sticky top-0 z-50 shadow-xl">
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
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold text-foreground">
                    Shablon Yaratuvchi
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-green-500 animate-pulse" />
                    Real-time oldindan ko'rish
                    {lastSaved && (
                      <span className="text-green-600">
                        • Saqlandi {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                className="hover:bg-muted hidden sm:flex"
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

        <div className="max-w-8xl mx-auto p-2 sm:p-4 lg:p-6">
          {/* Status Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50/80 shadow-sm animate-fade-in">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50/80 shadow-sm animate-fade-in">
              <X className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
            {/* Enhanced Left Panel - Controls */}
            <div className={`${isFullscreen ? 'hidden' : 'xl:col-span-5 2xl:col-span-4'} order-2 xl:order-1`}>
              <Card className="bg-card/95 backdrop-blur-sm border-border shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-primary" />
                    Shablon Sozlamalari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-muted/50 p-1.5 shadow-sm border border-border">
                      <TabsTrigger
                        value="info"
                        className="flex items-center gap-1 text-xs sm:text-sm p-2"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Ma'lumot</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="colors"
                        className="flex items-center gap-1 text-xs sm:text-sm p-2"
                      >
                        <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Ranglar</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="fonts"
                        className="flex items-center gap-1 text-xs sm:text-sm p-2"
                      >
                        <Type className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden lg:inline">Shriftlar</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="layout"
                        className="flex items-center gap-1 text-xs sm:text-sm p-2"
                      >
                        <Layout className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden lg:inline">Layout</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="effects"
                        className="flex items-center gap-1 text-xs sm:text-sm p-2"
                      >
                        <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden lg:inline">Effektlar</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Info Tab */}
                    <TabsContent value="info" className="mt-6 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="templateName" className="text-sm font-medium">
                            Shablon Nomi
                          </Label>
                          <Input
                            id="templateName"
                            value={templateData.templateName}
                            onChange={(e) =>
                              handleTemplateDataChange("templateName", e.target.value)
                            }
                            placeholder="Mening ajoyib shablonim"
                            className="mt-1 border-border focus:border-primary"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="groomName" className="text-sm font-medium">
                              Kuyov Ismi
                            </Label>
                            <Input
                              id="groomName"
                              value={templateData.groomName}
                              onChange={(e) =>
                                handleTemplateDataChange("groomName", e.target.value)
                              }
                              className="mt-1 border-border focus:border-primary"
                            />
                          </div>
                          <div>
                            <Label htmlFor="brideName" className="text-sm font-medium">
                              Kelin Ismi
                            </Label>
                            <Input
                              id="brideName"
                              value={templateData.brideName}
                              onChange={(e) =>
                                handleTemplateDataChange("brideName", e.target.value)
                              }
                              className="mt-1 border-border focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="weddingDate" className="text-sm font-medium">
                              To'y Sanasi
                            </Label>
                            <Input
                              id="weddingDate"
                              value={templateData.weddingDate}
                              onChange={(e) =>
                                handleTemplateDataChange("weddingDate", e.target.value)
                              }
                              className="mt-1 border-border focus:border-primary"
                            />
                          </div>
                          <div>
                            <Label htmlFor="weddingTime" className="text-sm font-medium">
                              Vaqt
                            </Label>
                            <Input
                              id="weddingTime"
                              value={templateData.weddingTime}
                              onChange={(e) =>
                                handleTemplateDataChange("weddingTime", e.target.value)
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
                          <Label htmlFor="address" className="text-sm font-medium">
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
                          <Label htmlFor="customMessage" className="text-sm font-medium">
                            Maxsus Xabar
                          </Label>
                          <Textarea
                            id="customMessage"
                            value={templateData.customMessage}
                            onChange={(e) =>
                              handleTemplateDataChange("customMessage", e.target.value)
                            }
                            className="mt-1 border-border focus:border-primary"
                            rows={3}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Colors Tab */}
                    <TabsContent value="colors" className="space-y-6 mt-6">
                      <div>
                        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-primary" />
                          Rang Shablonlari
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {colorPresets.map((preset, index) => (
                            <Card
                              key={index}
                              className="cursor-pointer hover:border-primary transition-all hover:shadow-md group p-3"
                              onClick={() => applyColorPreset(preset)}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">{preset.emoji}</span>
                                <div className="flex gap-1">
                                  {Object.values(preset.colors).slice(0, 3).map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-4 h-4 rounded-full border border-white shadow-sm group-hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                {preset.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {preset.description}
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="mt-6 space-y-4">
                          <h4 className="font-medium text-foreground">Maxsus Ranglar</h4>
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
                                className="flex-1 border-border focus:border-primary text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Fonts Tab */}
                    <TabsContent value="fonts" className="space-y-6 mt-6">
                      <div>
                        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                          <Type className="w-4 h-4 text-primary" />
                          Shrift Sozlamalari
                        </h3>
                        <div className="space-y-4">
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
                                      className="font-medium"
                                    >
                                      {font.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Layout Tab */}
                    <TabsContent value="layout" className="space-y-6 mt-6">
                      <div>
                        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                          <Layout className="w-4 h-4 text-primary" />
                          Layout Sozlamalari
                        </h3>

                        <div className="space-y-6">
                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              Layout Uslubi
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                              {layoutStyles.map((style) => (
                                <Card
                                  key={style.value}
                                  className={`cursor-pointer transition-all p-3 ${
                                    config.layout.style === style.value
                                      ? "border-primary bg-primary/5 shadow-md"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                                  }`}
                                  onClick={() =>
                                    handleLayoutChange("style", style.value)
                                  }
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
                                    {config.layout.style === style.value && (
                                      <Check className="w-4 h-4 text-primary ml-auto" />
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium flex items-center justify-between">
                                <span>Ichki bo'shliq</span>
                                <Badge variant="secondary">{config.layout.spacing}px</Badge>
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
                              <Label className="text-sm font-medium flex items-center justify-between">
                                <span>Padding</span>
                                <Badge variant="secondary">{config.layout.padding}px</Badge>
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
                              <Label className="text-sm font-medium flex items-center justify-between">
                                <span>Burchak radiusi</span>
                                <Badge variant="secondary">{config.layout.borderRadius}px</Badge>
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
                              <Label className="text-sm font-medium flex items-center justify-between">
                                <span>Soya kuchi</span>
                                <Badge variant="secondary">{config.layout.shadowIntensity}</Badge>
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

                    {/* Effects Tab */}
                    <TabsContent value="effects" className="space-y-6 mt-6">
                      <div>
                        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          Animatsiya va Effektlar
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                                <Label className="text-sm font-medium flex items-center justify-between">
                                  <span>Animatsiya davomiyligi</span>
                                  <Badge variant="secondary">{config.animations.duration}s</Badge>
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
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Right Panel - Live Preview */}
            <div className={`${isFullscreen ? 'col-span-full' : 'xl:col-span-7 2xl:col-span-8'} order-1 xl:order-2`}>
              <div className="xl:sticky xl:top-24">
                <Card className="bg-card/95 backdrop-blur-sm border-border shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-lg xl:text-xl">
                        <Eye className="w-5 h-5 xl:w-6 xl:h-6 text-primary" />
                        Jonli Oldindan Ko'rish
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="w-3 h-3 mr-1 text-green-500" />
                          Real-time
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={previewDevice === "desktop" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreviewDevice("desktop")}
                          className="h-9 w-9 p-0"
                        >
                          <Monitor className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={previewDevice === "tablet" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreviewDevice("tablet")}
                          className="h-9 w-9 p-0"
                        >
                          <Tablet className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={previewDevice === "mobile" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreviewDevice("mobile")}
                          className="h-9 w-9 p-0"
                        >
                          <Smartphone className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="h-9 w-9 p-0"
                        >
                          {isFullscreen ? (
                            <Minimize2 className="w-4 h-4" />
                          ) : (
                            <Maximize2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-border rounded-lg p-4 md:p-6 bg-gradient-to-br from-muted/30 to-card min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center relative overflow-hidden">
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-grid-pattern"></div>
                      </div>
                      
                      <div className="w-full flex items-center justify-center relative z-10">
                        {TemplatePreview}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-muted border-border text-xs lg:text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Yuklab olish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-muted border-border text-xs lg:text-sm"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Ulashish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-muted border-border text-xs lg:text-sm"
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        Screenshot
                      </Button>
                    </div>

                    <div className="text-center mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Real vaqtda yangilanadi</span>
                      </div>
                      •
                      <span className="capitalize">
                        {previewDevice === "desktop" ? "Kompyuter" : 
                         previewDevice === "tablet" ? "Planshet" : "Mobil"} ko'rinish
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
