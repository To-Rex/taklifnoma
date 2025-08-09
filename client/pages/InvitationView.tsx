import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Share2,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Copy,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Phone,
  Mail,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import TemplateRenderer from "@/components/TemplateRenderer";

interface Invitation {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  wedding_time: string | null;
  venue: string;
  address: string;
  city: string | null;
  custom_message: string | null;
  template_id: string;
  is_active: boolean;
  slug: string;
  created_at: string;
}

interface RSVPData {
  guest_name: string;
  will_attend: boolean;
  plus_one_attending: boolean | null;
  message: string | null;
  email: string | null;
  phone: string | null;
}

export default function InvitationView() {
  const { id } = useParams<{ id: string }>();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRSVP, setShowRSVP] = useState(false);
  const [guestName, setGuestName] = useState("");

  const [rsvpData, setRsvpData] = useState<RSVPData>({
    guest_name: "",
    will_attend: true,
    plus_one_attending: null,
    message: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (id) {
      loadInvitation();
    }
  }, [id]);

  const loadInvitation = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // First try to load from Supabase
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        // Fallback to localStorage
        const localData = localStorage.getItem(`invitation_${id}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          setInvitation(parsedData);
        } else {
          throw new Error("Taklifnoma topilmadi");
        }
      } else {
        setInvitation(data);
      }

      // Track view (increment view count)
      // In a real app, you'd want to track unique views
      // await supabase.rpc('increment_views', { invitation_id: id });
    } catch (error: any) {
      console.error("Error loading invitation:", error.message || error);
      setError(error.message || "Taklifnomani yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVPSubmit = async (willAttend: boolean) => {
    if (!invitation || !guestName.trim()) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }

    setRsvpLoading(true);
    setError("");

    try {
      const rsvpSubmission = {
        invitation_id: invitation.id,
        guest_name: guestName,
        will_attend: willAttend,
        plus_one_attending: rsvpData.plus_one_attending,
        message: rsvpData.message || null,
        email: rsvpData.email || null,
        phone: rsvpData.phone || null,
      };

      const { error } = await supabase.from("rsvps").insert([rsvpSubmission]);

      if (error) {
        // Fallback to localStorage
        const existingRSVPs = JSON.parse(
          localStorage.getItem(`rsvps_${invitation.id}`) || "[]",
        );
        existingRSVPs.push({
          ...rsvpSubmission,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(
          `rsvps_${invitation.id}`,
          JSON.stringify(existingRSVPs),
        );
      }

      setSuccess(
        willAttend
          ? "Rahmat! Sizning ishtirokingiz tasdiqlandi 🎉"
          : "Rahmat! Sizning javobingiz qabul qilindi",
      );
      setShowRSVP(false);
      setGuestName("");
      setRsvpData({
        guest_name: "",
        will_attend: true,
        plus_one_attending: null,
        message: "",
        email: "",
        phone: "",
      });
    } catch (error: any) {
      setError(error.message || "RSVP yuborishda xatolik yuz berdi");
    } finally {
      setRsvpLoading(false);
    }
  };

  const shareInvitation = async () => {
    const url = window.location.href;
    const text = `${invitation?.groom_name} & ${invitation?.bride_name} to'y taklifnomasi`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: text,
          text: `Sizni ${invitation?.groom_name} va ${invitation?.bride_name}ning to'y marosimiga taklif qilamiz!`,
          url: url,
        });
      } catch (error) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Havola nusxalandi!");
    } catch (error) {
      setError("Havolani nusxalashda xatolik");
    }
  };

  const shareOnWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `Sizni ${invitation?.groom_name} va ${invitation?.bride_name}ning to'y marosimiga taklif qilamiz! 💒✨`,
    );
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
  };

  const shareOnTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `${invitation?.groom_name} & ${invitation?.bride_name} to'y taklifnomasi`,
    );
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const downloadAsPDF = () => {
    // In a real implementation, you'd generate a PDF
    setSuccess("PDF yuklab olish funksiyasi tez orada qo'shiladi!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50/30 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Taklifnoma yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50/30 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
            Taklifnoma Topilmadi
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Bosh Sahifaga Qaytish
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50/30">
      {/* Header */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Bosh sahifaga qaytish
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={shareInvitation}>
              <Share2 className="w-4 h-4 mr-2" />
              Ulashish
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50/50 animate-fade-in">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50/50 animate-shake">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Invitation Display */}
          <div className="space-y-6">
            <div className="card-modern overflow-hidden">
              <TemplateRenderer
                invitation={invitation}
                guestName={guestName || "Hurmatli Mehmon"}
              />
            </div>

            {/* Share Buttons */}
            <div className="card-modern p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                Taklifnomani Ulashing
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareOnWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  onClick={shareOnTelegram}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
                <Button
                  onClick={() => copyToClipboard(window.location.href)}
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Havolani Nusxalash
                </Button>
                <Button onClick={downloadAsPDF} variant="outline">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Kod
                </Button>
              </div>
            </div>
          </div>

          {/* Event Details & RSVP */}
          <div className="space-y-6">
            {/* Event Details */}
            <div className="card-modern p-6">
              <h3 className="font-heading text-xl font-bold text-foreground mb-6">
                Tadbir Ma'lumotlari
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Sana va Vaqt</p>
                    <p className="text-muted-foreground">
                      {new Date(invitation.wedding_date).toLocaleDateString(
                        "uz-UZ",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                    {invitation.wedding_time && (
                      <p className="text-muted-foreground">
                        Soat: {invitation.wedding_time}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Joy</p>
                    <p className="text-muted-foreground">{invitation.venue}</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.address}
                    </p>
                    {invitation.city && (
                      <p className="text-sm text-muted-foreground">
                        {invitation.city}
                      </p>
                    )}
                  </div>
                </div>

                {invitation.custom_message && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        Maxsus Xabar
                      </p>
                      <p className="text-muted-foreground">
                        {invitation.custom_message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RSVP Section */}
            <div className="card-modern p-6">
              <h3 className="font-heading text-xl font-bold text-foreground mb-6">
                Ishtirok Tasdiqlash (RSVP)
              </h3>

              {!showRSVP ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guestName">Ismingiz</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Ismingizni kiriting"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        if (guestName.trim()) {
                          setRsvpData((prev) => ({
                            ...prev,
                            guest_name: guestName,
                            will_attend: true,
                          }));
                          setShowRSVP(true);
                        } else {
                          setError("Iltimos, ismingizni kiriting");
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Kelaman
                    </Button>
                    <Button
                      onClick={() => {
                        if (guestName.trim()) {
                          handleRSVPSubmit(false);
                        } else {
                          setError("Iltimos, ismingizni kiriting");
                        }
                      }}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Kela olmayman
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✅ Ajoyib! Siz kelishingizni tasdiqlayapsiz
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Qo'shimcha ma'lumotlarni to'ldiring:
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email">Email (ixtiyoriy)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={rsvpData.email}
                      onChange={(e) =>
                        setRsvpData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="example@email.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon (ixtiyoriy)</Label>
                    <Input
                      id="phone"
                      value={rsvpData.phone}
                      onChange={(e) =>
                        setRsvpData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+998 90 123 45 67"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Xabar (ixtiyoriy)</Label>
                    <Textarea
                      id="message"
                      value={rsvpData.message}
                      onChange={(e) =>
                        setRsvpData((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Tilaklar yoki savollaringiz..."
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleRSVPSubmit(true)}
                      disabled={rsvpLoading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {rsvpLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Tasdiqlash
                    </Button>
                    <Button
                      onClick={() => setShowRSVP(false)}
                      variant="outline"
                    >
                      Bekor qilish
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="text-center">
              <Badge
                variant={invitation.is_active ? "default" : "secondary"}
                className="text-sm"
              >
                {invitation.is_active ? "✨ Faol Taklifnoma" : "📋 Noaktiv"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
