import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TemplateRenderer from "@/components/TemplateRenderer";
import Navigation from "@/components/Navigation";
import {
  defaultWeddingTemplates,
  templateCategories,
  type DefaultTemplate,
} from "@/lib/defaultTemplates";

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [templates, setTemplates] = useState<DefaultTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DefaultTemplate[]>(
    [],
  );
  const [previewTemplate, setPreviewTemplate] =
    useState<DefaultTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("🔄 Shablonlarni yuklamoqda...");

      // Always use default templates for now
      console.log("✅ Default shablonlarni ishlatmoqda...");

      // Use default templates directly
      setTemplates(defaultWeddingTemplates);
      setFilteredTemplates(defaultWeddingTemplates);

      console.log(
        "✅ Shablonlar muvaffaqiyatli yuklandi:",
        defaultWeddingTemplates.length,
      );
    } catch (err) {
      console.error("❌ Shablonlarni yuklashda xatolik:", err);
      setError("Shablonlarni yuklashda xatolik yuz berdi");

      // Fallback to default templates
      setTemplates(defaultWeddingTemplates);
      setFilteredTemplates(defaultWeddingTemplates);
    } finally {
      setLoading(false);
    }
  };

  // Template kategoriya filter
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);

    if (categoryId === "all") {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter((t) => t.category === categoryId);
      setFilteredTemplates(filtered);
    }
  };

  // Template preview
  const handlePreviewTemplate = (template: DefaultTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  // Mock invitation data for preview
  const getMockInvitationData = (template: DefaultTemplate) => ({
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
    template_id: template.id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation showBackButton />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Shablonlar yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navigation showBackButton className="animate-slide-up" />

      <div className="max-w-6xl mx-auto p-6"></div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Taklifnoma Shablonlari
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            15+ professional shablon har qanday uslub uchun. Klassik, zamonaviy,
            hashamatli va rustic dizaynlar orasidan tanlang.
          </p>

          {/* Statistics */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            {[
              { number: "15+", label: "Professional Shablonlar" },
              { number: "10K+", label: "Yaratilgan Taklifnomalar" },
              { number: "6", label: "Turli Kategoriyalar" },
              { number: "100%", label: "Mobil Mos" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 animate-slide-up delay-300">
          <div className="flex flex-wrap justify-center gap-3">
            {templateCategories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => handleCategoryChange(category.id)}
                className="font-medium"
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up delay-500">
          {filteredTemplates.map((template, index) => (
            <div
              key={template.id}
              className="group card-modern p-6 hover:shadow-lg transition-all duration-300 hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 0.1 + 0.6}s` }}
            >
              {/* Template Preview */}
              <div
                className="aspect-[3/4] mb-4 rounded-lg overflow-hidden border-2 border-border relative"
                style={{ backgroundColor: template.colors.background }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">{template.preview}</div>
                    <div className="px-4">
                      <h3
                        className="text-lg font-bold mb-1"
                        style={{ color: template.colors.primary }}
                      >
                        Jahongir & Sarvinoz
                      </h3>
                      <p
                        className="text-sm opacity-75"
                        style={{ color: template.colors.text }}
                      >
                        15 Iyun 2024
                      </p>
                      <p
                        className="text-xs mt-2 opacity-60"
                        style={{ color: template.colors.text }}
                      >
                        Atirgul Bog'i
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={() => handlePreviewTemplate(template)}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    To'liq Ko'rish
                  </Button>
                </div>
              </div>

              {/* Template Info */}
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {template.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {template.description}
                </p>

                {/* Color Palette */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-muted-foreground">
                    Ranglar:
                  </span>
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: template.colors.primary }}
                    ></div>
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: template.colors.accent }}
                    ></div>
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: template.colors.secondary }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePreviewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ko'rish
                  </Button>
                  <Button asChild className="flex-1">
                    <Link
                      to="/create"
                      state={{ selectedTemplate: template.id }}
                    >
                      Tanlash
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Template Features */}
        <div className="mt-20 mb-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Barcha Shablonlarda Mavjud Imkoniyatlar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Har bir shablon professional darajada yaratilgan va barcha
              zamonaviy imkoniyatlarni o'z ichiga oladi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "🎨",
                title: "Maxsus Rang Palitralari",
                description:
                  "Har bir shablon o'ziga xos professional rang kombinatsiyasiga ega",
              },
              {
                icon: "📱",
                title: "Responsiv Dizayn",
                description:
                  "Barcha qurilmalarda mukammal ko'rinish - telefon, planshet, kompyuter",
              },
              {
                icon: "✏️",
                title: "Oson Tahrirlash",
                description:
                  "Barcha matn va ma'lumotlarni osongina o'zgartirish mumkin",
              },
              {
                icon: "🔗",
                title: "QR Kod Integratsiyasi",
                description: "Har bir taklifnomada avtomatik QR kod yaratiladi",
              },
              {
                icon: "📤",
                title: "Ijtimoiy Ulashish",
                description:
                  "WhatsApp, Telegram, Facebook orqali bir bosishda ulashish",
              },
              {
                icon: "🎯",
                title: "RSVP Funksiyasi",
                description: "Mehmonlar to'g'ridan-to'g'ri javob bera olishadi",
              },
            ].map((feature, index) => (
              <div key={index} className="card-modern p-6 text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Mashhur Kategoriyalar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                category: "classic",
                name: "Klassik",
                description: "An'anaviy va nafis dizaynlar",
                count: "5 ta shablon",
                color: "bg-rose-100 text-rose-800",
              },
              {
                category: "modern",
                name: "Zamonaviy",
                description: "Minimal va zamonaviy uslublar",
                count: "4 ta shablon",
                color: "bg-blue-100 text-blue-800",
              },
              {
                category: "elegant",
                name: "Nafis",
                description: "Hashamatli va chiroyli dizaynlar",
                count: "6 ta shablon",
                color: "bg-purple-100 text-purple-800",
              },
            ].map((cat, index) => (
              <div
                key={index}
                className="card-modern p-8 text-center hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${cat.color}`}
                >
                  {cat.count}
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {cat.name}
                </h3>
                <p className="text-muted-foreground mb-6">{cat.description}</p>
                <Button
                  variant="outline"
                  onClick={() => handleCategoryChange(cat.category)}
                  className="w-full"
                >
                  {cat.name} Shablonlarni Ko'rish
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Template Builder CTA */}
        <div className="mb-16">
          <div className="card-modern p-8 text-center bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              O'zingizning Maxsus Shablonngizni Yarating
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Bizning shablon yaratuvchi vositasi bilan o'zingizning noyob
              dizayningizni yarating. Ranglarni, shriftlarni va tartibni
              o'zingiz tanlang.
            </p>
            <Button
              asChild
              className="primary-gradient px-8 py-4 text-lg rounded-xl hover-lift"
            >
              <Link to="/template-builder">
                <Sparkles className="w-5 h-5 mr-2" />
                Shablon Yaratish
              </Link>
            </Button>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
            O'zingizning taklifnomangizni yaratishga tayyormisiz?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Yuqoridagi shablonlardan birini tanlab, bir necha daqiqada chiroyli
            taklifnoma yarating.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="primary-gradient px-8 py-4 text-lg rounded-xl"
            >
              <Link to="/create">
                Hoziroq Boshlash
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="px-8 py-4 text-lg rounded-xl"
            >
              <Link to="/pricing">Narxlarni Ko'rish</Link>
            </Button>
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
                    <Button asChild>
                      <Link
                        to="/create"
                        state={{ selectedTemplate: previewTemplate.id }}
                      >
                        Bu Shablonni Tanlash
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPreview(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <TemplateRenderer
                  invitation={getMockInvitationData(previewTemplate)}
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
