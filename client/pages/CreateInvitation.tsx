import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  MapPin,
  Clock,
  Upload,
  Users,
  Plus,
  X,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, invitationOperations } from "@/lib/supabase";
import cacheUtils from "@/lib/cache";
import { generateDemoUUID, generateUUIDFromSlug } from "@/lib/utils";
import {
  templateManager,
  defaultWeddingTemplates,
  templateCategories,
  getTemplatesByCategory,
  type DefaultTemplate,
} from "@/lib/defaultTemplates";
import TemplateRenderer from "@/components/TemplateRenderer";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Template interface endi templates.tsx dan import qilinadi

export default function CreateInvitation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "" });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredTemplates, setFilteredTemplates] = useState<DefaultTemplate[]>(
    defaultWeddingTemplates,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Templates loaded
  useEffect(() => {
    // Templates sahifasidan kelgan template selection ni qabul qilish
    if (location.state?.selectedTemplate) {
      setFormData((prev) => ({
        ...prev,
        selectedTemplate: location.state.selectedTemplate,
      }));
      setCurrentStep(3); // Template selection step ga o'tish
    }
  }, [location.state]);
  const [previewTemplate, setPreviewTemplate] =
    useState<DefaultTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    groomName: "",
    brideName: "",
    weddingDate: "",
    weddingTime: "",
    venue: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    customMessage: "",
    selectedTemplate: "classic-rose",
    uploadedImage: null as File | null,
    rsvpDeadline: "",
  });

  // Template kategoriya filter
  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    try {
      if (categoryId === "all") {
        const templates = await templateManager.getAllTemplates();
        setFilteredTemplates(templates);
      } else {
        const filtered =
          await templateManager.getTemplatesByCategory(categoryId);
        setFilteredTemplates(filtered);
      }
    } catch (error) {
      console.warn("Template filterlashda xatolik:", error);
      // Fallback to default templates
      if (categoryId === "all") {
        setFilteredTemplates(defaultWeddingTemplates);
      } else {
        const filtered = defaultWeddingTemplates.filter(
          (t) => t.category === categoryId,
        );
        setFilteredTemplates(filtered);
      }
    }
  };

  // Template preview
  const handlePreviewTemplate = (template: DefaultTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  // Mock invitation data for preview
  const getMockInvitationData = () => ({
    id: "preview",
    groom_name: formData.groomName || "Jahongir",
    bride_name: formData.brideName || "Sarvinoz",
    wedding_date: formData.weddingDate || "2024-06-15",
    wedding_time: formData.weddingTime || "16:00",
    venue: formData.venue || "Atirgul Bog'i",
    address:
      formData.address || "Toshkent sh., Yunusobod t., Bog' ko'chasi 123",
    city: formData.city || "Toshkent",
    custom_message:
      formData.customMessage ||
      "Bizning sevgi va baxt to'la kunimizni birga nishonlash uchun sizni taklif qilamiz.",
    template_id: previewTemplate?.id || "classic-rose",
  });

  const addGuest = () => {
    if (newGuest.name.trim()) {
      const guest: Guest = {
        id: Date.now().toString(),
        ...newGuest,
      };
      setGuests([...guests, guest]);
      setNewGuest({ name: "", email: "", phone: "" });
    }
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter((guest) => guest.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, uploadedImage: file });
    }
  };

  const generateSlug = () => {
    const names = `${formData.groomName}-${formData.brideName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${names}-${randomId}`;
  };

  const generateDemoInvitationId = () => {
    // Agar ism-familiyalar kiritilgan bo'lsa, ulardan UUID yaratamiz
    if (formData.groomName && formData.brideName) {
      const slug = generateSlug();
      return generateUUIDFromSlug(slug);
    }
    // Aks holda oddiy demo UUID
    return generateDemoUUID();
  };

  const handleSave = async () => {
    console.log("🚀 Starting optimized invitation creation...");

    if (!user) {
      setError("Taklifnoma yaratish uchun tizimga kirishingiz kerak");
      return;
    }

    if (
      !formData.groomName ||
      !formData.brideName ||
      !formData.weddingDate ||
      !formData.venue ||
      !formData.address
    ) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    setIsLoading(true);
    setError("");
    console.log("📋 Starting high-performance invitation creation...");
    console.log("👤 User authenticated:", !!user, "User ID:", user?.id);

    try {
      const slug = generateSlug();
      console.log("🔗 Generated slug:", slug);

      const invitationData = {
        user_id: user.id,
        groom_name: formData.groomName.trim(),
        bride_name: formData.brideName.trim(),
        wedding_date: formData.weddingDate,
        wedding_time: formData.weddingTime || null,
        venue: formData.venue.trim(),
        address: formData.address.trim(),
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip_code: formData.zipCode?.trim() || null,
        custom_message: formData.customMessage?.trim() || null,
        template_id: formData.selectedTemplate || "classic-rose",
        rsvp_deadline: formData.rsvpDeadline || null,
        slug: slug,
        is_active: true,
        metadata: {
          created_with: "CreateInvitation v2.0",
          performance_optimized: true,
        },
      };

      console.log("📋 Invitation data prepared:", invitationData);

      // Use optimized invitation operations with automatic caching and fallback
      const { data: invitation, error } =
        await invitationOperations.create(invitationData);

      if (error) {
        console.error("❌ Invitation creation error:", error);
        throw new Error(
          error.message || "Taklifnoma yaratishda xatolik yuz berdi",
        );
      }

      console.log("✅ Invitation created successfully:", invitation);

      // Add guests with optimized handling
      if (guests.length > 0 && invitation?.id) {
        console.log("👥 Adding guests...");
        try {
          const guestData = guests.map((guest) => ({
            invitation_id: invitation.id,
            name: guest.name.trim(),
            email: guest.email?.trim() || null,
            phone: guest.phone?.trim() || null,
            plus_one: false,
            metadata: {
              added_with: "CreateInvitation v2.0",
            },
          }));

          const { error: guestError } = await supabase
            .from("guests")
            .insert(guestData);

          if (guestError) {
            console.warn(
              "⚠️ Guest insertion failed, saving to localStorage:",
              guestError,
            );
            // Save guests locally as backup
            localStorage.setItem(
              `guests_${invitation.id}`,
              JSON.stringify(guests),
            );
          } else {
            console.log("✅ Guests added successfully");
          }
        } catch (guestErr) {
          console.warn("⚠️ Guest handling error:", guestErr);
          localStorage.setItem(
            `guests_${invitation.id}`,
            JSON.stringify(guests),
          );
        }
      }

      // Clear any cached drafts
      cacheUtils.invalidateUser(user.id);

      console.log("🎯 Navigating to invitation:", invitation.id);
      setSuccess(true);

      // Navigate with optimized delay
      setTimeout(() => {
        navigate(`/invitation/${invitation.id}`);
      }, 1000);
    } catch (err: any) {
      console.error("❌ Invitation creation failed:", err?.message || err);
      setError(
        err?.message ||
          "Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      );
    } finally {
      // Ensure loading state is always reset
      if (!success) {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }
  };

  const handlePreview = () => {
    // Oldindan ko'rish uchun yangi tab ochish
    window.open(`/invitation/preview`, "_blank");
  };

  const steps = [
    { id: 1, title: "Asosiy Ma'lumotlar", description: "Er-xotin va sana" },
    { id: 2, title: "Joy va Manzil", description: "Qayerda va qachon" },
    { id: 3, title: "Dizayn va Xabar", description: "Shaxsiylashtirish" },
    { id: 4, title: "Mehmonlar Ro'yxati", description: "Kim taklif qilinadi" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard ga qaytish
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">
                TaklifNoma
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Oldindan Ko'rish
            </Button>
            <Button
              className="button-modern"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Saqlash va Havola Yaratish
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
            Taklifnomangizni Yarating
          </h1>
          <p className="text-muted-foreground">
            Maxsus kuningizni mukammal aks ettiruvchi chiroyli taklifnoma dizayn
            qiling
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step.id
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 h-0.5 mx-4 transition-colors ${
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError("");
                  setIsLoading(false);
                }}
                className="ml-4"
              >
                Qayta urinish
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Taklifnoma muvaffaqiyatli yaratildi!
            </AlertDescription>
          </Alert>
        )}

        <div className="card-modern p-8">
          {/* Step 1: Asosiy Ma'lumotlar */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Baxtli juftlik haqida
                </h2>
                <p className="text-muted-foreground mb-6">
                  Eng muhim ma'lumotlar bilan boshlaylik
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="groomName"
                    className="text-foreground font-medium"
                  >
                    Kuyovning To'liq Ismi
                  </Label>
                  <Input
                    id="groomName"
                    type="text"
                    placeholder="Kuyov ismini kiriting"
                    className="input-modern h-12"
                    value={formData.groomName}
                    onChange={(e) =>
                      setFormData({ ...formData, groomName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="brideName"
                    className="text-foreground font-medium"
                  >
                    Kelinning To'liq Ismi
                  </Label>
                  <Input
                    id="brideName"
                    type="text"
                    placeholder="Kelin ismini kiriting"
                    className="input-modern h-12"
                    value={formData.brideName}
                    onChange={(e) =>
                      setFormData({ ...formData, brideName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="weddingDate"
                    className="text-foreground font-medium"
                  >
                    To'y Sanasi
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="weddingDate"
                      type="date"
                      className="input-modern pl-11 h-12"
                      value={formData.weddingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weddingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="weddingTime"
                    className="text-foreground font-medium"
                  >
                    To'y Vaqti
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="weddingTime"
                      type="time"
                      className="input-modern pl-11 h-12"
                      value={formData.weddingTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weddingTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="rsvpDeadline"
                  className="text-foreground font-medium"
                >
                  Javob Berish Muddati
                </Label>
                <Input
                  id="rsvpDeadline"
                  type="date"
                  className="input-modern h-12"
                  value={formData.rsvpDeadline}
                  onChange={(e) =>
                    setFormData({ ...formData, rsvpDeadline: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 2: Joy va Manzil */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Sehr qayerda sodir bo'ladi?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Mehmonlaringizga joy haqida ma'lumot bering
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className="text-foreground font-medium">
                  Joy Nomi
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="venue"
                    type="text"
                    placeholder="Atirgul Bog'i"
                    className="input-modern pl-11 h-12"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-foreground font-medium"
                >
                  Ko'cha Manzili
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Bog' ko'chasi 123"
                  className="input-modern h-12"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground font-medium">
                    Shahar
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Toshkent"
                    className="input-modern h-12"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="state"
                    className="text-foreground font-medium"
                  >
                    Viloyat
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="Toshkent viloyati"
                    className="input-modern h-12"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="zipCode"
                    className="text-foreground font-medium"
                  >
                    Pochta Indeksi
                  </Label>
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="100000"
                    className="input-modern h-12"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Google xarita avtomatik ravishda taklifnomangizga qo'shiladi.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Dizayn va Xabar */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Shaxsiy qiling
                </h2>
                <p className="text-muted-foreground mb-6">
                  Dizayn tanlang va shaxsiy ta'sir qo'shing
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-foreground font-medium mb-4 block">
                    Shablon Kategoriyasi
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {templateCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategory === category.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleCategoryChange(category.id)}
                        className="text-xs"
                      >
                        <Filter className="w-3 h-3 mr-1" />
                        {category.name} ({category.count})
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-foreground font-medium mb-4 block">
                    Shablon Tanlang ({filteredTemplates.length} ta mavjud)
                  </Label>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                          formData.selectedTemplate === template.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            selectedTemplate: template.id,
                          })
                        }
                      >
                        <div className="text-center space-y-3">
                          <div
                            className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-colors"
                            style={{
                              backgroundColor: template.colors.background,
                              border: `2px solid ${template.colors.primary}`,
                            }}
                          >
                            <span className="text-2xl">{template.preview}</span>
                          </div>

                          <div>
                            <h3 className="font-heading text-base font-semibold text-foreground mb-1">
                              {template.name}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {template.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-2 pt-2">
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: template.colors.primary,
                              }}
                            ></div>
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: template.colors.accent,
                              }}
                            ></div>
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: template.colors.secondary,
                              }}
                            ></div>
                          </div>

                          {formData.selectedTemplate === template.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}

                          {/* Preview button */}
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewTemplate(template);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ko'rish
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="customMessage"
                  className="text-foreground font-medium"
                >
                  Shaxsiy Xabar
                </Label>
                <Textarea
                  id="customMessage"
                  placeholder="Bizning sevgi va baxt to'la kunimizni birga nishonlash uchun sizni taklif qilamiz."
                  className="input-modern min-h-32"
                  value={formData.customMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, customMessage: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Bu xabar taklifnomangizda ko'rsatiladi
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">
                  Rasm Yuklash (Ixtiyoriy)
                </Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Rasm yuklash uchun bosing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG 10MB gacha
                    </p>
                  </label>
                  {formData.uploadedImage && (
                    <p className="text-sm text-primary mt-2">
                      ✓ {formData.uploadedImage.name} yuklandi
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Mehmonlar Ro'yxati */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Kim taklif qilinadi?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Shaxsiy taklifnomalar yuborish uchun mehmonlaringizni qo'shing
                </p>
              </div>

              <div className="bg-primary/5 p-6 rounded-xl">
                <h3 className="font-medium text-foreground mb-4">
                  Yangi Mehmon Qo'shish
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Mehmon ismi"
                      value={newGuest.name}
                      onChange={(e) =>
                        setNewGuest({ ...newGuest, name: e.target.value })
                      }
                      className="input-modern h-10"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Email (ixtiyoriy)"
                      type="email"
                      value={newGuest.email}
                      onChange={(e) =>
                        setNewGuest({ ...newGuest, email: e.target.value })
                      }
                      className="input-modern h-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Telefon (ixtiyoriy)"
                      type="tel"
                      value={newGuest.phone}
                      onChange={(e) =>
                        setNewGuest({ ...newGuest, phone: e.target.value })
                      }
                      className="input-modern h-10"
                    />
                    <Button
                      onClick={addGuest}
                      size="sm"
                      className="button-modern"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {guests.length > 0 && (
                <div>
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Mehmonlar Ro'yxati ({guests.length} mehmon)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {guests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {guest.name}
                          </p>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {guest.email && <span>{guest.email}</span>}
                            {guest.phone && <span>{guest.phone}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGuest(guest.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                  <p>Hali mehmonlar qo'shilmagan</p>
                  <p className="text-sm">
                    Shaxsiy taklifnomalar yaratish uchun yuqorida mehmon
                    qo'shing
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="border-border"
            >
              Orqaga
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="button-modern"
              >
                Keyingi Qadam
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="button-modern"
              >
                {isLoading ? "Saqlanmoqda..." : "Taklifnoma Yaratish"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-card rounded-2xl shadow-2xl border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {previewTemplate.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          selectedTemplate: previewTemplate.id,
                        });
                        setShowPreview(false);
                      }}
                    >
                      Bu Shablonni Tanlash
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPreview(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <TemplateRenderer
                  invitation={getMockInvitationData()}
                  guestName="Hurmatli Mehmon"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
