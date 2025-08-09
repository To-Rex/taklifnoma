import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Edit,
  Save,
  Upload,
  Camera,
  Shield,
  Bell,
  Trash2,
  Eye,
  Heart,
  Award,
  TrendingUp,
  Users,
  ArrowLeft,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/ProtectedRoute";

interface UserStats {
  totalInvitations: number;
  totalViews: number;
  totalRsvps: number;
  totalGuests: number;
}

interface Invitation {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  venue: string;
  template_id: string;
  is_active: boolean;
  created_at: string;
  views?: number;
  rsvps?: number;
}

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalInvitations: 0,
    totalViews: 0,
    totalRsvps: 0,
    totalGuests: 0,
  });
  const [recentInvitations, setRecentInvitations] = useState<Invitation[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone: "",
    bio: "",
    location: "",
    website: "",
    birth_date: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: "",
        bio: "",
        location: "",
        website: "",
        birth_date: "",
      });
    }
    loadUserStats();
    loadRecentInvitations();
  }, [profile]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Test database connectivity first
      const { error: testError } = await supabase
        .from("invitations")
        .select("id")
        .limit(1);

      if (testError) {
        console.warn("Database not accessible for stats, using default values");
        setStats({
          totalInvitations: 0,
          totalViews: 0,
          totalRsvps: 0,
          totalGuests: 0,
        });
        return;
      }

      // Get total invitations
      const { count: invitationCount, error: invError } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (invError) {
        console.warn("Error loading invitation count:", invError.message);
      }

      // Get invitation IDs for other queries
      const { data: invitationIds, error: idsError } = await supabase
        .from("invitations")
        .select("id")
        .eq("user_id", user.id);

      const invIds = invitationIds?.map((inv) => inv.id) || [];

      let rsvpCount = 0;
      let guestCount = 0;

      if (invIds.length > 0) {
        // Get total RSVPs
        const { count: rCount, error: rsvpError } = await supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .in("invitation_id", invIds);

        if (rsvpError) {
          console.warn("Error loading RSVP count:", rsvpError.message);
        } else {
          rsvpCount = rCount || 0;
        }

        // Get total guests
        const { count: gCount, error: guestError } = await supabase
          .from("guests")
          .select("*", { count: "exact", head: true })
          .in("invitation_id", invIds);

        if (guestError) {
          console.warn("Error loading guest count:", guestError.message);
        } else {
          guestCount = gCount || 0;
        }
      }

      setStats({
        totalInvitations: invitationCount || 0,
        totalViews: Math.floor(Math.random() * 500) + 100, // Demo data for views
        totalRsvps: rsvpCount,
        totalGuests: guestCount,
      });
    } catch (error) {
      console.warn("Error loading user stats, using defaults:", error);
      setStats({
        totalInvitations: 0,
        totalViews: 0,
        totalRsvps: 0,
        totalGuests: 0,
      });
    }
  };

  const loadRecentInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.warn("Error loading recent invitations:", error.message);
        setRecentInvitations([]);
        return;
      }

      setRecentInvitations(data || []);
    } catch (error) {
      console.warn("Error loading recent invitations:", error);
      setRecentInvitations([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      });

      if (error) throw error;

      setSuccess("Profil muvaffaqiyatli yangilandi!");
      setEditMode(false);
    } catch (error: any) {
      setError(error.message || "Profil yangilanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await updateProfile({ avatar_url: data.publicUrl });
      setSuccess("Profil rasmi yangilandi!");
    } catch (error: any) {
      setError(error.message || "Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const achievements = [
    {
      icon: Calendar,
      title: "Birinchi Taklifnoma",
      description: "Birinchi taklifnomangizni yaratdingiz",
      earned: stats.totalInvitations > 0,
    },
    {
      icon: Users,
      title: "Mehmon Mag'nit",
      description: "50+ mehmon taklif qildingiz",
      earned: stats.totalGuests >= 50,
    },
    {
      icon: Heart,
      title: "Sevimli Yaratuvchi",
      description: "10+ taklifnoma yaratdingiz",
      earned: stats.totalInvitations >= 10,
    },
    {
      icon: TrendingUp,
      title: "Popular Taklifnoma",
      description: "100+ ko'rish olganingiz",
      earned: stats.totalViews >= 100,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50/30">
        {/* Header */}
        <nav className="bg-card/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="hover-scale">
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <h1 className="font-heading text-xl font-bold text-foreground">
                Mening Profilim
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <Shield className="w-4 h-4 mr-2" />
                  Sozlamalar
                </Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50/50 animate-fade-in">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50/50 animate-shake">
              <X className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="statistics">Statistika</TabsTrigger>
              <TabsTrigger value="invitations">Taklifnomalar</TabsTrigger>
              <TabsTrigger value="achievements">Yutuqlar</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Info Card */}
                <div className="lg:col-span-2 card-modern p-8 animate-slide-up">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      Shaxsiy Ma'lumotlar
                    </h2>
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      variant="outline"
                      size="sm"
                      className="hover-scale"
                    >
                      {editMode ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Bekor qilish
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Tahrirlash
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">Ism</Label>
                      <Input
                        id="firstName"
                        value={formData.first_name}
                        onChange={(e) =>
                          handleInputChange("first_name", e.target.value)
                        }
                        disabled={!editMode}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Familiya</Label>
                      <Input
                        id="lastName"
                        value={formData.last_name}
                        onChange={(e) =>
                          handleInputChange("last_name", e.target.value)
                        }
                        disabled={!editMode}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!editMode}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefon raqami</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        disabled={!editMode}
                        placeholder="+998 90 123 45 67"
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        disabled={!editMode}
                        placeholder="O'zingiz haqingizda qisqacha ma'lumot..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Joylashuv</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        disabled={!editMode}
                        placeholder="Toshkent, O'zbekiston"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Veb-sayt</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          handleInputChange("website", e.target.value)
                        }
                        disabled={!editMode}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="primary-gradient hover-lift"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Saqlash
                      </Button>
                      <Button
                        onClick={() => setEditMode(false)}
                        variant="outline"
                      >
                        Bekor qilish
                      </Button>
                    </div>
                  )}
                </div>

                {/* Avatar Card */}
                <div className="card-modern p-8 text-center animate-slide-up delay-100">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-6">
                    Profil Rasmi
                  </h3>

                  <div className="relative inline-block mb-6">
                    <Avatar className="w-32 h-32 mx-auto">
                      <AvatarImage
                        src={profile?.avatar_url || ""}
                        alt={profile?.first_name || ""}
                      />
                      <AvatarFallback className="bg-primary text-white text-3xl">
                        {profile?.first_name?.[0] || user?.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ro'yxatdan o'tgan:{" "}
                      {new Date(user?.created_at || "").toLocaleDateString(
                        "uz-UZ",
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="card-modern p-6 text-center animate-slide-up">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalInvitations}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Taklifnomalar
                  </div>
                </div>

                <div className="card-modern p-6 text-center animate-slide-up delay-100">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalViews}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ko'rishlar
                  </div>
                </div>

                <div className="card-modern p-6 text-center animate-slide-up delay-200">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalRsvps}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    RSVP Javoblar
                  </div>
                </div>

                <div className="card-modern p-6 text-center animate-slide-up delay-300">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalGuests}
                  </div>
                  <div className="text-sm text-muted-foreground">Mehmonlar</div>
                </div>
              </div>
            </TabsContent>

            {/* Recent Invitations Tab */}
            <TabsContent value="invitations" className="space-y-6">
              <div className="card-modern p-8">
                <h3 className="font-heading text-xl font-bold text-foreground mb-6">
                  So'nggi Taklifnomalar
                </h3>

                {recentInvitations.length > 0 ? (
                  <div className="space-y-4">
                    {recentInvitations.map((invitation, index) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">
                            {invitation.groom_name} & {invitation.bride_name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>
                              {new Date(
                                invitation.wedding_date,
                              ).toLocaleDateString("uz-UZ")}
                            </span>
                            <span>{invitation.venue}</span>
                            <Badge
                              variant={
                                invitation.is_active ? "default" : "secondary"
                              }
                            >
                              {invitation.is_active ? "Faol" : "Noaktiv"}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/invitation/${invitation.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ko'rish
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Hali taklifnomalar yaratilmagan
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="card-modern p-8">
                <h3 className="font-heading text-xl font-bold text-foreground mb-6">
                  Yutuqlar va Mukofotlar
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {achievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={index}
                        className={`p-6 border-2 rounded-lg transition-all duration-300 animate-slide-up ${
                          achievement.earned
                            ? "border-primary bg-primary/5 hover:bg-primary/10"
                            : "border-border bg-muted/30"
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              achievement.earned
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground">
                                {achievement.title}
                              </h4>
                              {achievement.earned && (
                                <Badge className="bg-primary text-white">
                                  Mukofot
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
